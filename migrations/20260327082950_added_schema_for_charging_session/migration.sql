-- CreateEnum
CREATE TYPE "SESSION_STATUS" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');

-- CreateTable
CREATE TABLE "ChargingSession" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isDeleted" BOOLEAN DEFAULT false,
    "status" "SESSION_STATUS" NOT NULL DEFAULT 'PENDING',
    "startTime" TIMESTAMP(3),
    "endTime" TIMESTAMP(3),
    "energyLimit" DECIMAL(10,2),
    "amountLimit" DECIMAL(12,2),
    "energyConsumed" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "totalAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "Charger__fk__" TEXT NOT NULL,
    "CustomerProfile__fk__" TEXT NOT NULL,
    "Transaction__fk__" TEXT,

    CONSTRAINT "ChargingSession_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ChargingSession_id_key" ON "ChargingSession"("id");

-- CreateIndex
CREATE UNIQUE INDEX "ChargingSession_Transaction__fk___key" ON "ChargingSession"("Transaction__fk__");

-- CreateIndex
CREATE INDEX "ChargingSession_Charger__fk___idx" ON "ChargingSession"("Charger__fk__");

-- CreateIndex
CREATE INDEX "ChargingSession_CustomerProfile__fk___idx" ON "ChargingSession"("CustomerProfile__fk__");

-- CreateIndex
CREATE INDEX "ChargingSession_status_idx" ON "ChargingSession"("status");

-- AddForeignKey
ALTER TABLE "ChargingSession" ADD CONSTRAINT "ChargingSession_Charger__fk___fkey" FOREIGN KEY ("Charger__fk__") REFERENCES "Charger"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChargingSession" ADD CONSTRAINT "ChargingSession_CustomerProfile__fk___fkey" FOREIGN KEY ("CustomerProfile__fk__") REFERENCES "CustomerProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChargingSession" ADD CONSTRAINT "ChargingSession_Transaction__fk___fkey" FOREIGN KEY ("Transaction__fk__") REFERENCES "Transaction"("id") ON DELETE SET NULL ON UPDATE CASCADE;
