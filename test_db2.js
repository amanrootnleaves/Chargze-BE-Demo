const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const items = await prisma.orderItem.findMany({
    where: { ProductName: { contains: 'E-WINGS' } },
    take: 1,
    select: { ProductName: true, ProductImage: true }
  });
  console.log(items[0].ProductName);
  console.log(JSON.stringify(items[0].ProductImage[0]).substring(0, 100));
}
main().finally(() => prisma.$disconnect());
