import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

import { app } from '../app';
import { installStoreForTesting } from '../lib/store';

async function startIsolatedServer() {
  const dir = mkdtempSync(join(tmpdir(), 'yoticks-providers-'));
  const filePath = join(dir, 'state.json');
  const sandbox = await installStoreForTesting(filePath);
  const server = app.listen(0);
  await new Promise<void>((resolve) => server.once('listening', resolve));
  const address = server.address();
  assert.ok(address && typeof address !== 'string');

  return {
    server,
    port: address.port,
    async cleanup() {
      await new Promise<void>((resolve) => server.close(() => resolve()));
      await sandbox.restore();
      rmSync(dir, { recursive: true, force: true });
    },
  };
}

test('provider directory returns official Kinshasa commune coverage', async () => {
  const appServer = await startIsolatedServer();

  try {
    const response = await fetch(`http://127.0.0.1:${appServer.port}/api/providers?city=Kinshasa`);
    assert.equal(response.status, 200);

    const payload = (await response.json()) as {
      providers: { commune: string }[];
      facets: { communes: { label: string; count: number }[] };
      stats: { total: number; coveredCommunes: number };
    };

    assert.ok(payload.providers.length >= 24);
    assert.equal(payload.stats.coveredCommunes, 24);
    assert.ok(payload.facets.communes.some((commune) => commune.label === 'Gombe' && commune.count >= 2));
    assert.ok(!payload.facets.communes.some((commune) => commune.label === 'Matonge'));
  } finally {
    await appServer.cleanup();
  }
});

test('provider directory supports commune filtering and free text search', async () => {
  const appServer = await startIsolatedServer();

  try {
    const response = await fetch(
      `http://127.0.0.1:${appServer.port}/api/providers?city=Kinshasa&commune=Ngaliema&q=bokongo`,
    );
    assert.equal(response.status, 200);

    const payload = (await response.json()) as {
      providers: { name: string; commune: string }[];
    };

    assert.equal(payload.providers.length, 1);
    assert.equal(payload.providers[0]?.name, 'David Bokongo');
    assert.equal(payload.providers[0]?.commune, 'Ngaliema');
  } finally {
    await appServer.cleanup();
  }
});
