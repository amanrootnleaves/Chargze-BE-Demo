-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "discountPercent" DECIMAL(5,2),
ADD COLUMN     "features" JSONB,
ADD COLUMN     "maxQuantityOrder" INTEGER NOT NULL DEFAULT 10,
ADD COLUMN     "salePrice" DECIMAL(12,2),
ADD COLUMN     "shopWithConfidence" TEXT[];
