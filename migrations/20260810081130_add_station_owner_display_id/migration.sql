/*
  Warnings:

  - A unique constraint covering the columns `[displayId]` on the table `StationOwner` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "StationOwner" ADD COLUMN     "displayId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "StationOwner_displayId_key" ON "StationOwner"("displayId");
