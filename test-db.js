require('dotenv').config({ path: './.env' });
const { PrismaClient } = require('@prisma/client');

const checkDatabase = async () => {
  if (!process.env.DATABASE_POSTGRES_WRITE_URL) {
    console.log('FAIL DATABASE_POSTGRES_WRITE_URL is missing');
    return;
  }

  let prisma;
  try {
    prisma = new PrismaClient();
    await prisma.$queryRaw`SELECT 1`;
    console.log('SELECT 1 OK');
  } catch (e) {
    console.log('FAIL', e.errorCode || e.code, String(e.message).split('\n').slice(-2).join(' ').slice(0, 200));
  } finally {
    if (prisma) {
      try {
        await prisma.$disconnect();
      } catch (e) {
        console.log('FAIL disconnect', e.errorCode || e.code, String(e.message).split('\n').slice(-2).join(' ').slice(0, 200));
      }
    }
  }
};

module.exports = checkDatabase;

if (require.main === module) checkDatabase();
