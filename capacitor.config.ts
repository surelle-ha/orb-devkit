import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'xyz.surelle.orb-devkit',
  appName: 'Orb DevKit',
  webDir: 'dist',

  // Disable the native Capacitor splash so our Vue SplashScreen shows first
  plugins: {
    SplashScreen: {
      launchShowDuration: 0,       // show for 0ms = disabled immediately
      launchAutoHide: true,
      backgroundColor: '#09090b',  // matches zinc-950 so no flash
      androidSplashResourceName: 'splash',
      showSpinner: false,
    },

    // Hide Android system navigation bar (back / home / recents)
    // This makes the app truly full-screen / edge-to-edge
    StatusBar: {
      overlaysWebView: true,
      style: 'DARK',               // light icons on dark background
    },
  },

  android: {
    // Edge-to-edge: web content draws behind system bars
    // The actual nav bar hide is done via MainActivity + window flags
    backgroundColor: '#09090b',
  },

  ios: {
    backgroundColor: '#09090b',
  },
};

export default config;