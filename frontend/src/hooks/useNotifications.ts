import { useState, useEffect } from 'react';
import { subscribePush, unsubscribePush } from '../api/push';

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
}

export function useNotifications() {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [registered, setRegistered] = useState(false);

  useEffect(() => {
    if ('Notification' in window) setPermission(Notification.permission);
    // Check if already subscribed
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then((reg) => {
        reg.pushManager.getSubscription().then((sub) => {
          if (sub) setRegistered(true);
        });
      }).catch(() => {});
    }
  }, []);

  async function register() {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;

    try {
      const reg = await navigator.serviceWorker.register('/sw.js');
      const perm = await Notification.requestPermission();
      setPermission(perm);
      if (perm !== 'granted') return;

      const vapidKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
      if (!vapidKey) return;

      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey) as unknown as ArrayBuffer,
      });

      await subscribePush(sub);
      setRegistered(true);
    } catch (err) {
      console.error('[Notifications] Registration failed:', err);
    }
  }

  async function unregister() {
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) await sub.unsubscribe();
      await unsubscribePush();
      setRegistered(false);
    } catch (err) {
      console.error('[Notifications] Unsubscribe failed:', err);
    }
  }

  return { permission, registered, register, unregister };
}
