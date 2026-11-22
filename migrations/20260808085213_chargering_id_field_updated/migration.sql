/*
  Warnings:

  - You are about to drop the column `chargingId` on the `Connector` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Charger" ADD COLUMN     "chargingId" TEXT;

-- AlterTable
ALTER TABLE "ChargingStation" ALTER COLUMN "address" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Connector" DROP COLUMN "chargingId";
