use anyhow::Result;
use mdns_sd::{ServiceDaemon, ServiceInfo};

const SERVICE_TYPE: &str = "_orb._tcp.local.";

/// Advertise this daemon on the local network via mDNS
/// so the Orb mobile app can find it without manual IP entry
pub fn advertise(port: u16, device_id: &str) -> Result<ServiceDaemon> {
    let daemon = ServiceDaemon::new()?;

    let hostname = hostname::get()
        .ok()
        .and_then(|h| h.into_string().ok())
        .unwrap_or_else(|| "orb-host".to_string());

    let instance_name = format!("orb-{}", &device_id[..8]);

    let mut props = std::collections::HashMap::new();
    props.insert("v".to_string(), "1".to_string());
    props.insert("id".to_string(), device_id.to_string());
    props.insert("port".to_string(), port.to_string());
    props.insert("tls".to_string(), "true".to_string());

    let service = ServiceInfo::new(
        SERVICE_TYPE,
        &instance_name,
        &format!("{}.local.", hostname),
        "",
        port,
        props,
    )?;

    daemon.register(service)?;

    tracing::info!(
        "mDNS: advertising {} on port {} as {}",
        SERVICE_TYPE,
        port,
        instance_name
    );

    Ok(daemon)
}

/// Discover Orb daemons on the local network
pub async fn discover() -> Result<Vec<DiscoveredDaemon>> {
    let daemon = ServiceDaemon::new()?;
    let receiver = daemon.browse(SERVICE_TYPE)?;

    let mut found = vec![];
    let timeout = tokio::time::Duration::from_secs(3);
    let deadline = tokio::time::Instant::now() + timeout;

    loop {
        match tokio::time::timeout_at(deadline, async {
            receiver.recv_async().await
        })
        .await
        {
            Ok(Ok(event)) => {
                if let mdns_sd::ServiceEvent::ServiceResolved(info) = event {
                    let addrs: Vec<String> = info.get_addresses().iter().map(|a| a.to_string()).collect();
                    let props = info.get_properties();
                    found.push(DiscoveredDaemon {
                        instance: info.get_fullname().to_string(),
                        host: addrs.first().cloned().unwrap_or_default(),
                        port: info.get_port(),
                        device_id: props
                            .get("id")
                            .map(|p| p.val_str().to_string())
                            .unwrap_or_default(),
                        tls: props.get("tls").map(|p| p.val_str() == "true").unwrap_or(false),
                    });
                }
            }
            _ => break,
        }
    }

    Ok(found)
}

#[derive(Debug, Clone)]
pub struct DiscoveredDaemon {
    pub instance: String,
    pub host: String,
    pub port: u16,
    pub device_id: String,
    pub tls: bool,
}