import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import type { BackendEvent } from './backend';
import { parseEventDateToDate } from './notification-dates';
import { getNotificationRoute, supportsNativeNotifications } from './notification-routing';

if (supportsNativeNotifications(Platform.OS)) {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

export async function ensureNotificationPermissions() {
  if (!supportsNativeNotifications(Platform.OS)) return false;
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('event-reminders', {
      name: 'Rappels d’événements',
      importance: Notifications.AndroidImportance.HIGH,
      sound: 'default',
      vibrationPattern: [0, 200, 120, 200],
      lightColor: '#FF5A36',
    });
  }
  const existing = await Notifications.getPermissionsAsync();
  if (existing.granted || existing.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL) {
    return true;
  }

  const requested = await Notifications.requestPermissionsAsync();
  return requested.granted || requested.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL;
}

export async function getNotificationPermissionStatus(): Promise<'granted' | 'denied' | 'undetermined'> {
  if (!supportsNativeNotifications(Platform.OS)) return 'undetermined';
  const permission = await Notifications.getPermissionsAsync();
  if (permission.granted || permission.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL) return 'granted';
  return permission.canAskAgain ? 'undetermined' : 'denied';
}

export async function scheduleReservationNotifications(event: BackendEvent) {
  const allowed = await ensureNotificationPermissions();
  if (!allowed) {
    return false;
  }

  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Ticket confirmed',
      body: `${event.title} is now in your wallet.`,
      data: { url: `/ticket/${event.id}` },
    },
    trigger: Platform.OS === 'android' ? { channelId: 'event-reminders' } : null,
  });

  const eventDate = parseEventDateToDate(event.date);
  if (!eventDate) {
    return true;
  }

  const reminderDate = new Date(eventDate.getTime() - 2 * 60 * 60 * 1000);
  if (reminderDate.getTime() <= Date.now()) {
    return true;
  }

  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Event reminder',
      body: `${event.title} starts soon at ${event.location}.`,
      data: { url: `/event/${event.id}` },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: reminderDate,
      ...(Platform.OS === 'android' ? { channelId: 'event-reminders' } : {}),
    },
  });

  return true;
}

function routeFromResponse(response: Notifications.NotificationResponse | null) {
  return getNotificationRoute(response?.notification.request.content.data?.url);
}

export async function getLastNotificationRoute(): Promise<string | null> {
  if (!supportsNativeNotifications(Platform.OS)) return null;
  return routeFromResponse(await Notifications.getLastNotificationResponseAsync());
}

export function subscribeToNotificationRoutes(onRoute: (route: string) => void): () => void {
  if (!supportsNativeNotifications(Platform.OS)) return () => undefined;
  const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
    const route = routeFromResponse(response);
    if (route) onRoute(route);
  });
  return () => subscription.remove();
}
