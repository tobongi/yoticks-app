import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import test from 'node:test';

const tempRoot = mkdtempSync(join(tmpdir(), 'yoticks-auth-'));
process.env.NODE_ENV = 'test';
process.env.YOTICKS_DB_FILE = join(tempRoot, 'auth.db');

async function startApp() {
  const { app } = await import('../app');
  const server = app.listen(0);
  await new Promise<void>((resolve) => server.once('listening', resolve));
  const address = server.address();
  assert.ok(address && typeof address !== 'string');
  return { server, baseUrl: `http://127.0.0.1:${address.port}/api` };
}

async function jsonRequest<T>(baseUrl: string, path: string, init: RequestInit = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...(init.headers ?? {}) },
  });
  const json = (await response.json().catch(() => ({}))) as T;
  return { response, json };
}

test('password recovery uses a one-time token and account deletion verifies the password', async () => {
  const { server, baseUrl } = await startApp();
  const email = `security-${Date.now()}@example.com`;

  try {
    const register = await jsonRequest<{ token: string }>(baseUrl, '/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name: 'Security Test', email, password: 'OriginalPassword1!' }),
    });
    assert.equal(register.response.status, 200);

    const unsafeReset = await jsonRequest(baseUrl, '/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ email, password: 'AttackerPassword1!' }),
    });
    assert.equal(unsafeReset.response.status, 404);

    const requested = await jsonRequest<{ ok: boolean; resetToken?: string }>(baseUrl, '/auth/password-reset/request', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
    assert.equal(requested.response.status, 202);
    assert.equal(requested.json.ok, true);
    assert.ok(requested.json.resetToken, 'tests receive the token without requiring an email provider');

    const confirmed = await jsonRequest<{ ok: boolean }>(baseUrl, '/auth/password-reset/confirm', {
      method: 'POST',
      body: JSON.stringify({ token: requested.json.resetToken, password: 'ChangedPassword1!' }),
    });
    assert.equal(confirmed.response.status, 200);
    assert.equal(confirmed.json.ok, true);

    const reused = await jsonRequest(baseUrl, '/auth/password-reset/confirm', {
      method: 'POST',
      body: JSON.stringify({ token: requested.json.resetToken, password: 'AnotherPassword1!' }),
    });
    assert.equal(reused.response.status, 400);

    const login = await jsonRequest<{ token: string }>(baseUrl, '/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password: 'ChangedPassword1!' }),
    });
    assert.equal(login.response.status, 200);

    const wrongDelete = await jsonRequest(baseUrl, '/auth/account', {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${login.json.token}` },
      body: JSON.stringify({ password: 'wrong-password' }),
    });
    assert.equal(wrongDelete.response.status, 403);

    const deleted = await fetch(`${baseUrl}/auth/account`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${login.json.token}` },
      body: JSON.stringify({ password: 'ChangedPassword1!' }),
    });
    assert.equal(deleted.status, 204);

    const afterDelete = await jsonRequest(baseUrl, '/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password: 'ChangedPassword1!' }),
    });
    assert.equal(afterDelete.response.status, 401);
  } finally {
    await new Promise<void>((resolve) => server.close(() => resolve()));
    const { store } = await import('../lib/store');
    await store.close();
    rmSync(tempRoot, { recursive: true, force: true });
  }
});
