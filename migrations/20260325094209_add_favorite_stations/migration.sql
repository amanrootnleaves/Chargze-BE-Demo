-- CreateTable
CREATE TABLE "FavoriteStation" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isDeleted" BOOLEAN DEFAULT false,
    "CustomerProfile__fk__" TEXT NOT NULL,
    "ChargingStation__fk__" TEXT NOT NULL,

    CONSTRAINT "FavoriteStation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "FavoriteStation_id_key" ON "FavoriteStation"("id");

-- CreateIndex
CREATE INDEX "FavoriteStation_CustomerProfile__fk___idx" ON "FavoriteStation"("CustomerProfile__fk__");

-- CreateIndex
CREATE INDEX "FavoriteStation_ChargingStation__fk___idx" ON "FavoriteStation"("ChargingStation__fk__");

-- CreateIndex
CREATE UNIQUE INDEX "FavoriteStation_CustomerProfile__fk___ChargingStation__fk___key" ON "FavoriteStation"("CustomerProfile__fk__", "ChargingStation__fk__");

-- AddForeignKey
ALTER TABLE "FavoriteStation" ADD CONSTRAINT "FavoriteStation_CustomerProfile__fk___fkey" FOREIGN KEY ("CustomerProfile__fk__") REFERENCES "CustomerProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FavoriteStation" ADD CONSTRAINT "FavoriteStation_ChargingStation__fk___fkey" FOREIGN KEY ("ChargingStation__fk__") REFERENCES "ChargingStation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
