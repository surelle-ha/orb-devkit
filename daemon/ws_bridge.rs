// ws_bridge.rs
// Wraps the WebSocket upgrade path on the same port as raw TCP.
// The daemon listens on :3131. Native TCP clients (future Capacitor plugin)
// connect raw; web/Capacitor-web clients connect via WebSocket upgrade.
// Both paths speak the same framed JSON protocol.

use anyhow::Result;
use futures_util::{SinkExt, StreamExt};
use std::sync::Arc;
use tokio::net::TcpStream;
use tokio::sync::Mutex;
use tokio_rustls::server::TlsStream;
use tokio_tungstenite::{accept_hdr_async_with_config, tungstenite::handshake::server::Request};
use tokio_tungstenite::tungstenite::Message as WsMessage;
use tracing::{info, warn};

use crate::config::Config;
use crate::message::{AppMessage, DaemonMessage, Framer};
use crate::store::Store;

/// Detect if the incoming bytes look like an HTTP/WebSocket upgrade request
pub fn is_http_upgrade(buf: &[u8]) -> bool {
    buf.starts_with(b"GET ") || buf.starts_with(b"OPTIONS ")
}

/// Handle a WebSocket connection over TLS
pub async fn handle_ws_connection(
    stream: TlsStream<TcpStream>,
    peer: std::net::SocketAddr,
    config: Arc<Mutex<Config>>,
    store: Arc<Mutex<Store>>,
) -> Result<()> {
    info!("WS upgrade from {}", peer);

    let ws_stream = accept_hdr_async_with_config(
        stream,
        |_req: &Request, response| {
            // Allow any origin for local connections
            Ok(response)
        },
        None,
    )
    .await?;

    let (mut ws_sender, mut ws_receiver) = ws_stream.split();
    let mut authenticated = false;

    while let Some(msg) = ws_receiver.next().await {
        let msg = match msg {
            Ok(m) => m,
            Err(e) => {
                warn!("WS recv error from {}: {}", peer, e);
                break;
            }
        };

        let data = match msg {
            WsMessage::Binary(b) => b,
            WsMessage::Text(t) => t.into_bytes(),
            WsMessage::Close(_) => break,
            WsMessage::Ping(p) => {
                let _ = ws_sender.send(WsMessage::Pong(p)).await;
                continue;
            }
            _ => continue,
        };

        // Strip 4-byte length prefix if present (native client compat)
        let json_bytes = if data.len() >= 4 {
            let len = u32::from_be_bytes([data[0], data[1], data[2], data[3]]) as usize;
            if len == data.len() - 4 {
                &data[4..]
            } else {
                &data[..]
            }
        } else {
            &data[..]
        };

        let app_msg = match Framer::decode_app(json_bytes) {
            Ok(m) => m,
            Err(e) => {
                let reply = DaemonMessage::Error {
                    code: "PARSE_ERROR".to_string(),
                    message: e.to_string(),
                };
                let _ = ws_sender.send(WsMessage::Binary(Framer::encode(&reply)?)).await;
                continue;
            }
        };

        // Pairing
        if let AppMessage::Pair { token, device_name, device_os } = &app_msg {
            let reply = crate::server::do_pair(&config, token, device_name, device_os).await;
            if matches!(reply, DaemonMessage::PairOk { .. }) {
                authenticated = true;
                info!("WS device paired: {} ({})", device_name, peer);
            }
            ws_sender.send(WsMessage::Binary(Framer::encode(&reply)?)).await?;
            continue;
        }

        // Ping without auth
        if let AppMessage::Ping { seq } = &app_msg {
            let reply = DaemonMessage::Pong {
                seq: *seq,
                ts: chrono::Utc::now().timestamp_millis(),
            };
            ws_sender.send(WsMessage::Binary(Framer::encode(&reply)?)).await?;
            continue;
        }

        // Auth gate
        if !authenticated {
            authenticated = {
                let cfg = config.lock().await;
                !cfg.paired_devices.is_empty()
            };
        }

        if !authenticated {
            let reply = DaemonMessage::Error {
                code: "UNAUTHORIZED".to_string(),
                message: "Pair first: orb-daemon pair".to_string(),
            };
            ws_sender.send(WsMessage::Binary(Framer::encode(&reply)?)).await?;
            continue;
        }

        let reply = crate::server::dispatch_message(&app_msg, &store).await;
        ws_sender.send(WsMessage::Binary(Framer::encode(&reply)?)).await?;
    }

    info!("WS closed: {}", peer);
    Ok(())
}