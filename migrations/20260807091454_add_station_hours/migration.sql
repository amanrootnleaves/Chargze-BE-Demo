-- AlterTable
ALTER TABLE "ChargingStation" ADD COLUMN     "holidayHours" TEXT;

-- CreateTable
CREATE TABLE "StationHours" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isDeleted" BOOLEAN DEFAULT false,
    "dayOfWeek" INTEGER NOT NULL,
    "isOpen24Hours" BOOLEAN NOT NULL DEFAULT true,
    "isClosed" BOOLEAN NOT NULL DEFAULT false,
    "openTime" TEXT,
    "closeTime" TEXT,
    "ChargingStation__fk__" TEXT NOT NULL,

    CONSTRAINT "StationHours_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "StationHours_id_key" ON "StationHours"("id");

-- CreateIndex
CREATE INDEX "StationHours_ChargingStation__fk___idx" ON "StationHours"("ChargingStation__fk__");

-- CreateIndex
CREATE UNIQUE INDEX "StationHours_ChargingStation__fk___dayOfWeek_key" ON "StationHours"("ChargingStation__fk__", "dayOfWeek");

-- AddForeignKey
ALTER TABLE "StationHours" ADD CONSTRAINT "StationHours_ChargingStation__fk___fkey" FOREIGN KEY ("ChargingStation__fk__") REFERENCES "ChargingStation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
