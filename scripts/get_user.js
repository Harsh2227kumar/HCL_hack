const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function main() {
  const u = await p.user.findFirst();
  if (u) {
    console.log(u.id);
  } else {
    const newUser = await p.user.create({ data: { email: 'demo@example.com' } });
    console.log(newUser.id);
  }
  await p.$disconnect();
}
main();
