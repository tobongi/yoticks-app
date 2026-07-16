const EXACT_ROUTES = new Set(['/(tabs)/tickets', '/notifications']);
const DETAIL_ROUTE = /^\/(event|ticket)\/[A-Za-z0-9_-]+$/;

export function supportsNativeNotifications(platform: string) {
  return platform === 'ios' || platform === 'android';
}

export function getNotificationRoute(value: unknown): string | null {
  if (typeof value !== 'string' || !value.startsWith('/') || value.startsWith('//')) return null;
  if (value.includes('..') || value.includes('?') || value.includes('#')) return null;
  return EXACT_ROUTES.has(value) || DETAIL_ROUTE.test(value) ? value : null;
}
