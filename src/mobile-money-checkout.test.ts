import assert from 'node:assert/strict';
import test from 'node:test';
import {
  CHECKOUT_PENDING_TIMEOUT_MS,
  getCheckoutActions,
  getNetworksForSelection,
  getPendingTiming,
  sanitizeProviderInstructions,
  type MobileMoneyCountryOption,
} from './mobile-money-checkout';

const options: MobileMoneyCountryOption[] = [
  {
    code: 'CD',
    name: 'République démocratique du Congo',
    currencies: [
      { code: 'CDF', networks: ['vodacom', 'airtel'] },
      { code: 'USD', networks: ['vodacom'] },
    ],
  },
  {
    code: 'SN',
    name: 'Sénégal',
    currencies: [{ code: 'XOF', networks: ['orange', 'wave'] }],
  },
];

test('requires an explicit country and currency before exposing payment networks', () => {
  assert.deepEqual(getNetworksForSelection(options, '', ''), []);
  assert.deepEqual(getNetworksForSelection(options, 'CD', ''), []);
  assert.deepEqual(getNetworksForSelection(options, 'CD', 'CDF'), ['vodacom', 'airtel']);
  assert.deepEqual(getNetworksForSelection(options, 'SN', 'CDF'), []);
});

test('marks a pending checkout as timed out after 90 seconds without making it terminal', () => {
  const startedAt = Date.parse('2026-07-16T10:00:00.000Z');
  const beforeTimeout = getPendingTiming(startedAt, startedAt + CHECKOUT_PENDING_TIMEOUT_MS - 1);
  const afterTimeout = getPendingTiming(startedAt, startedAt + CHECKOUT_PENDING_TIMEOUT_MS);

  assert.equal(beforeTimeout.timedOut, false);
  assert.equal(beforeTimeout.remainingSeconds, 1);
  assert.deepEqual(afterTimeout, { elapsedSeconds: 90, remainingSeconds: 0, timedOut: true });
});

test('offers manual refresh while pending and a fresh attempt only for failed or cancelled payments', () => {
  assert.deepEqual(getCheckoutActions('pending'), { canRefresh: true, canRetry: false, canViewTickets: false });
  assert.deepEqual(getCheckoutActions('failed'), { canRefresh: false, canRetry: true, canViewTickets: false });
  assert.deepEqual(getCheckoutActions('cancelled'), { canRefresh: false, canRetry: true, canViewTickets: false });
  assert.deepEqual(getCheckoutActions('successful'), { canRefresh: false, canRetry: false, canViewTickets: true });
});

test('converts provider instruction markup into readable plain text', () => {
  assert.equal(
    sanitizeProviderInstructions('<p>Composez <strong>*123#</strong><br>puis confirmez&nbsp;le paiement.</p>'),
    'Composez *123# puis confirmez le paiement.',
  );
});
