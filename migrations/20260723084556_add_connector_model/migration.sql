-- CreateEnum
CREATE TYPE "ConnectorStatus" AS ENUM ('AVAILABLE', 'OFFLINE', 'BUSY');

-- CreateTable
CREATE TABLE "Connector" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isDeleted" BOOLEAN DEFAULT false,
    "name" TEXT NOT NULL,
    "connectorType" TEXT NOT NULL,
    "power" TEXT,
    "status" "ConnectorStatus" NOT NULL DEFAULT 'AVAILABLE',
    "Charger__fk__" TEXT NOT NULL,

    CONSTRAINT "Connector_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Connector_id_key" ON "Connector"("id");

-- CreateIndex
CREATE INDEX "Connector_Charger__fk___idx" ON "Connector"("Charger__fk__");

-- AddForeignKey
ALTER TABLE "Connector" ADD CONSTRAINT "Connector_Charger__fk___fkey" FOREIGN KEY ("Charger__fk__") REFERENCES "Charger"("id") ON DELETE CASCADE ON UPDATE CASCADE;
