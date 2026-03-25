use anyhow::Result;
use base64::Engine;
use qrcode::QrCode;
use serde::{Deserialize, Serialize};

use crate::cert;
use crate::config::Config;

/// Data encoded in the QR code - everything the app needs to connect
#[derive(Debug, Serialize, Deserialize)]
pub struct PairingPayload {
    /// Daemon's hostname/IP
    pub host: String,
    /// Plain WebSocket port (TLS port + 1, default 3132)
    pub port: u16,
    /// One-time pairing token (5 min TTL)
    pub token: String,
    /// Server cert fingerprint (for TOFU pinning)
    pub fingerprint: String,
    /// Protocol version
    pub v: u8,
}

/// Generate a QR code and display it in the terminal
pub async fn show_pairing_qr() -> Result<()> {
    // Default TLS port is 3131, plain WS port is 3132 (tls_port + 1)
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
        port: plain_ws_port,  // Plain WebSocket port for mobile app
        token: token.clone(),
        fingerprint: fingerprint.clone(),
        v: 1,
    };

    let json = serde_json::to_string(&payload)?;
    let b64 = base64::engine::general_purpose::STANDARD.encode(&json);
    let qr_data = format!("orb-pair://{}", b64);

    let code = QrCode::new(qr_data.as_bytes())?;
    let string = code
        .render::<char>()
        .quiet_zone(false)
        .module_dimensions(2, 1)
        .build();

    println!();
    println!("╔═══════════════════════════════════════════╗");
    println!("║         Orb DevKit — Pair Device          ║");
    println!("╠═══════════════════════════════════════════╣");
    println!("║  Scan this QR code from the Orb app       ║");
    println!("║  Token expires in 5 minutes               ║");
    println!("╚═══════════════════════════════════════════╝");
    println!();
    for line in string.lines() {
        println!("  {}", line);
    }
    println!();
    println!("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    println!("  Plain WebSocket (mobile app): ws://{}:{}/ws", host, plain_ws_port);
    println!("  TLS port (native clients):    tls://{}:{}", host, plain_ws_port - 1);
    println!("  Token:       {}", token);
    println!("  Fingerprint: {}...{}", &fingerprint[..8], &fingerprint[fingerprint.len()-8..]);
    println!("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    println!();
    println!("Make sure your phone and PC are on the same WiFi network.");
    println!("If pairing fails, check that port {} is not blocked by a firewall.", plain_ws_port);
    println!();

    Ok(())
}

async fn local_ip() -> String {
    // Try to find the actual local LAN IP
    if let Ok(socket) = tokio::net::UdpSocket::bind("0.0.0.0:0").await {
        if socket.connect("8.8.8.8:80").await.is_ok() {
            if let Ok(addr) = socket.local_addr() {
                return addr.ip().to_string();
            }
        }
    }
    "127.0.0.1".to_string()
}