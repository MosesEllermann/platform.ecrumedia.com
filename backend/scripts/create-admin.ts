import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  const firstName = process.env.ADMIN_FIRST_NAME || 'Admin';
  const lastName = process.env.ADMIN_LAST_NAME || 'User';

  if (!email || !password) {
    console.error('❌ Error: ADMIN_EMAIL and ADMIN_PASSWORD environment variables are required');
    process.exit(1);
  }

  // Check if user exists
  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    // Update existing user
    const hashedPassword = await bcrypt.hash(password, 10);
    await prisma.user.update({
      where: { email },
      data: {
        password: hashedPassword,
        role: 'ADMIN',
        firstName,
        lastName,
      },
    });
    console.log(`✅ Admin user updated: ${email}`);
  } else {
    // Create new admin user
    const hashedPassword = await bcrypt.hash(password, 10);
    await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        firstName,
        lastName,
        role: 'ADMIN',
      },
    });
    console.log(`✅ Admin user created: ${email}`);
  }

  console.log(`\n📧 Email: ${email}`);
  console.log(`🔑 Password: ${password}`);
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
