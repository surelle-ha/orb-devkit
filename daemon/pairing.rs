use anyhow::Result;
use base64::Engine;
use qrcode::QrCode;
use serde::{Deserialize, Serialize};

use crate::cert;
use crate::config::Config;

/// Data encoded in the QR code - everything the app needs to connect
#[derive(Debug, Serialize, Deserialize)]
pub struct PairingPayload {
    pub host: String,
    pub port: u16,
    pub token: String,
    pub fingerprint: String,
    pub v: u8,
}

/// Generate a QR code and display it in the terminal
pub async fn show_pairing_qr() -> Result<()> {
    show_pairing_qr_on_port(3132).await
}

pub async fn show_pairing_qr_on_port(plain_ws_port: u16) -> Result<()> {
    let mut cfg = Config::load()?;
    cert::ensure_certs()?;

    let token = cfg.generate_pairing_token()?;
    let fingerprint = cert::server_cert_fingerprint()?;
    let host = local_ip().await;

    let payload = PairingPayload {
        host: host.clone(),
        port: plain_ws_port,
        token: token.clone(),
        fingerprint: fingerprint.clone(),
        v: 1,
    };

    let json = serde_json::to_string(&payload)?;
    let b64 = base64::engine::general_purpose::STANDARD.encode(&json);
    let qr_data = format!("orb-pair://{}", b64);

    let code = QrCode::new(qr_data.as_bytes())?;
    let qr_string = code
        .render::<char>()
        .quiet_zone(false)
        .module_dimensions(2, 1)
        .build();

    // ── Orb ASCII header ──────────────────────────────────────
    println!();
    println!("  ██████╗ ██████╗ ██████╗ ");
    println!("  ██╔═══██╗██╔══██╗██╔══██╗");
    println!("  ██║   ██║██████╔╝██████╔╝");
    println!("  ██║   ██║██╔══██╗██╔══██╗");
    println!("  ╚██████╔╝██║  ██║██████╔╝");
    println!("   ╚═════╝ ╚═╝  ╚═╝╚═════╝ ");
    println!("  ─────────────────────────");
    println!("  D E V K I T  ·  D A E M O N");
    println!("  v{}", env!("CARGO_PKG_VERSION"));
    println!();
    println!("  ┌─────────────────────────────────────────────┐");
    println!("  │              PAIR NEW DEVICE                │");
    println!("  │                                             │");
    println!("  │  Scan this QR code from your Orb mobile     │");
    println!("  │  app to establish a secure connection.      │");
    println!("  │                                             │");
    println!("  │  ⏱  Token expires in 5 minutes             │");
    println!("  │  🔒 Encrypted with AES-256-GCM              │");
    println!("  └─────────────────────────────────────────────┘");
    println!();

    // Print QR code with indent
    for line in qr_string.lines() {
        println!("  {}", line);
    }
    println!();

    // ── Connection details ────────────────────────────────────
    println!("  ┌─────────────────────────────────────────────┐");
    println!("  │  CONNECTION DETAILS                         │");
    println!("  ├─────────────────────────────────────────────┤");
    println!("  │  Plain WS  ▶  ws://{}:{}           │",
        host,
        plain_ws_port
    );
    println!("  │  TLS port  ▶  tls://{}:{}          │",
        host,
        plain_ws_port - 1
    );
    println!("  │                                             │");
    println!("  │  Token  ▶  {}...{}  │",
        &token[..8],
        &token[token.len()-8..]
    );
    println!("  │  Cert   ▶  {}...{}  │",
        &fingerprint[..8],
        &fingerprint[fingerprint.len()-8..]
    );
    println!("  └─────────────────────────────────────────────┘");
    println!();
    println!("  ⚡ Make sure phone & PC are on the same WiFi");
    println!("  🔥 Port {} must not be blocked by firewall", plain_ws_port);
    println!();
    println!("  Waiting for connection...");
    println!();

    Ok(())
}

/// Display daemon status ASCII header
pub fn print_status_header(port: u16) {
    println!();
    println!("  ╔═══════════════════════════════════════════╗");
    println!("  ║   ◉  ORB DEVKIT DAEMON  ·  RUNNING       ║");
    println!("  ╠═══════════════════════════════════════════╣");
    println!("  ║  TLS    ▶  0.0.0.0:{}                  ║", port);
    println!("  ║  WS     ▶  0.0.0.0:{}  (mobile app)   ║", port + 1);
    println!("  ║  mDNS   ▶  _orb._tcp.local.              ║");
    println!("  ╠═══════════════════════════════════════════╣");
    println!("  ║  Run: orb-daemon pair  to connect app     ║");
    println!("  ╚═══════════════════════════════════════════╝");
    println!();
}

async fn local_ip() -> String {
    if let Ok(socket) = tokio::net::UdpSocket::bind("0.0.0.0:0").await {
        if socket.connect("8.8.8.8:80").await.is_ok() {
            if let Ok(addr) = socket.local_addr() {
                return addr.ip().to_string();
            }
        }
    }
    "127.0.0.1".to_string()
}