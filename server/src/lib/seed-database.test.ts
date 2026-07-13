import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';
import { PrismaClient } from '@prisma/client';

import { createDataStore, toDatabaseUrl } from './store';
import { seedDatabase } from './seed-database';
import { seedData } from '../seed';

test('seedDatabase refreshes existing venue images instead of leaving stale URLs behind', async () => {
  const dir = mkdtempSync(join(process.cwd(), 'seed-refresh-'));
  const filePath = join(dir, 'dev.db');
  const venueId = seedData.venues[0]?.id;

  assert.ok(venueId);

  try {
    const store = await createDataStore(filePath);
    await store.close();

    const prisma = new PrismaClient({
      datasources: {
        db: {
          url: toDatabaseUrl(filePath),
        },
      },
    });

    try {
      await prisma.$connect();
      await prisma.venue.update({
        where: { id: venueId },
        data: { imageUrl: 'https://example.com/stale-image.png' },
      });

      await seedDatabase(prisma, seedData);

      const refreshed = await prisma.venue.findUnique({ where: { id: venueId } });
      assert.ok(refreshed);
      assert.ok(refreshed.imageUrl.startsWith('data:image/png;base64,'));

      const venueCount = await prisma.venue.count();
      assert.equal(venueCount, seedData.venues.length);
    } finally {
      await prisma.$disconnect();
    }
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
