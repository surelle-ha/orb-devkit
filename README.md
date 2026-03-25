# Orb DevKit

A mobile companion app for the Orb daemon, enabling seamless synchronization of environment variables, AI blocklists, and secure password storage between your desktop and mobile device.

## Features

- **QR Code Pairing** — Scan to connect your mobile device to the Orb daemon
- **Environment Sync** — Auto-sync .env variables across projects and environments
- **AI Blocklist** — Block access to AI platforms during focus sessions
- **Vault** — Encrypted password manager with daemon sync
- **Focus Timer** — Vibecode focus sessions with platform blocking
- **Device Monitoring** — Real-time CPU, memory, GPU, and network metrics

## Quick Start

### Prerequisites

- Node.js 18+
- pnpm
- Capacitor CLI
- Android Studio (for mobile development)

### Installation

```bash
# Install dependencies
pnpm install

# Development server
pnpm dev

# Build for Android
pnpm build
pnpm android:sync
pnpm android:run
```

### Pairing with Daemon

1. Start the Orb daemon on your desktop:
   ```bash
   orb-daemon pair
   ```

2. Open the app and navigate to **Devices**
3. Tap **Pair Desktop** and scan the QR code
4. Confirm the pairing

## License

MIT