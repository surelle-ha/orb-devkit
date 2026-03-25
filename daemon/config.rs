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

    /// Generate a one-time pairing token valid for 5 minutes
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
        Ok(token)
    }

    /// Validate a pairing token. Returns true if valid, consuming it.
    pub fn consume_pairing_token(&mut self, token: &str) -> bool {
        if let (Some(stored), Some(expires)) =
            (&self.pairing_token.clone(), self.pairing_token_expires)
        {
            if stored == token && Utc::now() < expires {
                self.pairing_token = None;
                self.pairing_token_expires = None;
                let _ = self.save();
                return true;
            }
        }
        false
    }

    pub fn add_device(&mut self, device: PairedDevice) -> Result<()> {
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