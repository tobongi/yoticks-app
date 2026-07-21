import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * Deployment contract for the Railway API service.
 *
 * This test used to read a root `railway.toml` describing a Nixpacks build.
 * That file was deliberately deleted in 5a7a7b9 when the service moved to a
 * Dockerfile build defined in `server/railway.json`, but the test was never
 * updated — it was quietly dropped from the `npm test` script instead, so it
 * had been failing silently ever since. It now asserts the deployment shape
 * that actually ships.
 */

const serverRoot = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

type RailwayConfig = {
  build?: { builder?: string; dockerfilePath?: string };
  deploy?: {
    healthcheckPath?: string;
    healthcheckTimeout?: number;
    restartPolicyType?: string;
    restartPolicyMaxRetries?: number;
  };
};

async function readRailwayConfig(): Promise<RailwayConfig> {
  return JSON.parse(await readFile(join(serverRoot, 'railway.json'), 'utf8')) as RailwayConfig;
}

test('Railway builds the API service from the server Dockerfile', async () => {
  const config = await readRailwayConfig();

  assert.equal(config.build?.builder, 'DOCKERFILE');
  assert.equal(config.build?.dockerfilePath, 'Dockerfile');

  // The referenced Dockerfile has to exist, or the deploy fails at build time.
  const dockerfile = await readFile(join(serverRoot, config.build?.dockerfilePath ?? 'Dockerfile'), 'utf8');
  assert.match(dockerfile, /^FROM node:\d+/m, 'Dockerfile must pin a Node base image');
  assert.match(dockerfile, /RUN npm run db:generate && npm run build/, 'Prisma client must be generated at build time');
});

test('the container start command matches the compiled server entrypoint', async () => {
  const dockerfile = await readFile(join(serverRoot, 'Dockerfile'), 'utf8');
  const packageJson = JSON.parse(await readFile(join(serverRoot, 'package.json'), 'utf8')) as {
    scripts: Record<string, string>;
  };

  // Railway runs the image CMD; `npm start` is what a developer runs locally.
  // If these drift, local and production boot different files.
  const cmdMatch = dockerfile.match(/CMD \["node", "([^"]+)"\]/);
  assert.ok(cmdMatch, 'Dockerfile must declare an explicit CMD');
  assert.equal(packageJson.scripts.start, `node ${cmdMatch![1]}`);
});

test('Railway health-checks the API and restarts it on failure', async () => {
  const config = await readRailwayConfig();

  // `/api/health` is the route the Express app actually exposes; a mismatch
  // here makes every deploy hang until the health check times out.
  assert.equal(config.deploy?.healthcheckPath, '/api/health');
  assert.ok(
    (config.deploy?.healthcheckTimeout ?? 0) >= 60,
    'cold starts run Prisma migrations; a short timeout fails healthy deploys',
  );
  assert.equal(config.deploy?.restartPolicyType, 'ON_FAILURE');
  assert.ok((config.deploy?.restartPolicyMaxRetries ?? 0) > 0);
});

test('the health endpoint the config points at is actually served', async () => {
  // Guards against renaming the route without updating the deploy config,
  // which produces a deploy that builds cleanly and then never goes live.
  const config = await readRailwayConfig();
  const app = await readFile(join(serverRoot, 'src', 'app.ts'), 'utf8');

  const healthcheckPath = config.deploy?.healthcheckPath;
  assert.ok(healthcheckPath, 'railway.json must declare a healthcheckPath');
  assert.ok(
    app.includes(`'${healthcheckPath}'`) || app.includes(`"${healthcheckPath}"`),
    `railway.json health-checks ${healthcheckPath}, but no such route is registered in app.ts`,
  );
});
