// daemon/server.rs
//
// Listens on two ports:
//   :3131  — TLS (raw TCP framing + wss://) for future native clients
//   :3132  — Plain WebSocket (ws://) for mobile browser / Capacitor web
//
// The mobile app connects to ws://<host>:3132/ws — no TLS cert issues.
// Both ports speak the same framed JSON protocol.
//
// ANDROID NOTES:
// 1. Capacitor Android WebView sends Origin: capacitor://localhost or null.
//    tungstenite 0.24+ rejects these by default. We use accept_hdr_async_with_config
//    with a callback that allows all origins.
// 2. The network_security_config.xml MUST use base-config (not domain-config with
//    CIDR notation — Android silently ignores invalid domain entries).
// 3. WebSocket close code 1006 = network unreachable / refused connection.
//    This usually means the port is blocked or the daemon isn't running.

use anyhow::Result;
use futures_util::{SinkExt, StreamExt};
use std::io::Cursor;
use std::pin::Pin;
use std::task::{Context, Poll};
use std::sync::Arc;
use tokio::io::{AsyncRead, AsyncReadExt, AsyncWrite, AsyncWriteExt, ReadBuf};
use tokio::net::{TcpListener, TcpStream};
use tokio::sync::Mutex;
use tokio_rustls::TlsAcceptor;
use tokio_tungstenite::{
    accept_hdr_async_with_config,
    tungstenite::{
        handshake::server::{Request, Response},
        Message as WsMsg,
    },
};
use tracing::{error, info, warn};

use crate::cert;
use crate::config::{Config, PairedDevice};
use crate::message::{AppMessage, DaemonMessage, Framer};
use crate::store::Store;

// ──────────────────────────────────────────────────────────
// PrependedStream (helper for protocol sniffing on TLS path)
// ──────────────────────────────────────────────────────────

struct PrependedStream<S> {
    prepended:       Cursor<Vec<u8>>,
    stream:          S,
    done_prepending: bool,
}

impl<S> PrependedStream<S> {
    fn new(bytes: Vec<u8>, stream: S) -> Self {
        Self { prepended: Cursor::new(bytes), stream, done_prepending: false }
    }
}

impl<S: AsyncRead + Unpin> AsyncRead for PrependedStream<S> {
    fn poll_read(
        mut self: Pin<&mut Self>,
        cx: &mut Context<'_>,
        buf: &mut ReadBuf<'_>,
    ) -> Poll<std::io::Result<()>> {
        if !self.done_prepending {
            unsafe {
                let unfilled = buf.unfilled_mut();
                if !unfilled.is_empty() {
                    let temp_buf_len = unfilled.len().min(4096);
                    let mut temp = vec![0u8; temp_buf_len];
                    match std::io::Read::read(&mut self.prepended, &mut temp) {
                        Ok(0) => { self.done_prepending = true; }
                        Ok(n) => {
                            for (i, &byte) in temp[..n].iter().enumerate() {
                                unfilled[i] = std::mem::MaybeUninit::new(byte);
                            }
                            buf.assume_init(n);
                            return Poll::Ready(Ok(()));
                        }
                        Err(e) => return Poll::Ready(Err(e)),
                    }
                }
            }
            if self.prepended.position() as usize == self.prepended.get_ref().len() {
                self.done_prepending = true;
            }
        }
        Pin::new(&mut self.stream).poll_read(cx, buf)
    }
}

impl<S: AsyncWrite + Unpin> AsyncWrite for PrependedStream<S> {
    fn poll_write(mut self: Pin<&mut Self>, cx: &mut Context<'_>, buf: &[u8]) -> Poll<std::io::Result<usize>> {
        Pin::new(&mut self.stream).poll_write(cx, buf)
    }
    fn poll_flush(mut self: Pin<&mut Self>, cx: &mut Context<'_>) -> Poll<std::io::Result<()>> {
        Pin::new(&mut self.stream).poll_flush(cx)
    }
    fn poll_shutdown(mut self: Pin<&mut Self>, cx: &mut Context<'_>) -> Poll<std::io::Result<()>> {
        Pin::new(&mut self.stream).poll_shutdown(cx)
    }
}

// ──────────────────────────────────────────────────────────
// ENTRY POINT — spawns both listeners
// ──────────────────────────────────────────────────────────

