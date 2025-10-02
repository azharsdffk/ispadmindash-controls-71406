import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.e6141b7da52847dbb95c81f2feeeabf2',
  appName: 'ISP Admin Dashboard',
  webDir: 'dist',
  server: {
    url: 'https://e6141b7d-a528-47db-b95c-81f2feeeabf2.lovableproject.com?forceHideBadge=true',
    cleartext: false,
    androidScheme: 'https',
    iosScheme: 'https'
  },
  plugins: {
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert']
    },
    Geolocation: {
      requiresAuthorization: true
    }
  }
};

export default config;
