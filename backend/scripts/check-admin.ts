import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Checking for admin users...\n');
  
  const adminUsers = await prisma.user.findMany({
    where: { role: 'ADMIN' },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      role: true,
      isActive: true,
      createdAt: true,
    },
  });

  if (adminUsers.length === 0) {
    console.log('❌ No admin users found in database!');
  } else {
    console.log(`✅ Found ${adminUsers.length} admin user(s):\n`);
    adminUsers.forEach(user => {
      console.log(`- ${user.email}`);
      console.log(`  Name: ${user.firstName} ${user.lastName}`);
      console.log(`  Active: ${user.isActive ? '✅ Yes' : '❌ No'}`);
      console.log(`  Created: ${user.createdAt}`);
      console.log('');
    });
  }

  // Check for the specific email if provided
  const checkEmail = process.env.ADMIN_EMAIL;
  if (checkEmail) {
    console.log(`\nChecking for user: ${checkEmail}`);
    const user = await prisma.user.findUnique({
      where: { email: checkEmail },
    });
    
    if (user) {
      console.log('✅ User exists');
      console.log(`   Active: ${user.isActive}`);
      console.log(`   Role: ${user.role}`);
    } else {
      console.log('❌ User does not exist');
    }
  }
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
