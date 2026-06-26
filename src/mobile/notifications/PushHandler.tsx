import React, { useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';

/**
 * Push Notification handler / deep-link router.
 *
 * On native Android: uses Capacitor's window bridge (capacitorExports) to listen
 * for FCM token & notification action events without a direct package import,
 * so the bundler never needs to resolve @capacitor/push-notifications at build time.
 *
 * On web: wires OneSignal notification-click events for SPA deep-link routing.
 *
 * Expected notification payload:
 *   { title, body, data: { route: '/notices' | '/events' | ... } }
 */
export const PushHandler: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) {
      // Web: wire OneSignal notification-click → navigate
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const OneSignal = (window as any).OneSignal;
        if (OneSignal?.on) {
          OneSignal.on('notificationClick', (event: { result?: { url?: string } }) => {
            const url = event?.result?.url;
            if (url) {
              const path = url.replace(window.location.origin, '');
              if (path && path.startsWith('/')) navigate(path);
            }
          });
        }
      } catch {
        // OneSignal not loaded — ignore
      }
      return;
    }

    // Native Android: access Capacitor's plugin bridge without a static import.
    // This avoids Rolldown/Rollup needing to resolve @capacitor/push-notifications.
    const setupPush = async () => {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { Plugins } = (window as any).Capacitor ?? {};
        const PushNotifications = Plugins?.PushNotifications;
        if (!PushNotifications) return; // plugin bridge not available

        // Request permission
        const perm = await PushNotifications.checkPermissions();
        if (perm?.receive === 'prompt') {
          await PushNotifications.requestPermissions();
        }

        // Register with FCM
        await PushNotifications.register();

        // Persist FCM token to Supabase profile
        PushNotifications.addListener('registration', async (token: { value: string }) => {
          try {
            const { data: { user } } = await supabase.auth.getUser();
            if (user && token?.value) {
              await supabase
                .from('profiles')
                .update({ fcm_token: token.value })
                .eq('id', user.id);
            }
          } catch {
            // Non-critical — ignore
          }
        });

        // Deep-link on notification tap
        PushNotifications.addListener(
          'pushNotificationActionPerformed',
          (action: { notification?: { data?: { route?: string } } }) => {
            const route = action?.notification?.data?.route;
            if (route && route.startsWith('/')) {
              navigate(route);
            }
          }
        );
      } catch {
        // Plugin not available on this build — silently skip
      }
    };

    setupPush();
  }, [navigate]);

  return null;
};

export default PushHandler;
