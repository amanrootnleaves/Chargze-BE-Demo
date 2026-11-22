-- CreateEnum
CREATE TYPE "OWNER_STATUS" AS ENUM ('COMPLETED', 'INCOMPLETE', 'CLOSED');

-- CreateEnum
CREATE TYPE "PARTNER_TYPE" AS ENUM ('FOFO', 'COCO');

-- CreateTable
CREATE TABLE "StationOwner" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "partnerType" "PARTNER_TYPE" NOT NULL,
    "status" "OWNER_STATUS" NOT NULL DEFAULT 'INCOMPLETE',
    "onboardingDate" TIMESTAMP(3) NOT NULL,
    "closedDate" TIMESTAMP(3),
    "ownerName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phoneNumber" TEXT NOT NULL,
    "addressLineOne" TEXT NOT NULL,
    "addressLineTwo" TEXT NOT NULL,
    "pincode" INTEGER NOT NULL,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,

    CONSTRAINT "StationOwner_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LegalDetails" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "entityName" TEXT,
    "entityType" TEXT NOT NULL,
    "aadhaarNumber" TEXT NOT NULL,
    "panNumber" TEXT NOT NULL,
    "gstNumber" TEXT NOT NULL,
    "StationOwner__fk__" TEXT NOT NULL,

    CONSTRAINT "LegalDetails_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BankingDetails" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "accountHolderName" TEXT NOT NULL,
    "accountHolderNumber" TEXT NOT NULL,
    "accountHolderBank" TEXT NOT NULL,
    "ifscCode" TEXT NOT NULL,
    "StationOwner__fk__" TEXT NOT NULL,

    CONSTRAINT "BankingDetails_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OwnerDocument" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "aadhaar" TEXT NOT NULL,
    "pancard" TEXT NOT NULL,
    "gst" TEXT NOT NULL,
    "cancelledCheque" TEXT NOT NULL,
    "StationOwner__fk__" TEXT NOT NULL,

    CONSTRAINT "OwnerDocument_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "StationOwner_id_key" ON "StationOwner"("id");

-- CreateIndex
CREATE UNIQUE INDEX "LegalDetails_id_key" ON "LegalDetails"("id");

-- CreateIndex
CREATE UNIQUE INDEX "LegalDetails_StationOwner__fk___key" ON "LegalDetails"("StationOwner__fk__");

-- CreateIndex
CREATE INDEX "LegalDetails_StationOwner__fk___idx" ON "LegalDetails"("StationOwner__fk__");

-- CreateIndex
CREATE UNIQUE INDEX "BankingDetails_id_key" ON "BankingDetails"("id");

-- CreateIndex
CREATE UNIQUE INDEX "BankingDetails_StationOwner__fk___key" ON "BankingDetails"("StationOwner__fk__");

-- CreateIndex
CREATE INDEX "BankingDetails_StationOwner__fk___idx" ON "BankingDetails"("StationOwner__fk__");

-- CreateIndex
CREATE UNIQUE INDEX "OwnerDocument_id_key" ON "OwnerDocument"("id");

-- CreateIndex
CREATE UNIQUE INDEX "OwnerDocument_StationOwner__fk___key" ON "OwnerDocument"("StationOwner__fk__");

-- CreateIndex
CREATE INDEX "OwnerDocument_StationOwner__fk___idx" ON "OwnerDocument"("StationOwner__fk__");

-- AddForeignKey
ALTER TABLE "LegalDetails" ADD CONSTRAINT "LegalDetails_StationOwner__fk___fkey" FOREIGN KEY ("StationOwner__fk__") REFERENCES "StationOwner"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BankingDetails" ADD CONSTRAINT "BankingDetails_StationOwner__fk___fkey" FOREIGN KEY ("StationOwner__fk__") REFERENCES "StationOwner"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OwnerDocument" ADD CONSTRAINT "OwnerDocument_StationOwner__fk___fkey" FOREIGN KEY ("StationOwner__fk__") REFERENCES "StationOwner"("id") ON DELETE CASCADE ON UPDATE CASCADE;
