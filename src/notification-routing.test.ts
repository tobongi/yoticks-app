import assert from 'node:assert/strict';
import test from 'node:test';
import { getNotificationRoute, supportsNativeNotifications } from './notification-routing';

test('native notification response APIs are disabled on web', () => {
  assert.equal(supportsNativeNotifications('web'), false);
  assert.equal(supportsNativeNotifications('ios'), true);
  assert.equal(supportsNativeNotifications('android'), true);
});

test('allows only known in-app notification destinations', () => {
  assert.equal(getNotificationRoute('/event/event_1'), '/event/event_1');
  assert.equal(getNotificationRoute('/ticket/ticket_2'), '/ticket/ticket_2');
  assert.equal(getNotificationRoute('/(tabs)/tickets'), '/(tabs)/tickets');
  assert.equal(getNotificationRoute('/notifications'), '/notifications');
});

test('rejects external, malformed, traversal, and unknown destinations', () => {
  assert.equal(getNotificationRoute('https://evil.example'), null);
  assert.equal(getNotificationRoute('//evil.example'), null);
  assert.equal(getNotificationRoute('/event/../settings'), null);
  assert.equal(getNotificationRoute('/(organizer)/payouts'), null);
  assert.equal(getNotificationRoute(undefined), null);
});
