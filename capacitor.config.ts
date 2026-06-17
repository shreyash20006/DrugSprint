import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.tgpcop.council',
  appName: 'TGPCOP Student Council',
  webDir: 'dist',
  plugins: {
    GoogleAuth: {
      scopes: ['profile', 'email'],
      clientId: '621820738648-e1ts3u438airf9upt42efl7ofitr45h0.apps.googleusercontent.com',
      forceCodeForRefreshToken: true,
    },
  },
};

export default config;
