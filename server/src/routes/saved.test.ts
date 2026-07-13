import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

import { app } from '../app';
import { installStoreForTesting } from '../lib/store';

async function startServer() {
  const dir = mkdtempSync(join(tmpdir(), 'yoticks-saved-route-'));
  const filePath = join(dir, 'state.json');
  const sandbox = await installStoreForTesting(filePath);
  const server = app.listen(0);
  await new Promise<void>((resolve) => server.once('listening', resolve));
  const address = server.address();
  assert.ok(address && typeof address !== 'string');
  return {
    server,
    baseUrl: `http://127.0.0.1:${address.port}/api`,
    async cleanup() {
      await new Promise<void>((resolve) => server.close(() => resolve()));
      await sandbox.restore();
      rmSync(dir, { recursive: true, force: true });
    },
  };
}

test('attendee can save and unsave an event through the backend', async () => {
  const { baseUrl, cleanup } = await startServer();

  try {
    const login = await fetch(`${baseUrl}/auth/dev-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: 'attendee', email: 'jean.dupont@example.com' }),
    });
    assert.equal(login.status, 200);
    const { token } = (await login.json()) as { token: string };

    const saved = await fetch(`${baseUrl}/saved/1`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });
    assert.equal(saved.status, 201);

    const list = await fetch(`${baseUrl}/saved`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    assert.equal(list.status, 200);
    const listPayload = (await list.json()) as { savedEvents: { event: { id: string } }[] };
    assert.equal(listPayload.savedEvents.length, 1);
    assert.equal(listPayload.savedEvents[0]?.event.id, '1');

    const removed = await fetch(`${baseUrl}/saved/1`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    assert.equal(removed.status, 200);

    const emptyList = await fetch(`${baseUrl}/saved`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    assert.equal(emptyList.status, 200);
    const emptyPayload = (await emptyList.json()) as { savedEvents: unknown[] };
    assert.equal(emptyPayload.savedEvents.length, 0);
  } finally {
    await cleanup();
  }
});
