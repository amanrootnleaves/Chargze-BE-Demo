/*
  Warnings:

  - Added the required column `city` to the `ChargingStation` table without a default value. This is not possible if the table is not empty.
  - Added the required column `pincode` to the `ChargingStation` table without a default value. This is not possible if the table is not empty.
  - Added the required column `state` to the `ChargingStation` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Charger" 
ADD COLUMN     "chargeboxId" TEXT,
ADD COLUMN     "lastConnected" TIMESTAMP(3);

ALTER TABLE "ChargingStation" 
ADD COLUMN "Company__fk__" TEXT,
ADD COLUMN "city" TEXT,
ADD COLUMN "pincode" TEXT,
ADD COLUMN "state" TEXT;

UPDATE "ChargingStation"
SET 
  "city" = COALESCE("city", 'Noida'),
  "state" = COALESCE("state", 'UP'),
  "pincode" = COALESCE("pincode", '201301');

ALTER TABLE "ChargingStation"
ALTER COLUMN "city" SET NOT NULL,
ALTER COLUMN "state" SET NOT NULL,
ALTER COLUMN "pincode" SET NOT NULL;

-- CreateTable
CREATE TABLE "Invitation" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isDeleted" BOOLEAN DEFAULT false,
    "phoneNumber" TEXT NOT NULL,
    "friendName" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "InvitedBy__fk__" TEXT,

    CONSTRAINT "Invitation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Invitation_id_key" ON "Invitation"("id");

-- CreateIndex
CREATE INDEX "Invitation_InvitedBy__fk___idx" ON "Invitation"("InvitedBy__fk__");

-- CreateIndex
CREATE INDEX "ChargingStation_city_idx" ON "ChargingStation"("city");

-- CreateIndex
CREATE INDEX "ChargingStation_state_idx" ON "ChargingStation"("state");

-- CreateIndex
CREATE INDEX "ChargingStation_pincode_idx" ON "ChargingStation"("pincode");

-- AddForeignKey
ALTER TABLE "ChargingStation" ADD CONSTRAINT "ChargingStation_Company__fk___fkey" FOREIGN KEY ("Company__fk__") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invitation" ADD CONSTRAINT "Invitation_InvitedBy__fk___fkey" FOREIGN KEY ("InvitedBy__fk__") REFERENCES "Account"("id") ON DELETE SET NULL ON UPDATE CASCADE;
