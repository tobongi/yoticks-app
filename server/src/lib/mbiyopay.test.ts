import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import test from 'node:test';
import { buildPayinRequest, verifyWebhookSignature } from './mbiyopay';

test('builds a MBIYOPAY mobile-money payin request with the provider contract', () => {
  assert.deepEqual(buildPayinRequest({
    amount: 5000,
    currency: 'CDF',
    orderId: 'checkout_123',
    callbackUrl: 'https://api.yoticks.app/api/payments/mobile-money/webhook',
    network: 'vodacom',
    phoneNumber: '+243812345678',
    countryCode: 'CD',
  }), {
    amount: 500000,
    currency: 'CDF',
    payment_method: 'mobile_money',
    order_id: 'checkout_123',
    callback_url: 'https://api.yoticks.app/api/payments/mobile-money/webhook',
    metadata: {
      network: 'vodacom',
      phone_number: '+243812345678',
      country_code: 'CD',
    },
  });
});

test('verifies the provider webhook using its raw payload and secret', () => {
  const payload = JSON.stringify({ transaction_id: 'txn_1', status: 'successful' });
  const secret = 'webhook-secret';
  const signature = crypto.createHmac('sha256', secret).update(payload).digest('hex');

  assert.equal(verifyWebhookSignature(payload, signature, secret), true);
  assert.equal(verifyWebhookSignature(payload, 'bad-signature', secret), false);
});
