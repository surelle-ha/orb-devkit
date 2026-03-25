use anyhow::{Context, Result};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::path::PathBuf;

use crate::config::config_dir;
use crate::message::{BlockedPlatform, EnvVar, VaultEntry};

#[derive(Debug, Default, Serialize, Deserialize)]
pub struct Store {
    /// project_name → env_name → vars
    pub envs: HashMap<String, HashMap<String, Vec<EnvVar>>>,
    pub blocklist: Vec<BlockedPlatform>,
    pub vault: Vec<VaultEntry>,
}

impl Store {
    pub fn load() -> Result<Self> {
        let path = store_path()?;
        if !path.exists() {
            return Ok(Self::default());
        }
        let raw = std::fs::read_to_string(&path)
            .with_context(|| format!("reading store from {}", path.display()))?;
        Ok(serde_json::from_str(&raw)?)
    }

    pub fn save(&self) -> Result<()> {
        let path = store_path()?;
        let dir = path.parent().unwrap();
        std::fs::create_dir_all(dir)?;
        let json = serde_json::to_string_pretty(self)?;
        std::fs::write(&path, json)?;
        Ok(())
    }

    pub fn reset() -> Result<()> {
        let path = store_path()?;
        if path.exists() {
            std::fs::remove_file(path)?;
        }
        // Also clean up written .env files
        let env_dir = config_dir()?.join("envs");
        if env_dir.exists() {
            std::fs::remove_dir_all(env_dir)?;
        }
        Ok(())
    }

    pub fn upsert_env(&mut self, project: &str, environment: &str, vars: Vec<EnvVar>) {
        self.envs
            .entry(project.to_string())
            .or_default()
            .insert(environment.to_string(), vars);
    }

    pub fn delete_env(&mut self, project: &str, environment: &str) {
        if let Some(envs) = self.envs.get_mut(project) {
            envs.remove(environment);
            if envs.is_empty() {
                self.envs.remove(project);
            }
        }
    }

    /// Write a .env file to ~/.orb/envs/<project>/<env>.env
    pub fn write_dotenv_file(&self, project: &str, environment: &str) -> Result<()> {
        let vars = self
            .envs
            .get(project)
            .and_then(|e| e.get(environment))
            .cloned()
            .unwrap_or_default();

        let dir = config_dir()?.join("envs").join(project);
        std::fs::create_dir_all(&dir)?;
        let path = dir.join(format!("{}.env", environment));

        let content = vars
            .iter()
            .map(|v| format!("{}={}", v.key, v.value))
            .collect::<Vec<_>>()
            .join("\n");

        std::fs::write(&path, content + "\n")?;
        tracing::info!("Written: {}", path.display());
        Ok(())
    }

    /// Export vars as .env string
    pub fn export_dotenv(&self, project: &str, environment: &str) -> Option<String> {
        let vars = self.envs.get(project)?.get(environment)?;
        let content = vars
            .iter()
            .map(|v| format!("{}={}", v.key, v.value))
            .collect::<Vec<_>>()
            .join("\n");
        Some(content)
    }

    pub fn upsert_blocklist(&mut self, platforms: Vec<BlockedPlatform>) {
        self.blocklist = platforms;
    }

    pub fn upsert_vault(&mut self, entries: Vec<VaultEntry>) {
        self.vault = entries;
    }

    /// Write the blocklist as a hosts-file snippet
    pub fn write_blocklist_file(&self) -> Result<()> {
        let enabled: Vec<&BlockedPlatform> = self.blocklist.iter().filter(|p| p.enabled).collect();

        let dir = config_dir()?.join("blocklist");
        std::fs::create_dir_all(&dir)?;
        let path = dir.join("blocked.hosts");

        let mut lines = vec!["# Orb DevKit - Vibecode blocklist".to_string()];
        lines.push(format!("# Updated: {}", chrono::Utc::now().to_rfc3339()));
        lines.push(String::new());

        for platform in &enabled {
            lines.push(format!("# {}", platform.name));
            for domain in &platform.domains {
                lines.push(format!("127.0.0.1 {}", domain));
                lines.push(format!("127.0.0.1 www.{}", domain));
            }
            lines.push(String::new());
        }

        std::fs::write(&path, lines.join("\n"))?;
        tracing::info!("Written blocklist: {} platforms → {}", enabled.len(), path.display());
        Ok(())
    }
}

fn store_path() -> Result<PathBuf> {
    Ok(config_dir()?.join("store.json"))
}