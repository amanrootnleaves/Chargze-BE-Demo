-- DropIndex
DROP INDEX "CartItem_Cart__fk___Product__fk___key";

-- AlterTable
ALTER TABLE "CartItem" ADD COLUMN     "ElectricVehicle__fk__" TEXT,
ALTER COLUMN "Product__fk__" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "CartItem" ADD CONSTRAINT "CartItem_ElectricVehicle__fk___fkey" FOREIGN KEY ("ElectricVehicle__fk__") REFERENCES "ElectricVehicle"("id") ON DELETE CASCADE ON UPDATE CASCADE;
