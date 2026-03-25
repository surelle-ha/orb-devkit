use serde::{Deserialize, Serialize};

/// All messages the mobile app can send to the daemon
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type", content = "payload")]
pub enum AppMessage {
    /// Initiate device pairing (first connection)
    Pair {
        token: String,
        device_name: String,
        device_os: String,
    },

    /// Ping / keep-alive
    Ping { seq: u64 },

    /// Sync ENV variables for a project/environment
    SyncEnv {
        project: String,
        environment: String,
        vars: Vec<EnvVar>,
    },

    /// Delete a project's environment
    DeleteEnv {
        project: String,
        environment: String,
    },

    /// Sync the AI platform blocklist
    SyncBlocklist {
        platforms: Vec<BlockedPlatform>,
    },

    /// Sync vault entries (encrypted on the app side)
    SyncVault {
        entries: Vec<VaultEntry>,
    },

    /// Request a file sync back (daemon → app)
    RequestSync { resource: String },

    /// Trigger a reload notification (e.g. env changed)
    TriggerReload { target: String },
}

/// All messages the daemon can send to the mobile app
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type", content = "payload")]
pub enum DaemonMessage {
    /// Pairing accepted
    PairOk {
        daemon_name: String,
        daemon_version: String,
        fingerprint: String,
    },

    /// Pairing rejected
    PairReject { reason: String },

    /// Error response
    Error { code: String, message: String },

    /// Pong
    Pong { seq: u64, ts: i64 },

    /// Acknowledgement
    Ok { for_type: String },

    /// System metrics (sent periodically when connected)
    Metrics(SystemMetrics),

    /// Reload triggered
    Reloading { target: String },
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EnvVar {
    pub key: String,
    pub value: String,
    #[serde(rename = "type")]
    pub var_type: String,
    pub secret: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BlockedPlatform {
    pub id: String,
    pub name: String,
    pub domains: Vec<String>,
    pub enabled: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VaultEntry {
    pub id: u64,
    pub service: String,
    pub username: String,
    /// AES-GCM encrypted blob (hex), key derived from master password on device
    pub encrypted_password: String,
    pub category: String,
    pub url: String,
    pub notes: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SystemMetrics {
    pub cpu_percent: f32,
    pub ram_used_gb: f32,
    pub ram_total_gb: f32,
    pub uptime_secs: u64,
    pub timestamp: i64,
}

/// Framed message: 4-byte big-endian length prefix + JSON body
pub struct Framer;

impl Framer {
    pub fn encode(msg: &DaemonMessage) -> anyhow::Result<Vec<u8>> {
        let json = serde_json::to_vec(msg)?;
        let len = json.len() as u32;
        let mut buf = Vec::with_capacity(4 + json.len());
        buf.extend_from_slice(&len.to_be_bytes());
        buf.extend_from_slice(&json);
        Ok(buf)
    }

    pub fn decode_app(data: &[u8]) -> anyhow::Result<AppMessage> {
        Ok(serde_json::from_slice(data)?)
    }
}