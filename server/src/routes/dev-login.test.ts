import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import test from 'node:test';

const tempRoot = mkdtempSync(join(tmpdir(), 'yoticks-dev-login-'));
process.env.NODE_ENV = 'test';
process.env.YOTICKS_DB_FILE = join(tempRoot, 'dev-login.db');

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

test('dev-login (the public Visiteur/Organisateur demo tiles) works in production and cannot be used to take over an arbitrary account', async () => {
  const { server, baseUrl } = await startApp();
  const victimEmail = `victim-${Date.now()}@example.com`;

  try {
    const victim = await jsonRequest<{ token: string }>(baseUrl, '/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name: 'Victim', email: victimEmail, password: 'VictimPassword1!' }),
    });
    assert.equal(victim.response.status, 200);

    const originalNodeEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';
    try {
      const attendee = await jsonRequest<{ token: string; user: { role: string; email: string | null } }>(
        baseUrl,
        '/auth/dev-login',
        { method: 'POST', body: JSON.stringify({ role: 'attendee' }) },
      );
      assert.equal(attendee.response.status, 200, 'the demo attendee tile must work in production');
      assert.ok(attendee.json.token);
      assert.equal(attendee.json.user.role, 'attendee');

      const organizer = await jsonRequest<{ user: { role: string } }>(baseUrl, '/auth/dev-login', {
        method: 'POST',
        body: JSON.stringify({ role: 'organizer' }),
      });
      assert.equal(organizer.response.status, 200, 'the demo organizer tile must work in production');
      assert.equal(organizer.json.user.role, 'organizer');

      const attackAttempt = await jsonRequest<{ user: { email: string | null } }>(baseUrl, '/auth/dev-login', {
        method: 'POST',
        body: JSON.stringify({ role: 'attendee', email: victimEmail }),
      });
      assert.equal(attackAttempt.response.status, 200);
      assert.notEqual(
        attackAttempt.json.user.email,
        victimEmail,
        "in production, dev-login must ignore an attacker-supplied email and never mint a token for someone else's account",
      );
    } finally {
      process.env.NODE_ENV = originalNodeEnv;
    }

    const nonProductionAttempt = await jsonRequest<{ user: { email: string | null } }>(baseUrl, '/auth/dev-login', {
      method: 'POST',
      body: JSON.stringify({ role: 'attendee', email: victimEmail }),
    });
    assert.equal(nonProductionAttempt.response.status, 200);
    assert.equal(
      nonProductionAttempt.json.user.email,
      victimEmail,
      'outside production, requesting a known email is still allowed for test/dev convenience',
    );
  } finally {
    await new Promise<void>((resolve) => server.close(() => resolve()));
    const { store } = await import('../lib/store');
    await store.close();
    rmSync(tempRoot, { recursive: true, force: true });
  }
});
