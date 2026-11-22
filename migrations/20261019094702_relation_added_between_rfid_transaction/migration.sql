-- AlterTable
ALTER TABLE "Transaction" ADD COLUMN     "RfidTag__fk__" TEXT,
ADD COLUMN     "balanceAmount" DOUBLE PRECISION DEFAULT 0.0;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_RfidTag__fk___fkey" FOREIGN KEY ("RfidTag__fk__") REFERENCES "RfidTag"("id") ON DELETE SET NULL ON UPDATE CASCADE;
