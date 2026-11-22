-- CreateTable
CREATE TABLE "RfidRequest" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isDeleted" BOOLEAN DEFAULT false,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "amountPaid" DECIMAL(12,2) NOT NULL,
    "isIssued" BOOLEAN NOT NULL DEFAULT false,
    "issuedAt" TIMESTAMP(3),
    "CustomerProfile__fk__" TEXT NOT NULL,
    "RfidTag__fk__" TEXT,

    CONSTRAINT "RfidRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "RfidRequest_id_key" ON "RfidRequest"("id");

-- CreateIndex
CREATE UNIQUE INDEX "RfidRequest_RfidTag__fk___key" ON "RfidRequest"("RfidTag__fk__");

-- CreateIndex
CREATE INDEX "RfidRequest_CustomerProfile__fk___idx" ON "RfidRequest"("CustomerProfile__fk__");

-- CreateIndex
CREATE INDEX "RfidRequest_isIssued_idx" ON "RfidRequest"("isIssued");

-- AddForeignKey
ALTER TABLE "RfidRequest" ADD CONSTRAINT "RfidRequest_CustomerProfile__fk___fkey" FOREIGN KEY ("CustomerProfile__fk__") REFERENCES "CustomerProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RfidRequest" ADD CONSTRAINT "RfidRequest_RfidTag__fk___fkey" FOREIGN KEY ("RfidTag__fk__") REFERENCES "RfidTag"("id") ON DELETE SET NULL ON UPDATE CASCADE;
