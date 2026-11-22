-- AlterTable
ALTER TABLE "Charger" ALTER COLUMN "name" DROP NOT NULL;

-- AlterTable
ALTER TABLE "StationSettings" ADD COLUMN     "isChargerPublic" BOOLEAN NOT NULL DEFAULT false;
