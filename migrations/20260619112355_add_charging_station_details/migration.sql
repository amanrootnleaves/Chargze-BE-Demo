-- AlterTable
ALTER TABLE "ChargingStation" ADD COLUMN     "accessType" TEXT,
ADD COLUMN     "closedDate" TEXT,
ADD COLUMN     "emergencyContact" TEXT,
ADD COLUMN     "liveDate" TEXT,
ADD COLUMN     "onboardingDate" TEXT,
ADD COLUMN     "ownership" TEXT,
ADD COLUMN     "poc" TEXT,
ADD COLUMN     "pocEmail" TEXT,
ADD COLUMN     "pocMobile" TEXT,
ADD COLUMN     "stationId" TEXT,
ADD COLUMN     "type" TEXT;
