/*
  Warnings:

  - The `status` column on the `Charger` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `status` column on the `Connector` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "CONNECTOR_STATUS" AS ENUM ('AVAILABLE', 'OFFLINE', 'BUSY', 'FAULT', 'PREPARING');

-- CreateEnum
CREATE TYPE "CHARGER_STATUS" AS ENUM ('AVAILABLE', 'OFFLINE', 'FAULT', 'MAINTENANCE');

-- AlterTable
ALTER TABLE "Charger" DROP COLUMN "status",
ADD COLUMN     "status" "CHARGER_STATUS" NOT NULL DEFAULT 'AVAILABLE';

-- AlterTable
ALTER TABLE "Connector" DROP COLUMN "status",
ADD COLUMN     "status" "CONNECTOR_STATUS" NOT NULL DEFAULT 'AVAILABLE';

-- DropEnum
DROP TYPE "ConnectorStatus";
