/*
  Warnings:

  - A unique constraint covering the columns `[gstin]` on the table `Gst` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Gst_gstin_key" ON "Gst"("gstin");
