use anyhow::{Context, Result};
use rcgen::{CertificateParams, DistinguishedName, DnType, KeyPair, SanType};
use std::path::PathBuf;

use crate::config::config_dir;

pub struct CertPaths {
    pub cert: PathBuf,
    pub key: PathBuf,
}

impl CertPaths {
    pub fn server() -> Result<Self> {
        let dir = config_dir()?.join("certs");
        Ok(Self {
            cert: dir.join("server.crt"),
            key: dir.join("server.key"),
        })
    }

    pub fn client_ca() -> Result<Self> {
        let dir = config_dir()?.join("certs");
        Ok(Self {
            cert: dir.join("client_ca.crt"),
            key: dir.join("client_ca.key"),
        })
    }
}

/// Ensure server cert and client CA exist, generating if needed.
pub fn ensure_certs() -> Result<()> {
    let server = CertPaths::server()?;
    let ca = CertPaths::client_ca()?;
    let dir = config_dir()?.join("certs");
    std::fs::create_dir_all(&dir)?;

    if !server.cert.exists() || !server.key.exists() {
        generate_cert(&server, "orb-daemon-server", &["localhost", "127.0.0.1"], true)?;
        tracing::info!("Generated server TLS certificate");
    }

    if !ca.cert.exists() || !ca.key.exists() {
        generate_cert(&ca, "orb-client-ca", &[], false)?;
        tracing::info!("Generated client CA certificate");
    }

    Ok(())
}

fn generate_cert(paths: &CertPaths, cn: &str, sans: &[&str], is_server: bool) -> Result<()> {
    let key_pair = KeyPair::generate()?;

    let mut params = CertificateParams::default();
    let mut dn = DistinguishedName::new();
    dn.push(DnType::CommonName, cn);
    dn.push(DnType::OrganizationName, "Orb DevKit");
    params.distinguished_name = dn;
    params.is_ca = if is_server {
        rcgen::IsCa::Ca(rcgen::BasicConstraints::Constrained(0))
    } else {
        rcgen::IsCa::Ca(rcgen::BasicConstraints::Unconstrained)
    };

    for san in sans {
        if san.parse::<std::net::IpAddr>().is_ok() {
            params.subject_alt_names.push(SanType::IpAddress(san.parse()?));
        } else {
            params.subject_alt_names.push(SanType::DnsName(san.to_string().try_into()?));
        }
    }

    // Valid for 10 years
    params.not_before = rcgen::date_time_ymd(2024, 1, 1);
    params.not_after = rcgen::date_time_ymd(2034, 1, 1);

    let cert = params.self_signed(&key_pair)?;

    std::fs::write(&paths.cert, cert.pem())?;
    std::fs::write(&paths.key, key_pair.serialize_pem())?;

    // Restrict key file permissions on Unix
    #[cfg(unix)]
    {
        use std::os::unix::fs::PermissionsExt;
        std::fs::set_permissions(&paths.key, std::fs::Permissions::from_mode(0o600))?;
    }

    Ok(())
}

/// Load the server TLS config for tokio-rustls
pub fn server_tls_config() -> Result<std::sync::Arc<rustls::ServerConfig>> {
    use rustls::ServerConfig;
    use rustls_pemfile::{certs, private_key};

    let paths = CertPaths::server()?;

    let cert_file = std::fs::File::open(&paths.cert)
        .with_context(|| format!("opening cert {}", paths.cert.display()))?;
    let key_file = std::fs::File::open(&paths.key)
        .with_context(|| format!("opening key {}", paths.key.display()))?;

    let certs: Vec<rustls::pki_types::CertificateDer> = certs(&mut std::io::BufReader::new(cert_file))
        .collect::<Result<Vec<_>, _>>()?;

    let key = private_key(&mut std::io::BufReader::new(key_file))?
        .context("no private key found")?;

    let config = ServerConfig::builder()
        .with_no_client_auth()
        .with_single_cert(certs, key)?;

    Ok(std::sync::Arc::new(config))
}

/// Compute SHA-256 fingerprint of a DER certificate (for device identification)
pub fn cert_fingerprint(cert_der: &[u8]) -> String {
    use sha2::{Digest, Sha256};
    let mut hasher = Sha256::new();
    hasher.update(cert_der);
    hex::encode(hasher.finalize())
}

/// Get our server certificate fingerprint for QR display
pub fn server_cert_fingerprint() -> Result<String> {
    let paths = CertPaths::server()?;
    let pem = std::fs::read_to_string(&paths.cert)?;
    let der = pem_to_der(&pem)?;
    Ok(cert_fingerprint(&der))
}

fn pem_to_der(pem: &str) -> Result<Vec<u8>> {
    use rustls_pemfile::certs;
    let mut reader = std::io::BufReader::new(pem.as_bytes());
    let certs: Vec<_> = certs(&mut reader).collect::<Result<Vec<_>, _>>()?;
    let cert = certs.into_iter().next().context("no cert in PEM")?;
    Ok(cert.to_vec())
}