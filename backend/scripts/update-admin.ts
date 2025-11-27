import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Update admin@ecrumedia.com to ADMIN role if exists
  const result = await prisma.user.updateMany({
    where: {
      email: 'admin@ecrumedia.com',
    },
    data: {
      role: 'ADMIN',
    },
  });

  console.log(`Updated ${result.count} user(s) to ADMIN role`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
