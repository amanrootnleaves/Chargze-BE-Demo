-- CreateTable
CREATE TABLE "Review" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isDeleted" BOOLEAN DEFAULT false,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "images" JSONB,
    "Product__fk__" TEXT NOT NULL,
    "CustomerProfile__fk__" TEXT NOT NULL,

    CONSTRAINT "Review_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Review_id_key" ON "Review"("id");

-- CreateIndex
CREATE INDEX "Review_Product__fk___idx" ON "Review"("Product__fk__");

-- CreateIndex
CREATE INDEX "Review_CustomerProfile__fk___idx" ON "Review"("CustomerProfile__fk__");

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_Product__fk___fkey" FOREIGN KEY ("Product__fk__") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_CustomerProfile__fk___fkey" FOREIGN KEY ("CustomerProfile__fk__") REFERENCES "CustomerProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
