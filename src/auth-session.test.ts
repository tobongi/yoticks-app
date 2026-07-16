import assert from 'node:assert/strict';
import test from 'node:test';
import { createSessionStore, restoreValidSession } from './auth-session';

test('session store reads, saves, and deletes a token through its adapter', async () => {
  const values = new Map<string, string>();
  const store = createSessionStore({
    getItem: async (key) => values.get(key) ?? null,
    setItem: async (key, value) => void values.set(key, value),
    deleteItem: async (key) => void values.delete(key),
  });

  await store.save('secret-token');
  assert.equal(await store.read(), 'secret-token');
  await store.clear();
  assert.equal(await store.read(), null);
});

test('invalid stored sessions are cleared instead of becoming demo users', async () => {
  let token: string | null = 'expired-token';
  const store = createSessionStore({
    getItem: async () => token,
    setItem: async (_key, value) => { token = value; },
    deleteItem: async () => { token = null; },
  });

  const restored = await restoreValidSession(store, async () => null);
  assert.equal(restored, null);
  assert.equal(token, null);
});

test('valid stored sessions return both token and user', async () => {
  const store = createSessionStore({
    getItem: async () => 'valid-token',
    setItem: async () => undefined,
    deleteItem: async () => undefined,
  });
  const user = { id: 'u1', role: 'attendee' as const };

  assert.deepEqual(await restoreValidSession(store, async () => user), { token: 'valid-token', user });
});
