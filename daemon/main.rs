mod cert;
mod config;
mod crypto;
mod mdns;
mod message;
mod pairing;
mod server;
mod store;
mod ws_bridge;

use anyhow::Result;
use clap::{Parser, Subcommand};
use tracing::{info, warn};
use tracing_subscriber::{EnvFilter, fmt};

#[derive(Parser)]
#[command(name = "orb-daemon", version, about = "Orb DevKit desktop daemon")]
struct Cli {
    #[command(subcommand)]
    command: Option<Commands>,
}

#[derive(Subcommand)]
enum Commands {
    /// Start the daemon (default)
    Start {
        /// TCP port to listen on
        #[arg(short, long, default_value_t = 3131)]
        port: u16,
    },
    /// Show pairing QR code for a new device
    Pair,
    /// List paired devices
    Devices,
    /// Export stored .env file for a project
    Export {
        #[arg(short, long)]
        project: String,
        #[arg(short, long, default_value = "dev")]
        env: String,
    },
    /// Reset all data and certificates
    Reset,
    /// Show daemon status
    Status,
}

#[tokio::main]
async fn main() -> Result<()> {
    fmt()
        .with_env_filter(
            EnvFilter::try_from_default_env()
                .unwrap_or_else(|_| EnvFilter::new("orb_daemon=info,warn")),
        )
        .with_target(false)
        .compact()
        .init();

    // Install the default Rustls crypto provider (ring)
    let _ = rustls::crypto::ring::default_provider().install_default();

    let cli = Cli::parse();

    match cli.command.unwrap_or(Commands::Start { port: 3131 }) {
        Commands::Start { port } => {
            info!("Starting Orb daemon on port {}", port);
            server::run(port).await?;
        }
        Commands::Pair => {
            pairing::show_pairing_qr().await?;
        }
        Commands::Devices => {
            let cfg = config::Config::load()?;
            if cfg.paired_devices.is_empty() {
                println!("No paired devices.");
            } else {
                println!("Paired devices:");
                for d in &cfg.paired_devices {
                    println!("  {} — {} ({})", d.id, d.name, d.paired_at);
                }
            }
        }
        Commands::Export { project, env } => {
            let st = store::Store::load()?;
            match st.export_dotenv(&project, &env) {
                Some(content) => println!("{}", content),
                None => eprintln!("Project '{}' env '{}' not found.", project, env),
            }
        }
        Commands::Reset => {
            warn!("Resetting all Orb daemon data...");
            config::Config::reset()?;
            store::Store::reset()?;
            println!("Reset complete. Re-pair your device with: orb-daemon pair");
        }
        Commands::Status => {
            let cfg = config::Config::load()?;
            println!("Orb Daemon v{}", env!("CARGO_PKG_VERSION"));
            println!("Config dir: {}", config::config_dir()?.display());
            println!("Paired devices: {}", cfg.paired_devices.len());
            println!("Device ID: {}", cfg.device_id);
        }
    }

    Ok(())
}