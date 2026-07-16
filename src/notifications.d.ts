import type { BackendEvent } from './backend';

export function ensureNotificationPermissions(): Promise<boolean>;
export function getNotificationPermissionStatus(): Promise<'granted' | 'denied' | 'undetermined'>;
export function scheduleReservationNotifications(event: BackendEvent): Promise<boolean>;
export function getLastNotificationRoute(): Promise<string | null>;
export function subscribeToNotificationRoutes(onRoute: (route: string) => void): () => void;
