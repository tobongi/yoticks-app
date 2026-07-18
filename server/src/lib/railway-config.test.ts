import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const repositoryRoot = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');

test('Railway starts the API service and checks its health endpoint', async () => {
  const config = await readFile(join(repositoryRoot, 'railway.toml'), 'utf8');

  assert.match(config, /buildCommand\s*=\s*"cd server && npm (?:ci|install).*npm run build"/);
  assert.match(config, /startCommand\s*=\s*"cd server && npm run start"/);
  assert.match(config, /healthcheckPath\s*=\s*"\/api\/health"/);
});
