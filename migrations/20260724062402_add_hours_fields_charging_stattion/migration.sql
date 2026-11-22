-- AlterTable
ALTER TABLE "ChargingStation" ADD COLUMN     "closingTime" TEXT,
ADD COLUMN     "holidaySchedule" JSONB,
ADD COLUMN     "isOpen24Hours" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "openingTime" TEXT;
