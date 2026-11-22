-- CreateTable
CREATE TABLE "WeeklyHour" (
    "id" TEXT NOT NULL,
    "day" TEXT NOT NULL,
    "openingTime" TEXT,
    "closingTime" TEXT,
    "is24Hours" BOOLEAN NOT NULL DEFAULT false,
    "ChargingStation__fk__" TEXT NOT NULL,

    CONSTRAINT "WeeklyHour_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "WeeklyHour_ChargingStation__fk___idx" ON "WeeklyHour"("ChargingStation__fk__");

-- AddForeignKey
ALTER TABLE "WeeklyHour" ADD CONSTRAINT "WeeklyHour_ChargingStation__fk___fkey" FOREIGN KEY ("ChargingStation__fk__") REFERENCES "ChargingStation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
