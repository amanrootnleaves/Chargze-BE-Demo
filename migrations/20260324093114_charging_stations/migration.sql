-- CreateTable
CREATE TABLE "ChargingStation" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isDeleted" BOOLEAN DEFAULT false,
    "name" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "status" TEXT NOT NULL DEFAULT 'Available',
    "powerTypes" TEXT[],
    "amenities" TEXT[],
    "rating" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalReviews" INTEGER NOT NULL DEFAULT 0,
    "images" JSONB,

    CONSTRAINT "ChargingStation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Charger" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isDeleted" BOOLEAN DEFAULT false,
    "name" TEXT NOT NULL,
    "power" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Available',
    "slot" TEXT,
    "ChargingStation__fk__" TEXT NOT NULL,

    CONSTRAINT "Charger_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StationReview" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isDeleted" BOOLEAN DEFAULT false,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "images" JSONB,
    "ChargingStation__fk__" TEXT NOT NULL,
    "CustomerProfile__fk__" TEXT NOT NULL,

    CONSTRAINT "StationReview_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ChargingStation_id_key" ON "ChargingStation"("id");

-- CreateIndex
CREATE UNIQUE INDEX "Charger_id_key" ON "Charger"("id");

-- CreateIndex
CREATE INDEX "Charger_ChargingStation__fk___idx" ON "Charger"("ChargingStation__fk__");

-- CreateIndex
CREATE UNIQUE INDEX "StationReview_id_key" ON "StationReview"("id");

-- CreateIndex
CREATE INDEX "StationReview_ChargingStation__fk___idx" ON "StationReview"("ChargingStation__fk__");

-- CreateIndex
CREATE INDEX "StationReview_CustomerProfile__fk___idx" ON "StationReview"("CustomerProfile__fk__");

-- AddForeignKey
ALTER TABLE "Charger" ADD CONSTRAINT "Charger_ChargingStation__fk___fkey" FOREIGN KEY ("ChargingStation__fk__") REFERENCES "ChargingStation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StationReview" ADD CONSTRAINT "StationReview_ChargingStation__fk___fkey" FOREIGN KEY ("ChargingStation__fk__") REFERENCES "ChargingStation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StationReview" ADD CONSTRAINT "StationReview_CustomerProfile__fk___fkey" FOREIGN KEY ("CustomerProfile__fk__") REFERENCES "CustomerProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
