import type { BackendEvent } from './backend';

export async function ensureNotificationPermissions() {
  return false;
}

export async function getNotificationPermissionStatus(): Promise<'undetermined'> {
  return 'undetermined';
}

export async function scheduleReservationNotifications(_event: BackendEvent) {
  return false;
}

export async function getLastNotificationRoute(): Promise<null> {
  return null;
}

export function subscribeToNotificationRoutes(_onRoute: (route: string) => void): () => void {
  return () => undefined;
}
