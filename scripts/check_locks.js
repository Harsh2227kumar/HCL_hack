const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const res = await prisma.$queryRawUnsafe(`SELECT pid, state, query FROM pg_stat_activity WHERE state != 'idle' AND pid <> pg_backend_pid()`);
  console.log(res);
}

main().finally(() => prisma.$disconnect());
