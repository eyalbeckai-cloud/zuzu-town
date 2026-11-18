import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.zuzutown.app',
  appName: 'Zuzu Town',
  webDir: 'dist',
  backgroundColor: '#ffe3ef',
  android: {
    backgroundColor: '#ffe3ef',
  },
  ios: {
    contentInset: 'never',
    backgroundColor: '#ffe3ef',
    scrollEnabled: false,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 3000,
      launchAutoHide: false,
      backgroundColor: '#ffe3ef',
      showSpinner: false,
      androidScaleType: 'CENTER_CROP',
    },
  },
};

export default config;
