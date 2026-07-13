import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';

const command = process.argv[2];
const prismaBin = resolve(process.cwd(), 'node_modules', '.bin', process.platform === 'win32' ? 'prisma.cmd' : 'prisma');
const databaseUrl = process.env.DATABASE_URL || 'file:./prisma/dev.db';

function run(args) {
  const file = process.platform === 'win32' ? 'cmd.exe' : prismaBin;
  const finalArgs = process.platform === 'win32' ? ['/c', prismaBin, ...args] : args;

  execFileSync(file, finalArgs, {
    cwd: process.cwd(),
    env: {
      ...process.env,
      DATABASE_URL: databaseUrl,
    },
    stdio: 'inherit',
  });
}

switch (command) {
  case 'generate':
    run(['generate']);
    break;
  case 'push':
    run(['db', 'push', '--skip-generate', '--accept-data-loss']);
    break;
  case 'seed':
    run(['db', 'seed']);
    break;
  case 'setup':
    run(['generate']);
    run(['db', 'push', '--skip-generate', '--accept-data-loss']);
    run(['db', 'seed']);
    break;
  case 'studio':
    run(['studio']);
    break;
  default:
    console.error('Usage: node scripts/prisma.mjs <generate|push|seed|setup|studio>');
    process.exit(1);
}
