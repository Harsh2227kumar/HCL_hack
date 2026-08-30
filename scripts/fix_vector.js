require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function main() {
  try {
    await p.$executeRawUnsafe('ALTER TABLE "LearningResource" DROP COLUMN IF EXISTS embedding');
    await p.$executeRawUnsafe('ALTER TABLE "LearningResource" ADD COLUMN embedding vector(3072)');
    console.log('Column altered to vector(3072)');
  } catch (e) {
    console.error('Error:', e.message);
  } finally {
    await p.$disconnect();
  }
}

main();
