import * as Notifications from 'expo-notifications';
import type { BackendEvent } from './backend';
import { parseEventDateToDate } from './notification-dates';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function ensureNotificationPermissions() {
  const existing = await Notifications.getPermissionsAsync();
  if (existing.granted || existing.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL) {
    return true;
  }

  const requested = await Notifications.requestPermissionsAsync();
  return requested.granted || requested.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL;
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
    trigger: null,
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
    },
  });

  return true;
}
