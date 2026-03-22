import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.safesignal.app',
  appName: 'SafeSignal',
  webDir: 'dist/public',
  server: {
    androidScheme: 'https',
    iosScheme: 'https',
  },
  plugins: {
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
    LocalNotifications: {
      smallIcon: 'ic_notification',
      iconColor: '#8B5CF6',
      sound: 'notification.wav',
    },
    StatusBar: {
      style: 'dark',
      backgroundColor: '#8B5CF6',
    },
  },
};

export default config;
