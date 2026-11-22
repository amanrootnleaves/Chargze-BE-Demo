/*
  Warnings:

  - A unique constraint covering the columns `[ChargingStation__fk__,day]` on the table `WeeklyHour` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "WeeklyHour_ChargingStation__fk___day_key" ON "WeeklyHour"("ChargingStation__fk__", "day");
