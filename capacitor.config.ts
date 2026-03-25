import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'xyz.surelle.orb-devkit',
  appName: 'Orb DevKit',
  webDir: 'dist',

  plugins: {
    SplashScreen: {
      launchShowDuration: 0,
      launchAutoHide: true,
      backgroundColor: '#09090b',
      androidSplashResourceName: 'splash',
      showSpinner: false,
    },

    StatusBar: {
      overlaysWebView: true,
      style: 'DARK',
    },
  },

  android: {
    backgroundColor: '#09090b',
  },

  ios: {
    backgroundColor: '#09090b',
  },
};

export default config;