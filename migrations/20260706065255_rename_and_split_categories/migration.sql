/*
  Warnings:

  - You are about to drop the `Category` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Category" DROP CONSTRAINT "Category_Company__fk___fkey";

-- DropForeignKey
ALTER TABLE "Category" DROP CONSTRAINT "Category_ParentCategory__fk___fkey";

-- DropTable
DROP TABLE "Category";

-- CreateTable
CREATE TABLE "PartsCategory" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isDeleted" BOOLEAN DEFAULT false,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "iconStoredAt" JSONB,
    "imageStoredAt" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER,
    "Company__fk__" TEXT,
    "ParentCategory__fk__" TEXT,

    CONSTRAINT "PartsCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VehiclesCategory" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isDeleted" BOOLEAN DEFAULT false,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "iconStoredAt" JSONB,
    "imageStoredAt" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER,
    "Company__fk__" TEXT,
    "ParentCategory__fk__" TEXT,

    CONSTRAINT "VehiclesCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ElectricVehicle" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(6) NOT NULL,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "vehicleName" TEXT NOT NULL,
    "brand" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "variant" TEXT,
    "year" INTEGER,
    "vehicleType" TEXT NOT NULL,
    "category" TEXT,
    "bodyType" TEXT,
    "exShowroomPrice" DECIMAL(12,2) NOT NULL,
    "onRoadPrice" DECIMAL(12,2),
    "salePrice" DECIMAL(12,2),
    "discountPercent" DECIMAL(5,2),
    "batteryCapacity" TEXT,
    "batteryType" TEXT,
    "batteryVoltage" INTEGER,
    "removableBattery" BOOLEAN,
    "chargingTimeAC" TEXT,
    "chargingTimeDC" TEXT,
    "chargerType" TEXT,
    "fastCharging" BOOLEAN NOT NULL DEFAULT false,
    "rangeKm" INTEGER,
    "topSpeedKmph" INTEGER,
    "motorPowerKW" DECIMAL(8,2),
    "motorTorqueNm" DECIMAL(8,2),
    "acceleration0To40" TEXT,
    "kerbWeightKg" INTEGER,
    "seatHeightMm" INTEGER,
    "groundClearanceMm" INTEGER,
    "wheelbaseMm" INTEGER,
    "tyreFront" TEXT,
    "tyreRear" TEXT,
    "brakeFront" TEXT,
    "brakeRear" TEXT,
    "abs" BOOLEAN NOT NULL DEFAULT false,
    "cruiseControl" BOOLEAN NOT NULL DEFAULT false,
    "reverseMode" BOOLEAN NOT NULL DEFAULT false,
    "regenerativeBraking" BOOLEAN NOT NULL DEFAULT false,
    "navigation" BOOLEAN NOT NULL DEFAULT false,
    "bluetooth" BOOLEAN NOT NULL DEFAULT false,
    "gps" BOOLEAN NOT NULL DEFAULT false,
    "usbCharging" BOOLEAN NOT NULL DEFAULT false,
    "mobileApp" BOOLEAN NOT NULL DEFAULT false,
    "antiTheft" BOOLEAN NOT NULL DEFAULT false,
    "batteryWarranty" TEXT,
    "vehicleWarranty" TEXT,
    "stock" INTEGER NOT NULL DEFAULT 0,
    "images" JSONB,
    "colors" TEXT[],
    "brochure" TEXT,
    "videos" JSONB,
    "description" TEXT,
    "specifications" JSONB,
    "features" JSONB,
    "Company__fk__" TEXT,

    CONSTRAINT "ElectricVehicle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VehicleReview" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "ElectricVehicle__fk__" TEXT NOT NULL,
    "CustomerProfile__fk__" TEXT NOT NULL,

    CONSTRAINT "VehicleReview_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PartsCategory_id_key" ON "PartsCategory"("id");

-- CreateIndex
CREATE INDEX "PartsCategory_Company__fk___idx" ON "PartsCategory"("Company__fk__");

-- CreateIndex
CREATE INDEX "PartsCategory_ParentCategory__fk___idx" ON "PartsCategory"("ParentCategory__fk__");

-- CreateIndex
CREATE INDEX "PartsCategory_isActive_idx" ON "PartsCategory"("isActive");

-- CreateIndex
CREATE INDEX "PartsCategory_isFeatured_idx" ON "PartsCategory"("isFeatured");

-- CreateIndex
CREATE UNIQUE INDEX "PartsCategory_slug_Company__fk___key" ON "PartsCategory"("slug", "Company__fk__");

-- CreateIndex
CREATE UNIQUE INDEX "VehiclesCategory_id_key" ON "VehiclesCategory"("id");

-- CreateIndex
CREATE INDEX "VehiclesCategory_Company__fk___idx" ON "VehiclesCategory"("Company__fk__");

-- CreateIndex
CREATE INDEX "VehiclesCategory_ParentCategory__fk___idx" ON "VehiclesCategory"("ParentCategory__fk__");

-- CreateIndex
CREATE INDEX "VehiclesCategory_isActive_idx" ON "VehiclesCategory"("isActive");

-- CreateIndex
CREATE INDEX "VehiclesCategory_isFeatured_idx" ON "VehiclesCategory"("isFeatured");

-- CreateIndex
CREATE UNIQUE INDEX "VehiclesCategory_slug_Company__fk___key" ON "VehiclesCategory"("slug", "Company__fk__");

-- CreateIndex
CREATE INDEX "ElectricVehicle_Company__fk___idx" ON "ElectricVehicle"("Company__fk__");

-- CreateIndex
CREATE INDEX "ElectricVehicle_brand_idx" ON "ElectricVehicle"("brand");

-- CreateIndex
CREATE INDEX "ElectricVehicle_vehicleType_idx" ON "ElectricVehicle"("vehicleType");

-- AddForeignKey
ALTER TABLE "PartsCategory" ADD CONSTRAINT "PartsCategory_Company__fk___fkey" FOREIGN KEY ("Company__fk__") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PartsCategory" ADD CONSTRAINT "PartsCategory_ParentCategory__fk___fkey" FOREIGN KEY ("ParentCategory__fk__") REFERENCES "PartsCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VehiclesCategory" ADD CONSTRAINT "VehiclesCategory_Company__fk___fkey" FOREIGN KEY ("Company__fk__") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VehiclesCategory" ADD CONSTRAINT "VehiclesCategory_ParentCategory__fk___fkey" FOREIGN KEY ("ParentCategory__fk__") REFERENCES "VehiclesCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ElectricVehicle" ADD CONSTRAINT "ElectricVehicle_Company__fk___fkey" FOREIGN KEY ("Company__fk__") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VehicleReview" ADD CONSTRAINT "VehicleReview_ElectricVehicle__fk___fkey" FOREIGN KEY ("ElectricVehicle__fk__") REFERENCES "ElectricVehicle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VehicleReview" ADD CONSTRAINT "VehicleReview_CustomerProfile__fk___fkey" FOREIGN KEY ("CustomerProfile__fk__") REFERENCES "CustomerProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
