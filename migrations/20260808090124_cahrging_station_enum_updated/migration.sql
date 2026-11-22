/*
  Warnings:

  - The values [AVAILABLE,MAINTENANCE] on the enum `STATION_STATUS` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "STATION_STATUS_new" AS ENUM ('UNDER_DEVELOPMENT', 'LIVE', 'CLOSED');
ALTER TABLE "ChargingStation" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "ChargingStation" ALTER COLUMN "status" TYPE "STATION_STATUS_new" USING ("status"::text::"STATION_STATUS_new");
ALTER TYPE "STATION_STATUS" RENAME TO "STATION_STATUS_old";
ALTER TYPE "STATION_STATUS_new" RENAME TO "STATION_STATUS";
DROP TYPE "STATION_STATUS_old";
COMMIT;

-- AlterTable
ALTER TABLE "ChargingStation" ALTER COLUMN "status" DROP NOT NULL,
ALTER COLUMN "status" DROP DEFAULT;
