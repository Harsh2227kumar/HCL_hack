const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const count = await prisma.learningResource.count();
  console.log("Resources in DB:", count);
}
main().catch(console.error).finally(() => prisma.$disconnect());
