/*
  Warnings:

  - The `status` column on the `ChargingStation` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "ChargingStation" DROP COLUMN "status",
ADD COLUMN     "status" TEXT;
