import assert from 'node:assert/strict';
import test from 'node:test';

test('rejects an unsigned MBIYOPAY webhook before touching payment state', async () => {
  process.env.NODE_ENV = 'test';
  process.env.YOTICKS_DB_FILE = `${process.cwd()}\\prisma\\mbiyopay-webhook-test.db`;
  process.env.MBIYOPAY_WEBHOOK_SECRET = 'test-secret';
  process.env.MBIYOPAY_API_KEY = 'test-api-key';
  process.env.MBIYOPAY_WEBHOOK_URL = 'https://api.yoticks.app/api/payments/mobile-money/webhook';
  const { app } = await import('../app');
  const server = app.listen(0);
  await new Promise<void>((resolve) => server.once('listening', resolve));
  const address = server.address();
  assert.ok(address && typeof address !== 'string');

  try {
    const readinessResponse = await fetch(`http://127.0.0.1:${address.port}/api/payments/mobile-money/webhook`);
    const readiness = await readinessResponse.json() as { ok?: boolean; acceptsSignedPost?: boolean; checks?: Record<string, boolean> };
    assert.equal(readinessResponse.status, 200);
    assert.equal(readiness.ok, true);
    assert.equal(readiness.acceptsSignedPost, true);
    assert.equal(Object.values(readiness.checks ?? {}).every(Boolean), true);

    const response = await fetch(`http://127.0.0.1:${address.port}/api/payments/mobile-money/webhook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ transaction_id: 'provider_1', status: 'successful' }),
    });
    assert.equal(response.status, 401);
  } finally {
    await new Promise<void>((resolve) => server.close(() => resolve()));
    const { store } = await import('../lib/store');
    await store.close();
  }
});

test('accepts the dashboard-compatible webhook path as the same protected handler', async () => {
  process.env.NODE_ENV = 'test';
  process.env.YOTICKS_DB_FILE = `${process.cwd()}\\prisma\\mbiyopay-webhook-alias-test.db`;
  process.env.MBIYOPAY_WEBHOOK_SECRET = 'test-secret';
  const { app } = await import('../app');
  const server = app.listen(0);
  await new Promise<void>((resolve) => server.once('listening', resolve));
  const address = server.address();
  assert.ok(address && typeof address !== 'string');

  try {
    const response = await fetch(`http://127.0.0.1:${address.port}/api/mbiyopay/notify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ transaction_id: 'provider_1', status: 'successful' }),
    });
    assert.equal(response.status, 401);
  } finally {
    await new Promise<void>((resolve) => server.close(() => resolve()));
    const { store } = await import('../lib/store');
    await store.close();
  }
});
