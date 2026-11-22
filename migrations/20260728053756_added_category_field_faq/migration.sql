/*
  Warnings:

  - Made the column `isDeleted` on table `Faq` required. This step will fail if there are existing NULL values in that column.
  - Made the column `isActive` on table `Faq` required. This step will fail if there are existing NULL values in that column.

*/
-- CreateEnum
CREATE TYPE "FAQ_CATEGORY" AS ENUM ('GENERAL', 'STATION');

-- AlterTable
ALTER TABLE "Faq" ADD COLUMN     "category" "FAQ_CATEGORY" NOT NULL DEFAULT 'GENERAL',
ALTER COLUMN "isDeleted" SET NOT NULL,
ALTER COLUMN "isActive" SET NOT NULL;
