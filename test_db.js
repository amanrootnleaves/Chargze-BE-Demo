const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const items = await prisma.orderItem.findMany({
    take: 5,
    orderBy: { createdAt: 'desc' },
    select: { ProductName: true, ProductImage: true }
  });
  items.forEach(item => {
    console.log(item.ProductName);
    console.log(typeof item.ProductImage);
    if (typeof item.ProductImage === 'string') {
        console.log(item.ProductImage.substring(0, 100));
    } else if (Array.isArray(item.ProductImage)) {
        console.log("Array, first item type:", typeof item.ProductImage[0]);
        console.log(JSON.stringify(item.ProductImage[0]).substring(0, 100));
    } else {
        console.log(JSON.stringify(item.ProductImage).substring(0, 100));
    }
  });
}
main().finally(() => prisma.$disconnect());
