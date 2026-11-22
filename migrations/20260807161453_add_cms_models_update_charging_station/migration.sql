/*
  Warnings:

  - Added the required column `StationOwner__fk__` to the `ChargingStation` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Charger" ADD COLUMN     "chargingType" TEXT;

-- AlterTable
ALTER TABLE "ChargingStation" ADD COLUMN     "StationOwner__fk__" TEXT NOT NULL,
ADD COLUMN     "addressLine1" TEXT,
ADD COLUMN     "addressLine2" TEXT;

-- AlterTable
ALTER TABLE "Connector" ADD COLUMN     "chargingId" TEXT,
ADD COLUMN     "isPublic" BOOLEAN DEFAULT true,
ADD COLUMN     "price" DOUBLE PRECISION,
ADD COLUMN     "voltage" DOUBLE PRECISION;

-- CreateTable
CREATE TABLE "StationSettings" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isDeleted" BOOLEAN DEFAULT false,
    "ChargingStation__fk__" TEXT NOT NULL,
    "meterInterval" INTEGER,
    "selectedOperations" TEXT[],
    "websocketUrl" TEXT,
    "payWithCard" BOOLEAN DEFAULT false,
    "payWithWallet" BOOLEAN DEFAULT false,
    "enableNotification" BOOLEAN DEFAULT false,
    "notificationRecipients" TEXT[],
    "notifyEvents" TEXT[],
    "toleranceInWords" INTEGER,

    CONSTRAINT "StationSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StationCommercial" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isDeleted" BOOLEAN DEFAULT false,
    "ChargingStation__fk__" TEXT NOT NULL,
    "transactionChargeType" TEXT,
    "transactionChargeValue" DOUBLE PRECISION,
    "payoutCycle" TEXT,
    "payoutDay" TEXT,

    CONSTRAINT "StationCommercial_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StationDocument" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isDeleted" BOOLEAN DEFAULT false,
    "ChargingStation__fk__" TEXT NOT NULL,
    "documentType" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "fileName" TEXT,

    CONSTRAINT "StationDocument_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "StationSettings_id_key" ON "StationSettings"("id");

-- CreateIndex
CREATE UNIQUE INDEX "StationSettings_ChargingStation__fk___key" ON "StationSettings"("ChargingStation__fk__");

-- CreateIndex
CREATE UNIQUE INDEX "StationCommercial_id_key" ON "StationCommercial"("id");

-- CreateIndex
CREATE UNIQUE INDEX "StationCommercial_ChargingStation__fk___key" ON "StationCommercial"("ChargingStation__fk__");

-- CreateIndex
CREATE UNIQUE INDEX "StationDocument_id_key" ON "StationDocument"("id");

-- CreateIndex
CREATE INDEX "StationDocument_ChargingStation__fk___idx" ON "StationDocument"("ChargingStation__fk__");

-- AddForeignKey
ALTER TABLE "ChargingStation" ADD CONSTRAINT "ChargingStation_StationOwner__fk___fkey" FOREIGN KEY ("StationOwner__fk__") REFERENCES "StationOwner"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StationSettings" ADD CONSTRAINT "StationSettings_ChargingStation__fk___fkey" FOREIGN KEY ("ChargingStation__fk__") REFERENCES "ChargingStation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StationCommercial" ADD CONSTRAINT "StationCommercial_ChargingStation__fk___fkey" FOREIGN KEY ("ChargingStation__fk__") REFERENCES "ChargingStation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StationDocument" ADD CONSTRAINT "StationDocument_ChargingStation__fk___fkey" FOREIGN KEY ("ChargingStation__fk__") REFERENCES "ChargingStation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
