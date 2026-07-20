import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { validateProductionEnvironment } from './deployment-readiness';

const readyProductionEnvironment = {
  NODE_ENV: 'production',
  JWT_SECRET: 'a-production-secret-that-is-longer-than-thirty-two-characters',
  PASSWORD_RESET_WEBHOOK_URL: 'https://automation.yoticks.app/password-reset',
  YOTICKS_DB_FILE: '/data/yoticks.db',
  RAILWAY_ENVIRONMENT: 'production',
  RAILWAY_VOLUME_MOUNT_PATH: '/data',
};

test('accepts a production database stored inside the attached Railway volume', () => {
  assert.doesNotThrow(() => validateProductionEnvironment(readyProductionEnvironment));
});

test('rejects unsafe production secrets or SQLite storage outside the volume', () => {
  assert.throws(() => validateProductionEnvironment({ ...readyProductionEnvironment, JWT_SECRET: 'short' }), /JWT_SECRET/);
  assert.throws(() => validateProductionEnvironment({ ...readyProductionEnvironment, YOTICKS_DB_FILE: 'prisma/prod.db' }), /YOTICKS_DB_FILE/);
  assert.throws(
    () => validateProductionEnvironment({ ...readyProductionEnvironment, YOTICKS_DB_FILE: '/app/prisma/prod.db' }),
    /RAILWAY_VOLUME_MOUNT_PATH/,
  );
});

test('warns instead of throwing when PASSWORD_RESET_WEBHOOK_URL is missing or insecure', () => {
  const originalWarn = console.warn;
  const warnings: unknown[][] = [];
  console.warn = (...args: unknown[]) => {
    warnings.push(args);
  };

  try {
    assert.doesNotThrow(() =>
      validateProductionEnvironment({ ...readyProductionEnvironment, PASSWORD_RESET_WEBHOOK_URL: undefined }),
    );
    assert.doesNotThrow(() =>
      validateProductionEnvironment({ ...readyProductionEnvironment, PASSWORD_RESET_WEBHOOK_URL: 'http://localhost/reset' }),
    );
  } finally {
    console.warn = originalWarn;
  }

  assert.equal(warnings.length, 2);
});

test('does not impose production hosting rules on local development and tests', () => {
  assert.doesNotThrow(() => validateProductionEnvironment({ NODE_ENV: 'test' }));
  assert.doesNotThrow(() => validateProductionEnvironment({ NODE_ENV: 'development' }));
});

test('ships the image encoder as a production runtime dependency', () => {
  const packageJson = JSON.parse(
    readFileSync(new URL('../../package.json', import.meta.url), 'utf8'),
  ) as { dependencies?: Record<string, string> };

  assert.ok(
    packageJson.dependencies?.pngjs,
    'pngjs must be installed by production-only dependency installs',
  );
});

test('installs the OpenSSL runtime required by Prisma in the production image', () => {
  const dockerfile = readFileSync(new URL('../../Dockerfile', import.meta.url), 'utf8');

  assert.match(dockerfile, /apt-get install[^\n]*openssl/);
});
