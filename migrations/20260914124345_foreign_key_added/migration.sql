-- AlterTable
ALTER TABLE "ChargingSession" ADD COLUMN     "Connector__fk__" TEXT,
ADD COLUMN     "RfidTag__fk__" TEXT;

-- AlterTable
ALTER TABLE "Transaction" ADD COLUMN     "invoiceUrl" TEXT,
ADD COLUMN     "refundAmount" DECIMAL(12,2) DEFAULT 0;

-- CreateIndex
CREATE INDEX "ChargingSession_Connector__fk___idx" ON "ChargingSession"("Connector__fk__");

-- CreateIndex
CREATE INDEX "ChargingSession_RfidTag__fk___idx" ON "ChargingSession"("RfidTag__fk__");

-- AddForeignKey
ALTER TABLE "ChargingSession" ADD CONSTRAINT "ChargingSession_Connector__fk___fkey" FOREIGN KEY ("Connector__fk__") REFERENCES "Connector"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChargingSession" ADD CONSTRAINT "ChargingSession_RfidTag__fk___fkey" FOREIGN KEY ("RfidTag__fk__") REFERENCES "RfidTag"("id") ON DELETE SET NULL ON UPDATE CASCADE;
