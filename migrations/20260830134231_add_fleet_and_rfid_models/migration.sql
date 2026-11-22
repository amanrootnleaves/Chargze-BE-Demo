-- CreateTable
CREATE TABLE "FleetOwner" (
    "id" TEXT NOT NULL,
    "fleetId" TEXT NOT NULL,
    "ownerName" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'LIVE',
    "onboardingDate" TIMESTAMP(3) NOT NULL,
    "closedDate" TIMESTAMP(3),
    "poc" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "mobileNo" TEXT NOT NULL,
    "addressLine1" TEXT NOT NULL,
    "addressLine2" TEXT,
    "pincode" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "paymentTerms" TEXT NOT NULL DEFAULT 'PREPAID',
    "payoutDay" TEXT,
    "entityName" TEXT,
    "entityType" TEXT NOT NULL DEFAULT 'FLEET_RESERVED',
    "gstNumber" TEXT NOT NULL,
    "gstDocUrl" TEXT,
    "agreementDocUrl" TEXT,
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "FleetOwner_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RfidTag" (
    "id" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,
    "tagType" TEXT NOT NULL DEFAULT 'STANDALONE',
    "balanceAmount" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "reserveAmount" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "mobileNumber" TEXT,
    "email" TEXT,
    "maxActiveTransactions" INTEGER DEFAULT 1,
    "inTransaction" BOOLEAN NOT NULL DEFAULT false,
    "isBlocked" BOOLEAN NOT NULL DEFAULT false,
    "expiryDate" TIMESTAMP(3) NOT NULL,
    "fleetOwner__fk__" TEXT,
    "parentRfid__fk__" TEXT,
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "RfidTag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RfidStationMapping" (
    "id" TEXT NOT NULL,
    "rfidTag__fk__" TEXT NOT NULL,
    "chargingStation__fk__" TEXT NOT NULL,
    "charger__fk__" TEXT,
    "connector__fk__" TEXT,
    "customPricePerKwh" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "RfidStationMapping_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "FleetOwner_fleetId_key" ON "FleetOwner"("fleetId");

-- CreateIndex
CREATE INDEX "FleetOwner_fleetId_idx" ON "FleetOwner"("fleetId");

-- CreateIndex
CREATE INDEX "FleetOwner_ownerName_idx" ON "FleetOwner"("ownerName");

-- CreateIndex
CREATE UNIQUE INDEX "RfidTag_tagId_key" ON "RfidTag"("tagId");

-- CreateIndex
CREATE INDEX "RfidTag_tagId_idx" ON "RfidTag"("tagId");

-- CreateIndex
CREATE INDEX "RfidTag_fleetOwner__fk___idx" ON "RfidTag"("fleetOwner__fk__");

-- CreateIndex
CREATE INDEX "RfidTag_parentRfid__fk___idx" ON "RfidTag"("parentRfid__fk__");

-- CreateIndex
CREATE INDEX "RfidStationMapping_rfidTag__fk___idx" ON "RfidStationMapping"("rfidTag__fk__");

-- CreateIndex
CREATE INDEX "RfidStationMapping_chargingStation__fk___idx" ON "RfidStationMapping"("chargingStation__fk__");

-- AddForeignKey
ALTER TABLE "RfidTag" ADD CONSTRAINT "RfidTag_fleetOwner__fk___fkey" FOREIGN KEY ("fleetOwner__fk__") REFERENCES "FleetOwner"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RfidTag" ADD CONSTRAINT "RfidTag_parentRfid__fk___fkey" FOREIGN KEY ("parentRfid__fk__") REFERENCES "RfidTag"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RfidStationMapping" ADD CONSTRAINT "RfidStationMapping_rfidTag__fk___fkey" FOREIGN KEY ("rfidTag__fk__") REFERENCES "RfidTag"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RfidStationMapping" ADD CONSTRAINT "RfidStationMapping_chargingStation__fk___fkey" FOREIGN KEY ("chargingStation__fk__") REFERENCES "ChargingStation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
