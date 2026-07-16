import assert from 'node:assert/strict';
import test from 'node:test';
import { getCheckoutReadiness } from './checkout-readiness';

test('free tickets remain reservable without a payment provider', () => {
  assert.deepEqual(getCheckoutReadiness({ amount: 0, paidCheckoutEnabled: false }), { allowed: true, reason: null });
});

test('paid tickets fail closed until the verified provider flow is enabled', () => {
  assert.deepEqual(getCheckoutReadiness({ amount: 5000, paidCheckoutEnabled: false }), {
    allowed: false,
    reason: 'Le paiement en ligne n’est pas encore disponible pour cet événement.',
  });
  assert.deepEqual(getCheckoutReadiness({ amount: 5000, paidCheckoutEnabled: true }), { allowed: true, reason: null });
});
