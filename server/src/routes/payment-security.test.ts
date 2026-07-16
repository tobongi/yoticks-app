import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import test from 'node:test';

const tempRoot = mkdtempSync(join(tmpdir(), 'yoticks-payment-security-'));
process.env.NODE_ENV = 'test';
process.env.YOTICKS_DB_FILE = join(tempRoot, 'payment-security.db');

test('paid inventory cannot be issued through the reservation endpoint without verified payment', async () => {
  const { app } = await import('../app');
  const server = app.listen(0);
  await new Promise<void>((resolve) => server.once('listening', resolve));
  const address = server.address();
  assert.ok(address && typeof address !== 'string');
  const baseUrl = `http://127.0.0.1:${address.port}/api`;

  try {
    const login = await fetch(`${baseUrl}/auth/dev-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: 'attendee' }),
    });
    const { token } = await login.json() as { token: string };

    const optionsResponse = await fetch(`${baseUrl}/payments/mobile-money/options`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const optionsPayload = await optionsResponse.json() as {
      countries?: { code: string; currencies: { code: string; networks: string[] }[] }[];
    };
    assert.equal(optionsResponse.status, 200);
    assert.deepEqual(
      optionsPayload.countries?.find((country) => country.code === 'SN')?.currencies,
      [{ code: 'XOF', networks: ['orange', 'free', 'wave'] }],
    );

    const response = await fetch(`${baseUrl}/tickets/reserve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ eventId: '1', tierKey: 'standard', quantity: 1 }),
    });
    const payload = await response.json() as { error?: string };

    assert.equal(response.status, 402);
    assert.match(payload.error ?? '', /paiement/i);
  } finally {
    await new Promise<void>((resolve) => server.close(() => resolve()));
    const { store } = await import('../lib/store');
    await store.close();
    rmSync(tempRoot, { recursive: true, force: true });
  }
});
