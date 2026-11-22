-- CreateEnum
CREATE TYPE "RemoteOperationType" AS ENUM ('CHANGE_AVAILABILITY', 'CHANGE_CONFIGURATION', 'REMOTE_START', 'REMOTE_STOP', 'GET_DIAGNOSTICS', 'UPDATE_FIRMWARE', 'RESET', 'TRIGGER_MESSAGE', 'UNLOCK_CONNECTOR', 'SET_CHARGING_PROFILE');

-- AlterTable
ALTER TABLE "Charger" ALTER COLUMN "power" DROP NOT NULL;

-- CreateTable
CREATE TABLE "RemoteOperationConfig" (
    "id" TEXT NOT NULL,
    "ChargingStation__fk__" TEXT NOT NULL,
    "connectorId" INTEGER NOT NULL,
    "meterIntervalSeconds" INTEGER NOT NULL,
    "selectedOperation" "RemoteOperationType" NOT NULL,

    CONSTRAINT "RemoteOperationConfig_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "RemoteOperationConfig_ChargingStation__fk___key" ON "RemoteOperationConfig"("ChargingStation__fk__");

-- AddForeignKey
ALTER TABLE "RemoteOperationConfig" ADD CONSTRAINT "RemoteOperationConfig_ChargingStation__fk___fkey" FOREIGN KEY ("ChargingStation__fk__") REFERENCES "ChargingStation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
