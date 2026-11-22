-- CreateTable
CREATE TABLE "Cart" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isDeleted" BOOLEAN DEFAULT false,
    "CustomerProfile__fk__" TEXT NOT NULL,

    CONSTRAINT "Cart_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CartItem" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isDeleted" BOOLEAN DEFAULT false,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "Product__fk__" TEXT NOT NULL,
    "Cart__fk__" TEXT NOT NULL,

    CONSTRAINT "CartItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Cart_CustomerProfile__fk___key" ON "Cart"("CustomerProfile__fk__" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "Cart_id_key" ON "Cart"("id" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "CartItem_Cart__fk___Product__fk___key" ON "CartItem"("Cart__fk__" ASC, "Product__fk__" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "CartItem_id_key" ON "CartItem"("id" ASC);

-- AddForeignKey
ALTER TABLE "Cart" ADD CONSTRAINT "Cart_CustomerProfile__fk___fkey" FOREIGN KEY ("CustomerProfile__fk__") REFERENCES "CustomerProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CartItem" ADD CONSTRAINT "CartItem_Cart__fk___fkey" FOREIGN KEY ("Cart__fk__") REFERENCES "Cart"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CartItem" ADD CONSTRAINT "CartItem_Product__fk___fkey" FOREIGN KEY ("Product__fk__") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

