-- AlterTable
ALTER TABLE "CustomerProfile" ADD COLUMN     "addressLine1" TEXT,
ADD COLUMN     "addressLine2" TEXT,
ADD COLUMN     "city" TEXT,
ADD COLUMN     "gstin" TEXT,
ADD COLUMN     "pincode" TEXT,
ADD COLUMN     "state" TEXT,
ADD COLUMN     "walletBalance" DECIMAL(12,2) NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "RfidTag" ADD COLUMN     "CustomerProfile__fk__" TEXT;

-- AddForeignKey
ALTER TABLE "RfidTag" ADD CONSTRAINT "RfidTag_CustomerProfile__fk___fkey" FOREIGN KEY ("CustomerProfile__fk__") REFERENCES "CustomerProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;