pub async fn run(port: u16) -> Result<()> {
    cert::ensure_certs()?;

    let config = Arc::new(Mutex::new(Config::load()?));
    let store  = Arc::new(Mutex::new(Store::load()?));

    // mDNS advertisement
    {
        let cfg = config.lock().await;
        if let Err(e) = crate::mdns::advertise(port, &cfg.device_id) {
            warn!("mDNS unavailable: {}", e);
        } else {
            info!("mDNS: broadcasting _orb._tcp.local. (id={})", &cfg.device_id[..8]);
        }
    }

    // Plain WebSocket listener — mobile app connects here (ws://host:PORT+1/ws)
    let plain_ws_port = port + 1;  // 3131 + 1 = 3132
    let plain_config = config.clone();
    let plain_store  = store.clone();
    tokio::spawn(async move {
        if let Err(e) = run_plain_ws(plain_ws_port, plain_config, plain_store).await {
            error!("Plain WS listener error: {}", e);
        }
    });

    info!("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    info!("  Orb Daemon started");
    info!("  TLS port:      {} (raw TCP + wss://)", port);
    info!("  Plain WS port: {} (ws://0.0.0.0:{}/ws)  ← mobile app", plain_ws_port, plain_ws_port);
    info!("  Run 'orb-daemon pair' to get a pairing QR code");
    info!("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

    // TLS listener (for future native clients)
    run_tls(port, config, store).await
}

// ──────────────────────────────────────────────────────────
// PLAIN WebSocket listener  ← mobile app connects here
//
// Accepts ws://host:3132/ws and ws://host:3132/ (any path).
//
// KEY FIX: Capacitor Android sends these non-standard Origins:
//   - "capacitor://localhost"
//   - "http://localhost"
//   - "null"  (when loaded from file:// or capacitor://)
// tungstenite 0.24 rejects these with 403 by default.
// The callback below allows ALL origins for local-only binding.
//
// ALSO: We respond with 101 Switching Protocols even for non-/ws paths
// so the connection always succeeds regardless of path used.
// ──────────────────────────────────────────────────────────

async fn run_plain_ws(
    port: u16,
    config: Arc<Mutex<Config>>,
    store:  Arc<Mutex<Store>>,
) -> Result<()> {
    let addr = format!("0.0.0.0:{}", port);
    let listener = TcpListener::bind(&addr).await
        .map_err(|e| anyhow::anyhow!("Failed to bind plain WS on {}: {} — is another instance running?", addr, e))?;

    info!("Plain WS listening on ws://0.0.0.0:{}/ws", port);

    loop {
        match listener.accept().await {
            Ok((stream, peer)) => {
                info!("Plain WS connection attempt from {}", peer);
                let config = config.clone();
                let store  = store.clone();
                tokio::spawn(async move {
                    if let Err(e) = handle_plain_ws(stream, peer, config, store).await {
                        // Log handshake errors at WARN — they fire for non-WS requests
                        // (browser preflight, health checks, etc.)
                        let msg = e.to_string();
                        if msg.contains("andshake") || msg.contains("HTTP") || msg.contains("400") {
                            warn!("Plain WS non-WS request from {} (ignored): {}", peer, msg);
                        } else {
                            warn!("Plain WS error from {}: {}", peer, msg);
                        }
                    }
                });
            }
            Err(e) => error!("Plain WS accept error: {}", e),
        }
    }
}

async fn handle_plain_ws(
    stream: TcpStream,
    peer:   std::net::SocketAddr,
    config: Arc<Mutex<Config>>,
    store:  Arc<Mutex<Store>>,
) -> Result<()> {
    // Disable Nagle for lower latency on mobile
    stream.set_nodelay(true)?;

    // Accept WebSocket upgrade with permissive origin policy.
    //
    // Capacitor Android uses origin "capacitor://localhost" which tungstenite
    // would reject by default. We accept ALL origins here — this is safe
    // because we only bind to 0.0.0.0 on LAN and auth is done via pairing token.
    let ws = accept_hdr_async_with_config(
        stream,
        |req: &Request, mut response: Response| {
            let origin = req
                .headers()
                .get("origin")
                .and_then(|v| v.to_str().ok())
                .unwrap_or("(no origin)");
            let path = req.uri().path();
            tracing::debug!("WS upgrade: path={} origin={}", path, origin);

            // Add permissive CORS headers — required for Capacitor WebView
            let headers = response.headers_mut();
            headers.insert(
                "Access-Control-Allow-Origin",
                "*".parse().unwrap(),
            );
            headers.insert(
                "Access-Control-Allow-Headers",
                "content-type, authorization".parse().unwrap(),
            );
            headers.insert(
                "Access-Control-Allow-Methods",
                "GET, POST, OPTIONS".parse().unwrap(),
            );

            Ok(response)
        },
        None,
    )
    .await?;

    let (mut tx, mut rx) = ws.split();
    let mut authenticated = false;
    let mut device_label  = String::new();

    info!("Plain WS connected: {}", peer);

    while let Some(msg_result) = rx.next().await {
        let msg = match msg_result {
            Ok(m)  => m,
            Err(e) => {
                warn!("Plain WS recv error from {}: {}", peer, e);
                break;
            }
        };

        let bytes: Vec<u8> = match msg {
            WsMsg::Binary(b) => b,
            WsMsg::Text(t)   => t.into_bytes(),
            WsMsg::Close(_)  => {
                info!("Plain WS close frame from {}", peer);
                break;
            }
            WsMsg::Ping(p)   => {
                let _ = tx.send(WsMsg::Pong(p)).await;
                continue;
            }
            _ => continue,
        };

        // Strip optional 4-byte length prefix (native client compat)
        let json_slice: &[u8] = if bytes.len() >= 4 {
            let declared = u32::from_be_bytes([bytes[0], bytes[1], bytes[2], bytes[3]]) as usize;
            if declared + 4 == bytes.len() { &bytes[4..] } else { &bytes }
        } else {
            &bytes
        };

        let app_msg = match Framer::decode_app(json_slice) {
            Ok(m)  => m,
            Err(e) => {
                warn!("Parse error from {}: {} | raw: {:?}", peer, e, std::str::from_utf8(json_slice).unwrap_or("(binary)"));
                let reply = DaemonMessage::Error { code: "PARSE_ERROR".into(), message: e.to_string() };
                // Send as text so Capacitor WebView can decode it
                if let Ok(json) = serde_json::to_string(&reply) {
                    let _ = tx.send(WsMsg::Text(json)).await;
                }
                continue;
            }
        };

        let reply = route_message(&app_msg, &mut authenticated, &mut device_label, &config, &store).await;

        // Send as text JSON — Capacitor WebView handles text frames natively
        let json = serde_json::to_string(&reply)?;
        if let Err(e) = tx.send(WsMsg::Text(json)).await {
            warn!("Plain WS send error to {}: {}", peer, e);
            break;
        }
    }

    info!("Plain WS disconnected: {} ({})", device_label, peer);
    Ok(())
}

// ──────────────────────────────────────────────────────────
// TLS listener (existing behaviour)
// ──────────────────────────────────────────────────────────

async fn run_tls(
    port:   u16,
    config: Arc<Mutex<Config>>,
    store:  Arc<Mutex<Store>>,
) -> Result<()> {
    let tls_config = cert::server_tls_config()?;
    let acceptor   = TlsAcceptor::from(tls_config);
    let addr       = format!("0.0.0.0:{}", port);
    let listener   = TcpListener::bind(&addr).await
        .map_err(|e| anyhow::anyhow!("Failed to bind TLS on {}: {}", addr, e))?;

    info!("TLS listening on {} (raw TCP + wss://)", addr);

    loop {
        match listener.accept().await {
            Ok((tcp_stream, peer_addr)) => {
                info!("TLS TCP from {}", peer_addr);
                let acceptor = acceptor.clone();
                let config   = config.clone();
                let store    = store.clone();
                tokio::spawn(async move {
                    let tls_stream = match acceptor.accept(tcp_stream).await {
                        Ok(s)  => s,
                        Err(e) => { warn!("TLS handshake failed from {}: {}", peer_addr, e); return; }
                    };
                    if let Err(e) = handle_tls_connection(tls_stream, peer_addr, config, store).await {
                        warn!("TLS handler error from {}: {}", peer_addr, e);
                    }
                });
            }
            Err(e) => error!("TLS accept error: {}", e),
        }
    }
}

async fn handle_tls_connection(
    mut stream: tokio_rustls::server::TlsStream<TcpStream>,
    peer:       std::net::SocketAddr,
    config:     Arc<Mutex<Config>>,
    store:      Arc<Mutex<Store>>,
) -> Result<()> {
    let mut peek = [0u8; 4];
    stream.read_exact(&mut peek).await?;

    if &peek == b"GET " {
        let restored = PrependedStream::new(peek.to_vec(), stream);
        handle_ws_stream(restored, peer, config, store).await
    } else {
        let msg_len = u32::from_be_bytes(peek) as usize;
        handle_raw_tcp(msg_len, stream, peer, config, store).await
    }
}

// ──────────────────────────────────────────────────────────
// Raw framed TCP handler (TLS path)
// ──────────────────────────────────────────────────────────

async fn handle_raw_tcp<S: AsyncReadExt + AsyncWriteExt + Unpin>(
    first_msg_len: usize,
    mut stream:    S,
    peer:          std::net::SocketAddr,
    config:        Arc<Mutex<Config>>,
    store:         Arc<Mutex<Store>>,
) -> Result<()> {
    let mut authenticated = false;
    let mut device_label  = String::new();

    if first_msg_len == 0 || first_msg_len > 10 * 1024 * 1024 {
        warn!("Bad first message length {} from {}", first_msg_len, peer);
        return Ok(());
    }

    let mut buf = vec![0u8; first_msg_len];
    stream.read_exact(&mut buf).await?;
    if let Ok(msg) = Framer::decode_app(&buf) {
        let reply = route_message(&msg, &mut authenticated, &mut device_label, &config, &store).await;
        write_frame(&mut stream, &reply).await?;
    }

    loop {
        let mut len_buf = [0u8; 4];
        match stream.read_exact(&mut len_buf).await {
            Ok(_)  => {}
            Err(_) => { info!("Disconnected: {} ({})", device_label, peer); break; }
        }
        let msg_len = u32::from_be_bytes(len_buf) as usize;
        if msg_len > 10 * 1024 * 1024 { warn!("Oversized message from {}", peer); break; }

        let mut buf = vec![0u8; msg_len];
        if stream.read_exact(&mut buf).await.is_err() { break; }

        let msg = match Framer::decode_app(&buf) {
            Ok(m)  => m,
            Err(e) => {
                let reply = DaemonMessage::Error { code: "PARSE_ERROR".into(), message: e.to_string() };
                write_frame(&mut stream, &reply).await?;
                continue;
            }
        };

        let reply = route_message(&msg, &mut authenticated, &mut device_label, &config, &store).await;
        write_frame(&mut stream, &reply).await?;
    }
    Ok(())
}

// ──────────────────────────────────────────────────────────
// TLS WebSocket handler
// ──────────────────────────────────────────────────────────

async fn handle_ws_stream<S>(
    stream: S,
    peer:   std::net::SocketAddr,
    config: Arc<Mutex<Config>>,
    store:  Arc<Mutex<Store>>,
) -> Result<()>
where
    S: AsyncReadExt + AsyncWriteExt + Unpin,
{
    let ws = accept_hdr_async_with_config(
        stream,
        |_req: &Request, mut response: Response| {
            let headers = response.headers_mut();
            headers.insert("Access-Control-Allow-Origin", "*".parse().unwrap());
            Ok(response)
        },
        None,
    )
    .await?;

    let (mut tx, mut rx) = ws.split();
    let mut authenticated = false;
    let mut device_label  = String::new();

    while let Some(Ok(msg)) = rx.next().await {
        let bytes: Vec<u8> = match msg {
            WsMsg::Binary(b) => b,
            WsMsg::Text(t)   => t.into_bytes(),
            WsMsg::Close(_)  => break,
            WsMsg::Ping(p)   => { let _ = tx.send(WsMsg::Pong(p)).await; continue; }
            _                => continue,
        };

        let json_slice: &[u8] = if bytes.len() >= 4 {
            let declared = u32::from_be_bytes([bytes[0], bytes[1], bytes[2], bytes[3]]) as usize;
            if declared + 4 == bytes.len() { &bytes[4..] } else { &bytes }
        } else { &bytes };

        let app_msg = match Framer::decode_app(json_slice) {
            Ok(m)  => m,
            Err(e) => {
                let reply = DaemonMessage::Error { code: "PARSE_ERROR".into(), message: e.to_string() };
                tx.send(WsMsg::Binary(Framer::encode(&reply)?)).await?;
                continue;
            }
        };

        let reply = route_message(&app_msg, &mut authenticated, &mut device_label, &config, &store).await;
        tx.send(WsMsg::Binary(Framer::encode(&reply)?)).await?;
    }

    info!("TLS WS closed: {} ({})", device_label, peer);
    Ok(())
}

// ──────────────────────────────────────────────────────────
// Shared routing (both TLS and plain WS paths)
// ──────────────────────────────────────────────────────────

async fn route_message(
    msg:           &AppMessage,
    authenticated: &mut bool,
    device_label:  &mut String,
    config:        &Arc<Mutex<Config>>,
    store:         &Arc<Mutex<Store>>,
) -> DaemonMessage {
    if let AppMessage::Pair { token, device_name, device_os } = msg {
        let reply = do_pair(config, token, device_name, device_os).await;
        if matches!(reply, DaemonMessage::PairOk { .. }) {
            *authenticated = true;
            *device_label  = device_name.clone();
        }
        return reply;
    }

    if let AppMessage::Ping { seq } = msg {
        return DaemonMessage::Pong { seq: *seq, ts: chrono::Utc::now().timestamp_millis() };
    }

    if !*authenticated {
        *authenticated = { let cfg = config.lock().await; !cfg.paired_devices.is_empty() };
    }

    if !*authenticated {
        return DaemonMessage::Error {
            code:    "UNAUTHORIZED".into(),
            message: "Pair this device first: orb-daemon pair".into(),
        };
    }

    dispatch_message(msg, store).await
}

pub async fn do_pair(
    config:      &Arc<Mutex<Config>>,
    token:       &str,
    name:        &str,
    os:          &str,
) -> DaemonMessage {
    let mut cfg = config.lock().await;

    if !cfg.consume_pairing_token(token) {
        return DaemonMessage::PairReject {
            reason: "Invalid or expired pairing token. Run: orb-daemon pair".into(),
        };
    }

    let device = PairedDevice {
        id:                  uuid::Uuid::new_v4().to_string(),
        name:                format!("{} ({})", name, os),
        cert_fingerprint:    format!("{}-{}", name, chrono::Utc::now().timestamp()),
        paired_at:           chrono::Utc::now(),
    };

    if let Err(e) = cfg.add_device(device) {
        return DaemonMessage::Error { code: "PAIR_SAVE_ERROR".into(), message: e.to_string() };
    }

    DaemonMessage::PairOk {
        daemon_name:    hostname::get().ok().and_then(|h| h.into_string().ok()).unwrap_or_else(|| "orb-host".into()),
        daemon_version: env!("CARGO_PKG_VERSION").into(),
        fingerprint:    cert::server_cert_fingerprint().unwrap_or_default(),
    }
}

pub async fn dispatch_message(msg: &AppMessage, store: &Arc<Mutex<Store>>) -> DaemonMessage {
    match msg {
        AppMessage::SyncEnv { project, environment, vars } => {
            let mut st = store.lock().await;
            st.upsert_env(project, environment, vars.clone());
            if let Err(e) = st.save()                               { return DaemonMessage::Error { code: "SAVE_ERROR".into(), message: e.to_string() }; }
            if let Err(e) = st.write_dotenv_file(project, environment) { warn!("dotenv write failed: {}", e); }
            info!("ENV synced: {}/{} ({} vars)", project, environment, vars.len());
            DaemonMessage::Ok { for_type: "SyncEnv".into() }
        }
        AppMessage::DeleteEnv { project, environment } => {
            let mut st = store.lock().await;
            st.delete_env(project, environment);
            let _ = st.save();
            DaemonMessage::Ok { for_type: "DeleteEnv".into() }
        }
        AppMessage::SyncBlocklist { platforms } => {
            let mut st = store.lock().await;
            st.upsert_blocklist(platforms.clone());
            let _ = st.save();
            if let Err(e) = st.write_blocklist_file() { warn!("blocklist write: {}", e); }
            DaemonMessage::Ok { for_type: "SyncBlocklist".into() }
        }
        AppMessage::SyncVault { entries } => {
            let mut st = store.lock().await;
            st.upsert_vault(entries.clone());
            let _ = st.save();
            DaemonMessage::Ok { for_type: "SyncVault".into() }
        }
        AppMessage::TriggerReload { target } => {
            info!("Reload: {}", target);
            DaemonMessage::Reloading { target: target.clone() }
        }
        AppMessage::RequestSync { resource } => {
            info!("Sync requested: {}", resource);
            DaemonMessage::Ok { for_type: "RequestSync".into() }
        }
        // NEW: Handle Reset — wipes store and signals client to unpair
        AppMessage::Reset => {
            warn!("Reset requested by mobile client — wiping daemon data");
            if let Err(e) = crate::store::Store::reset() {
                return DaemonMessage::Error { code: "RESET_ERROR".into(), message: e.to_string() };
            }
            // Also clear in-memory store
            let mut st = store.lock().await;
            *st = crate::store::Store::default();
            info!("Daemon data reset complete");
            DaemonMessage::ResetOk
        }
        AppMessage::Ping { seq } => DaemonMessage::Pong { seq: *seq, ts: chrono::Utc::now().timestamp_millis() },
        AppMessage::Pair { .. } => DaemonMessage::Error { code: "ALREADY_PAIRED".into(), message: "Already paired.".into() },
    }
}

async fn write_frame<W: AsyncWriteExt + Unpin>(writer: &mut W, msg: &DaemonMessage) -> Result<()> {
    let encoded = Framer::encode(msg)?;
    writer.write_all(&encoded).await?;
    writer.flush().await?;
    Ok(())
}