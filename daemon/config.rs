use anyhow::{Context, Result};
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use std::path::PathBuf;
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PairedDevice {
    pub id: String,
    pub name: String,
    pub cert_fingerprint: String,
    pub paired_at: DateTime<Utc>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Config {
    pub device_id: String,
    pub paired_devices: Vec<PairedDevice>,
    pub pairing_token: Option<String>,
    pub pairing_token_expires: Option<DateTime<Utc>>,
}

impl Default for Config {
    fn default() -> Self {
        Self {
            device_id: Uuid::new_v4().to_string(),
            paired_devices: vec![],
            pairing_token: None,
            pairing_token_expires: None,
        }
    }
}

impl Config {
    pub fn load() -> Result<Self> {
        let path = config_path()?;
        if !path.exists() {
            let cfg = Config::default();
            cfg.save()?;
            return Ok(cfg);
        }
        let raw = std::fs::read_to_string(&path)
            .with_context(|| format!("reading config from {}", path.display()))?;
        let cfg = serde_json::from_str(&raw)?;
        Ok(cfg)
    }

    pub fn save(&self) -> Result<()> {
        let path = config_path()?;
        let dir = path.parent().unwrap();
        std::fs::create_dir_all(dir)?;
        let json = serde_json::to_string_pretty(self)?;
        std::fs::write(&path, json)?;
        Ok(())
    }

    pub fn reset() -> Result<()> {
        let dir = config_dir()?;
        if dir.exists() {
            std::fs::remove_dir_all(&dir)?;
        }
        Ok(())
    }

    /// Generate a one-time pairing token valid for 5 minutes.
    /// Writes to disk so the running daemon process can read it.
    pub fn generate_pairing_token(&mut self) -> Result<String> {
        use rand::Rng;
        let token: String = rand::thread_rng()
            .sample_iter(&rand::distributions::Alphanumeric)
            .take(32)
            .map(char::from)
            .collect();
        self.pairing_token = Some(token.clone());
        self.pairing_token_expires = Some(Utc::now() + chrono::Duration::minutes(5));
        self.save()?;
        tracing::info!("Pairing token generated, expires in 5 minutes");
        Ok(token)
    }

    /// Validate and consume a pairing token.
    ///
    /// IMPORTANT: This reloads from disk before checking because the token is
    /// written by the `orb-daemon pair` subprocess, while the server runs in a
    /// separate long-lived process holding a stale in-memory Config.
    ///
    /// Flow:
    ///   1. User runs `orb-daemon pair`  → writes token to ~/.orb/config.json
    ///   2. User scans QR on phone       → phone sends Pair{token} over WebSocket
    ///   3. Server (different process)   → calls consume_pairing_token()
    ///   4. We reload from disk          → see the freshly-written token
    ///   5. Token matches + not expired  → consume it, save, return true
    pub fn consume_pairing_token(&mut self, token: &str) -> bool {
        // Reload from disk to pick up tokens written by the 'pair' subprocess
        match Config::load() {
            Ok(fresh) => {
                self.pairing_token         = fresh.pairing_token;
                self.pairing_token_expires = fresh.pairing_token_expires;
                // Also merge in any already-paired devices from disk
                // so we don't lose them on save below
                for device in fresh.paired_devices {
                    if !self.paired_devices.iter().any(|d| d.id == device.id) {
                        self.paired_devices.push(device);
                    }
                }
            }
            Err(e) => {
                tracing::warn!("consume_pairing_token: could not reload config: {}", e);
                // Fall through and try with whatever is in memory
            }
        }

        let stored  = match &self.pairing_token {
            Some(t) => t.clone(),
            None    => {
                tracing::warn!("consume_pairing_token: no token in config (was 'orb-daemon pair' run?)");
                return false;
            }
        };

        let expires = match self.pairing_token_expires {
            Some(t) => t,
            None    => {
                tracing::warn!("consume_pairing_token: token has no expiry");
                return false;
            }
        };

        if stored != token {
            tracing::warn!("consume_pairing_token: token mismatch");
            return false;
        }

        if Utc::now() >= expires {
            tracing::warn!("consume_pairing_token: token expired at {}", expires);
            return false;
        }

        // Valid — consume it
        self.pairing_token         = None;
        self.pairing_token_expires = None;
        if let Err(e) = self.save() {
            tracing::warn!("consume_pairing_token: failed to save after consuming: {}", e);
        }
        tracing::info!("Pairing token consumed successfully");
        true
    }

    pub fn add_device(&mut self, device: PairedDevice) -> Result<()> {
        // Avoid duplicates by cert_fingerprint
        self.paired_devices
            .retain(|d| d.cert_fingerprint != device.cert_fingerprint);
        self.paired_devices.push(device);
        self.save()
    }

    pub fn is_device_paired(&self, cert_fingerprint: &str) -> bool {
        self.paired_devices
            .iter()
            .any(|d| d.cert_fingerprint == cert_fingerprint)
    }
}

pub fn config_dir() -> Result<PathBuf> {
    let base = dirs::home_dir().context("no home dir")?;
    Ok(base.join(".orb"))
}

fn config_path() -> Result<PathBuf> {
    Ok(config_dir()?.join("config.json"))
}