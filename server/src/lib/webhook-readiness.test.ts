import assert from 'node:assert/strict';
import test from 'node:test';
import { getWebhookReadiness, validateProductionPaymentEnvironment } from './webhook-readiness';

const readyEnvironment = {
  NODE_ENV: 'production',
  PAID_CHECKOUT_ENABLED: 'true',
  MBIYOPAY_API_KEY: 'live-key',
  MBIYOPAY_WEBHOOK_SECRET: 'signature-secret',
  MBIYOPAY_WEBHOOK_URL: 'https://api.yoticks.app/api/payments/mobile-money/webhook',
};

test('reports a redacted ready result for the canonical public HTTPS callback', () => {
  assert.deepEqual(getWebhookReadiness(readyEnvironment), {
    ok: true,
    acceptsSignedPost: true,
    provider: 'MBIYOPAY',
    path: '/api/payments/mobile-money/webhook',
    checks: {
      apiKeyConfigured: true,
      webhookSecretConfigured: true,
      https: true,
      publicHost: true,
      canonicalPath: true,
    },
  });
  assert.doesNotMatch(JSON.stringify(getWebhookReadiness(readyEnvironment)), /live-key|signature-secret/);
});

test('rejects alias, insecure, and private callback URLs for a production launch', () => {
  assert.equal(getWebhookReadiness({ ...readyEnvironment, MBIYOPAY_WEBHOOK_URL: 'https://api.yoticks.app/api/mbiyopay/notify' }).ok, false);
  assert.equal(getWebhookReadiness({ ...readyEnvironment, MBIYOPAY_WEBHOOK_URL: 'http://api.yoticks.app/api/payments/mobile-money/webhook' }).ok, false);
  assert.equal(getWebhookReadiness({ ...readyEnvironment, MBIYOPAY_WEBHOOK_URL: 'https://127.0.0.1/api/payments/mobile-money/webhook' }).ok, false);
});

test('fails production startup only when paid checkout is enabled without a complete webhook deployment config', () => {
  assert.doesNotThrow(() => validateProductionPaymentEnvironment({ NODE_ENV: 'production', PAID_CHECKOUT_ENABLED: 'false' }));
  assert.doesNotThrow(() => validateProductionPaymentEnvironment(readyEnvironment));
  assert.throws(
    () => validateProductionPaymentEnvironment({ ...readyEnvironment, MBIYOPAY_WEBHOOK_SECRET: '' }),
    /Paid checkout cannot start/,
  );
});
