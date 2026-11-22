-- AlterTable
ALTER TABLE "Faq" ADD COLUMN     "displayOrder" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "isActive" BOOLEAN DEFAULT true;
