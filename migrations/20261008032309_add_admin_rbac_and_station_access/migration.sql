-- CreateEnum
CREATE TYPE "ADMIN_ROLE" AS ENUM ('SUPER_ADMIN', 'ADMIN', 'MANAGER', 'STATION_ADMIN', 'FLEET_ADMIN');

-- CreateEnum
CREATE TYPE "ACCOUNT_STATUS" AS ENUM ('INVITED', 'ACTIVE', 'INACTIVE');

-- AlterTable
ALTER TABLE "Account" ADD COLUMN     "adminRole" "ADMIN_ROLE",
ADD COLUMN     "status" "ACCOUNT_STATUS" NOT NULL DEFAULT 'INVITED';

-- CreateTable
CREATE TABLE "AccountStationAccess" (
    "id" TEXT NOT NULL,
    "Account__fk__" TEXT NOT NULL,
    "ChargingStation__fk__" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AccountStationAccess_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AccountStationAccess_Account__fk___idx" ON "AccountStationAccess"("Account__fk__");

-- CreateIndex
CREATE INDEX "AccountStationAccess_ChargingStation__fk___idx" ON "AccountStationAccess"("ChargingStation__fk__");

-- CreateIndex
CREATE UNIQUE INDEX "AccountStationAccess_Account__fk___ChargingStation__fk___key" ON "AccountStationAccess"("Account__fk__", "ChargingStation__fk__");

-- AddForeignKey
ALTER TABLE "AccountStationAccess" ADD CONSTRAINT "AccountStationAccess_Account__fk___fkey" FOREIGN KEY ("Account__fk__") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccountStationAccess" ADD CONSTRAINT "AccountStationAccess_ChargingStation__fk___fkey" FOREIGN KEY ("ChargingStation__fk__") REFERENCES "ChargingStation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
