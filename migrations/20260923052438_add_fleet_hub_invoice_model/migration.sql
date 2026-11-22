-- CreateEnum
CREATE TYPE "INVOICE_STATUS" AS ENUM ('PAID', 'PENDING', 'OVERDUE');

-- AlterTable
ALTER TABLE "ChargingSession" ADD COLUMN     "fleetHubInvoice__fk__" TEXT;

-- CreateTable
CREATE TABLE "FleetHubInvoice" (
    "id" TEXT NOT NULL,
    "invoiceNumber" TEXT NOT NULL,
    "fleetOwner__fk__" TEXT NOT NULL,
    "chargingStation__fk__" TEXT NOT NULL,
    "billingPeriod" TEXT NOT NULL,
    "billingStartDate" TIMESTAMP(3) NOT NULL,
    "billingEndDate" TIMESTAMP(3) NOT NULL,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "totalSessions" INTEGER NOT NULL DEFAULT 0,
    "totalEnergy" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "subtotal" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "gstAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "totalAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "status" "INVOICE_STATUS" NOT NULL DEFAULT 'PENDING',
    "invoiceUrl" TEXT,
    "paidAt" TIMESTAMP(3),
    "sentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "FleetHubInvoice_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "FleetHubInvoice_invoiceNumber_key" ON "FleetHubInvoice"("invoiceNumber");

-- CreateIndex
CREATE INDEX "FleetHubInvoice_fleetOwner__fk___idx" ON "FleetHubInvoice"("fleetOwner__fk__");

-- CreateIndex
CREATE INDEX "FleetHubInvoice_chargingStation__fk___idx" ON "FleetHubInvoice"("chargingStation__fk__");

-- CreateIndex
CREATE INDEX "FleetHubInvoice_status_idx" ON "FleetHubInvoice"("status");

-- CreateIndex
CREATE INDEX "FleetHubInvoice_dueDate_idx" ON "FleetHubInvoice"("dueDate");

-- CreateIndex
CREATE UNIQUE INDEX "FleetHubInvoice_fleetOwner__fk___chargingStation__fk___bill_key" ON "FleetHubInvoice"("fleetOwner__fk__", "chargingStation__fk__", "billingStartDate", "billingEndDate");

-- CreateIndex
CREATE INDEX "ChargingSession_fleetHubInvoice__fk___idx" ON "ChargingSession"("fleetHubInvoice__fk__");

-- AddForeignKey
ALTER TABLE "ChargingSession" ADD CONSTRAINT "ChargingSession_fleetHubInvoice__fk___fkey" FOREIGN KEY ("fleetHubInvoice__fk__") REFERENCES "FleetHubInvoice"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FleetHubInvoice" ADD CONSTRAINT "FleetHubInvoice_fleetOwner__fk___fkey" FOREIGN KEY ("fleetOwner__fk__") REFERENCES "FleetOwner"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FleetHubInvoice" ADD CONSTRAINT "FleetHubInvoice_chargingStation__fk___fkey" FOREIGN KEY ("chargingStation__fk__") REFERENCES "ChargingStation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
