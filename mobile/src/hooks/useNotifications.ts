import { useEffect, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { apiFetch } from '@smart-todo/shared';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export function useNotifications() {
  const notificationListener = useRef<Notifications.Subscription>();
  const responseListener = useRef<Notifications.Subscription>();

  useEffect(() => {
    registerForPushNotifications();

    notificationListener.current = Notifications.addNotificationReceivedListener((notification) => {
      // notification received while app is open — no-op, could show banner
      console.log('[push] received:', notification.request.content.title);
    });

    responseListener.current = Notifications.addNotificationResponseReceivedListener((response) => {
      // user tapped the notification
      const taskId = response.notification.request.content.data?.taskId;
      console.log('[push] tapped, taskId:', taskId);
      // Could navigate to task — for now just log
    });

    return () => {
      if (notificationListener.current) Notifications.removeNotificationSubscription(notificationListener.current);
      if (responseListener.current) Notifications.removeNotificationSubscription(responseListener.current);
    };
  }, []);
}

export async function registerForPushNotifications() {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
    });
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.log('[push] permission denied');
    return;
  }

  try {
    const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;

    // Validate that projectId is a real UUID before calling Expo's push service.
    // Placeholder values like "your-project-id-here" cause a 400 from Expo.
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!projectId || !uuidRegex.test(projectId)) {
      console.log('[push] skipping token registration — projectId missing or not a valid UUID');
      return;
    }
    const token = await Notifications.getExpoPushTokenAsync({ projectId });
    console.log('[push] token:', token.data);

    // Register with backend
    await apiFetch('/api/push/register-expo', {
      method: 'POST',
      body: JSON.stringify({ expo_token: token.data }),
    }).catch((err) => {
      console.error('[push] backend registration failed:', err);
      throw err; // re-throw so callers can detect failure
    });
  } catch (err) {
    console.log('[push] token error:', err);
  }
}
