import { PrismaClient } from '@prisma/client';
import { seedData } from '../src/seed';
import { seedDatabase } from '../src/lib/seed-database';

const prisma = new PrismaClient();

async function main() {
  try {
    await prisma.$connect();
    await seedDatabase(prisma, seedData);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
