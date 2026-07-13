import assert from 'node:assert/strict';
import test from 'node:test';
import { parseEventDateToDate } from './notification-dates';

test('parseEventDateToDate supports seeded french event dates', () => {
  const value = parseEventDateToDate('15 Juin 2026');
  assert.ok(value instanceof Date);
  assert.equal(value?.getFullYear(), 2026);
  assert.equal(value?.getMonth(), 5);
  assert.equal(value?.getDate(), 15);
});

test('parseEventDateToDate returns null for unsupported formats', () => {
  assert.equal(parseEventDateToDate('Tomorrow night'), null);
});
