import { PrismaClient } from '@prisma/client';
import Argon2 from 'argon2';

const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await Argon2.hash('123123');
  
  const account = await prisma.account.upsert({
    where: { email: 'test@test.com' },
    update: {
      password: hashedPassword,
      accountType: 'ADMIN',
      emailVerified: true,
      isActive: true,
      isBlocked: false
    },
    create: {
      email: 'test@test.com',
      password: hashedPassword,
      accountType: 'ADMIN',
      emailVerified: true,
      isActive: true,
      isBlocked: false,
      displayName: 'Test Admin'
    }
  });

  console.log('Account seeded:', account.email);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
