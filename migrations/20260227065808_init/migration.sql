-- CreateEnum
CREATE TYPE "ACCOUNT_TYPE" AS ENUM ('ADMIN', 'COMPANY', 'EMPLOYEE', 'VENDOR', 'CUSTOMER');

-- CreateEnum
CREATE TYPE "ORDER_STATUS" AS ENUM ('PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "PAYMENT_STATUS" AS ENUM ('UNPAID', 'PAID', 'FAILED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "PAYMENT_METHOD" AS ENUM ('CARD', 'UPI', 'NET_BANKING', 'WALLET', 'CASH_ON_DELIVERY');

-- CreateEnum
CREATE TYPE "CUSTOMER_STATUS" AS ENUM ('ACTIVE', 'INACTIVE', 'VIP');

-- CreateEnum
CREATE TYPE "TRANSACTION_STATUS" AS ENUM ('PENDING', 'SUCCESS', 'FAILED', 'CANCELLED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "TRANSACTION_TYPE" AS ENUM ('PAYMENT', 'REFUND', 'PARTIAL_REFUND');

-- CreateEnum
CREATE TYPE "PAYMENT_GATEWAY" AS ENUM ('RAZORPAY', 'STRIPE', 'PAYPAL', 'MANUAL');

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "fullName" TEXT,
    "password" TEXT,
    "isBlocked" BOOLEAN NOT NULL DEFAULT false,
    "thumbnailStoredAt" JSON,
    "email" TEXT,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "verificationToken" TEXT,
    "verificationTokenExpiry" TIMESTAMP(3),
    "address" TEXT,
    "displayName" TEXT,
    "isDeleted" BOOLEAN DEFAULT false,
    "phoneNumber" TEXT,
    "accountType" "ACCOUNT_TYPE" NOT NULL DEFAULT 'EMPLOYEE',
    "ParentAccount__fk__" TEXT,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DynamicColumn" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isDeleted" BOOLEAN DEFAULT false,
    "fields" JSONB,
    "Feature__fk__" TEXT,
    "Company__fk__" TEXT,
    "Account__fk__" TEXT,

    CONSTRAINT "DynamicColumn_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Company" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isDeleted" BOOLEAN DEFAULT false,
    "displayName" TEXT,
    "address" TEXT,
    "phoneNumber" TEXT,
    "Account__fk__" TEXT,

    CONSTRAINT "Company_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CompanyFeatureEntry" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isDeleted" BOOLEAN DEFAULT false,
    "data" JSONB,
    "Feature__fk__" TEXT,
    "Company__fk__" TEXT,
    "Account__fk__" TEXT,
    "Project__fk__" TEXT,

    CONSTRAINT "CompanyFeatureEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CompanyFeatureEntryHistory" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isDeleted" BOOLEAN DEFAULT false,
    "fromData" JSONB,
    "toData" JSONB,
    "CompanyFeatureEntry__fk__" TEXT,
    "ChangedByAccount__fk__" TEXT,

    CONSTRAINT "CompanyFeatureEntryHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Order" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isDeleted" BOOLEAN DEFAULT false,
    "orderCode" TEXT NOT NULL,
    "status" "ORDER_STATUS" NOT NULL DEFAULT 'PENDING',
    "totalAmount" DECIMAL(12,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "orderedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "cancelledAt" TIMESTAMP(3),
    "deliveredAt" TIMESTAMP(3),
    "CustomerProfile__fk__" TEXT,
    "Company__fk__" TEXT,

    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderItem" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isDeleted" BOOLEAN DEFAULT false,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "unitPrice" DECIMAL(12,2) NOT NULL,
    "subtotal" DECIMAL(12,2) NOT NULL,
    "ProductName" TEXT NOT NULL,
    "ProductSku" TEXT,
    "ProductImage" JSONB NOT NULL,
    "Order__fk__" TEXT,

    CONSTRAINT "OrderItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderPayment" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isDeleted" BOOLEAN DEFAULT false,
    "status" "PAYMENT_STATUS" NOT NULL DEFAULT 'UNPAID',
    "method" "PAYMENT_METHOD",
    "transactionId" TEXT,
    "amount" DECIMAL(12,2) NOT NULL,
    "paidAt" TIMESTAMP(3),
    "Order__fk__" TEXT,

    CONSTRAINT "OrderPayment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Category" (
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

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Transaction" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isDeleted" BOOLEAN DEFAULT false,
    "amount" DECIMAL(12,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "status" "TRANSACTION_STATUS" NOT NULL,
    "type" "TRANSACTION_TYPE" NOT NULL,
    "gateway" "PAYMENT_GATEWAY",
    "gatewayTxnId" TEXT,
    "gatewayResponse" JSONB,
    "paidAt" TIMESTAMP(3),
    "failureReason" TEXT,
    "Order__fk__" TEXT,
    "Company__fk__" TEXT,
    "CustomerProfile__fk__" TEXT,

    CONSTRAINT "Transaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Project" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "displayName" TEXT,
    "description" TEXT,
    "account" JSONB,
    "isDeleted" BOOLEAN DEFAULT false,
    "Account__fk__" TEXT,
    "Company__fk__" TEXT,

    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Scope" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "displayName" TEXT,
    "description" TEXT,
    "isDeleted" BOOLEAN DEFAULT false,
    "feature" JSONB,
    "role" JSONB,
    "isAllowedToCreate" BOOLEAN,
    "isAllowedToUpdate" BOOLEAN,
    "isAllowedToDelete" BOOLEAN,
    "isAllowedToRead" BOOLEAN,
    "Company__fk__" TEXT,
    "Account__fk__" TEXT,

    CONSTRAINT "Scope_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Gst" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "displayName" TEXT,
    "description" TEXT,
    "country" JSON,
    "state" JSON,
    "isDeleted" BOOLEAN DEFAULT false,
    "Company__fk__" TEXT,
    "Account__fk__" TEXT,

    CONSTRAINT "Gst_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Feature" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "displayName" TEXT,
    "description" TEXT,
    "thumbnailStoredAt" JSONB,
    "isDeleted" BOOLEAN DEFAULT false,
    "fields" JSONB,
    "Project__fk__" TEXT,
    "Account__fk__" TEXT,
    "gstId" TEXT,
    "Scope__fk__" TEXT,

    CONSTRAINT "Feature_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Workflow" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "displayName" TEXT,
    "description" TEXT,
    "thumbnailStoredAt" JSONB,
    "edges" JSONB,
    "project" JSONB,
    "feature" JSONB,
    "isRequired" BOOLEAN DEFAULT false,
    "isDeleted" BOOLEAN DEFAULT false,
    "Project__fk__" TEXT,
    "Feature__fk__" TEXT,
    "Account__fk__" TEXT,
    "Company__fk__" TEXT,

    CONSTRAINT "Workflow_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkflowStep" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "thumbnailStoredAt" JSONB,
    "isDeleted" BOOLEAN DEFAULT false,
    "nodeColor" TEXT,
    "conditions" JSONB,
    "role" JSONB,
    "position" JSONB,
    "data" JSONB,
    "style" JSONB,
    "Workflow__fk__" TEXT,
    "Role__fk__" TEXT,

    CONSTRAINT "WorkflowStep_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProjectEmployee" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isDeleted" BOOLEAN DEFAULT false,
    "Project__fk__" TEXT,

    CONSTRAINT "ProjectEmployee_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Role" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isDeleted" BOOLEAN DEFAULT false,
    "displayName" TEXT,
    "description" TEXT,
    "role" JSONB[],
    "Company__fk__" TEXT,
    "Scope__fk__" TEXT,

    CONSTRAINT "Role_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FolderAccount" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "displayName" TEXT,
    "isDeleted" BOOLEAN DEFAULT false,
    "Company__fk__" TEXT,

    CONSTRAINT "FolderAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CustomerProfile" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isDeleted" BOOLEAN DEFAULT false,
    "customerCode" TEXT NOT NULL,
    "status" "CUSTOMER_STATUS" NOT NULL DEFAULT 'ACTIVE',
    "totalOrders" INTEGER NOT NULL DEFAULT 0,
    "totalSpend" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "lastOrderAt" TIMESTAMP(3),
    "lastLoginAt" TIMESTAMP(3),
    "Company__fk__" TEXT,
    "Account__fk__" TEXT NOT NULL,

    CONSTRAINT "CustomerProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Product" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isDeleted" BOOLEAN DEFAULT false,
    "productName" TEXT NOT NULL,
    "mainCategory" TEXT,
    "subCategory" TEXT,
    "childCategory" TEXT,
    "vehicleType" TEXT,
    "fuelType" TEXT,
    "brand" TEXT,
    "model" TEXT,
    "partCode" TEXT,
    "hsnCode" TEXT,
    "oemPartCode" TEXT,
    "mrp" DECIMAL(12,2) NOT NULL,
    "taxPercent" DECIMAL(5,2),
    "quantity" INTEGER NOT NULL DEFAULT 0,
    "b2cSale" BOOLEAN NOT NULL DEFAULT false,
    "b2cRecommended" BOOLEAN NOT NULL DEFAULT false,
    "b2cTrending" BOOLEAN NOT NULL DEFAULT false,
    "b2bSale" BOOLEAN NOT NULL DEFAULT false,
    "b2bRecommended" BOOLEAN NOT NULL DEFAULT false,
    "b2bTrending" BOOLEAN NOT NULL DEFAULT false,
    "compactable" TEXT[],
    "images" JSONB,
    "Company__fk__" TEXT,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_AccountToRole" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "_AccountToFolderAccount" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "_AccountToProjectEmployee" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "Account_id_key" ON "Account"("id");

-- CreateIndex
CREATE UNIQUE INDEX "email_1676392778723_index" ON "Account"("email");

-- CreateIndex
CREATE UNIQUE INDEX "DynamicColumn_id_key" ON "DynamicColumn"("id");

-- CreateIndex
CREATE UNIQUE INDEX "Company_id_key" ON "Company"("id");

-- CreateIndex
CREATE UNIQUE INDEX "CompanyFeatureEntry_id_key" ON "CompanyFeatureEntry"("id");

-- CreateIndex
CREATE UNIQUE INDEX "CompanyFeatureEntryHistory_id_key" ON "CompanyFeatureEntryHistory"("id");

-- CreateIndex
CREATE UNIQUE INDEX "Order_id_key" ON "Order"("id");

-- CreateIndex
CREATE UNIQUE INDEX "Order_orderCode_key" ON "Order"("orderCode");

-- CreateIndex
CREATE INDEX "Order_CustomerProfile__fk___idx" ON "Order"("CustomerProfile__fk__");

-- CreateIndex
CREATE INDEX "Order_Company__fk___idx" ON "Order"("Company__fk__");

-- CreateIndex
CREATE INDEX "Order_status_idx" ON "Order"("status");

-- CreateIndex
CREATE INDEX "Order_orderedAt_idx" ON "Order"("orderedAt");

-- CreateIndex
CREATE UNIQUE INDEX "OrderItem_id_key" ON "OrderItem"("id");

-- CreateIndex
CREATE INDEX "OrderItem_Order__fk___idx" ON "OrderItem"("Order__fk__");

-- CreateIndex
CREATE UNIQUE INDEX "OrderPayment_id_key" ON "OrderPayment"("id");

-- CreateIndex
CREATE UNIQUE INDEX "OrderPayment_Order__fk___key" ON "OrderPayment"("Order__fk__");

-- CreateIndex
CREATE UNIQUE INDEX "Category_id_key" ON "Category"("id");

-- CreateIndex
CREATE INDEX "Category_Company__fk___idx" ON "Category"("Company__fk__");

-- CreateIndex
CREATE INDEX "Category_ParentCategory__fk___idx" ON "Category"("ParentCategory__fk__");

-- CreateIndex
CREATE INDEX "Category_isActive_idx" ON "Category"("isActive");

-- CreateIndex
CREATE INDEX "Category_isFeatured_idx" ON "Category"("isFeatured");

-- CreateIndex
CREATE UNIQUE INDEX "Category_slug_Company__fk___key" ON "Category"("slug", "Company__fk__");

-- CreateIndex
CREATE UNIQUE INDEX "Transaction_id_key" ON "Transaction"("id");

-- CreateIndex
CREATE UNIQUE INDEX "Transaction_gatewayTxnId_key" ON "Transaction"("gatewayTxnId");

-- CreateIndex
CREATE INDEX "Transaction_Order__fk___idx" ON "Transaction"("Order__fk__");

-- CreateIndex
CREATE INDEX "Transaction_Company__fk___idx" ON "Transaction"("Company__fk__");

-- CreateIndex
CREATE INDEX "Transaction_status_idx" ON "Transaction"("status");

-- CreateIndex
CREATE INDEX "Transaction_gatewayTxnId_idx" ON "Transaction"("gatewayTxnId");

-- CreateIndex
CREATE INDEX "Transaction_createdAt_idx" ON "Transaction"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Project_id_key" ON "Project"("id");

-- CreateIndex
CREATE UNIQUE INDEX "Scope_id_key" ON "Scope"("id");

-- CreateIndex
CREATE UNIQUE INDEX "Gst_id_key" ON "Gst"("id");

-- CreateIndex
CREATE UNIQUE INDEX "Feature_id_key" ON "Feature"("id");

-- CreateIndex
CREATE UNIQUE INDEX "Workflow_id_key" ON "Workflow"("id");

-- CreateIndex
CREATE UNIQUE INDEX "WorkflowStep_id_key" ON "WorkflowStep"("id");

-- CreateIndex
CREATE UNIQUE INDEX "ProjectEmployee_id_key" ON "ProjectEmployee"("id");

-- CreateIndex
CREATE UNIQUE INDEX "Role_id_key" ON "Role"("id");

-- CreateIndex
CREATE UNIQUE INDEX "FolderAccount_id_key" ON "FolderAccount"("id");

-- CreateIndex
CREATE UNIQUE INDEX "CustomerProfile_id_key" ON "CustomerProfile"("id");

-- CreateIndex
CREATE UNIQUE INDEX "CustomerProfile_customerCode_key" ON "CustomerProfile"("customerCode");

-- CreateIndex
CREATE UNIQUE INDEX "CustomerProfile_Account__fk___key" ON "CustomerProfile"("Account__fk__");

-- CreateIndex
CREATE INDEX "CustomerProfile_Company__fk___idx" ON "CustomerProfile"("Company__fk__");

-- CreateIndex
CREATE INDEX "CustomerProfile_status_idx" ON "CustomerProfile"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Product_id_key" ON "Product"("id");

-- CreateIndex
CREATE INDEX "Product_Company__fk___idx" ON "Product"("Company__fk__");

-- CreateIndex
CREATE UNIQUE INDEX "_AccountToRole_AB_unique" ON "_AccountToRole"("A", "B");

-- CreateIndex
CREATE INDEX "_AccountToRole_B_index" ON "_AccountToRole"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_AccountToFolderAccount_AB_unique" ON "_AccountToFolderAccount"("A", "B");

-- CreateIndex
CREATE INDEX "_AccountToFolderAccount_B_index" ON "_AccountToFolderAccount"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_AccountToProjectEmployee_AB_unique" ON "_AccountToProjectEmployee"("A", "B");

-- CreateIndex
CREATE INDEX "_AccountToProjectEmployee_B_index" ON "_AccountToProjectEmployee"("B");

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_ParentAccount__fk___fkey" FOREIGN KEY ("ParentAccount__fk__") REFERENCES "Account"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DynamicColumn" ADD CONSTRAINT "DynamicColumn_Feature__fk___fkey" FOREIGN KEY ("Feature__fk__") REFERENCES "Feature"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DynamicColumn" ADD CONSTRAINT "DynamicColumn_Company__fk___fkey" FOREIGN KEY ("Company__fk__") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DynamicColumn" ADD CONSTRAINT "DynamicColumn_Account__fk___fkey" FOREIGN KEY ("Account__fk__") REFERENCES "Account"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Company" ADD CONSTRAINT "Company_Account__fk___fkey" FOREIGN KEY ("Account__fk__") REFERENCES "Account"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompanyFeatureEntry" ADD CONSTRAINT "CompanyFeatureEntry_Feature__fk___fkey" FOREIGN KEY ("Feature__fk__") REFERENCES "Feature"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompanyFeatureEntry" ADD CONSTRAINT "CompanyFeatureEntry_Company__fk___fkey" FOREIGN KEY ("Company__fk__") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompanyFeatureEntry" ADD CONSTRAINT "CompanyFeatureEntry_Account__fk___fkey" FOREIGN KEY ("Account__fk__") REFERENCES "Account"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompanyFeatureEntry" ADD CONSTRAINT "CompanyFeatureEntry_Project__fk___fkey" FOREIGN KEY ("Project__fk__") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompanyFeatureEntryHistory" ADD CONSTRAINT "CompanyFeatureEntryHistory_CompanyFeatureEntry__fk___fkey" FOREIGN KEY ("CompanyFeatureEntry__fk__") REFERENCES "CompanyFeatureEntry"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompanyFeatureEntryHistory" ADD CONSTRAINT "CompanyFeatureEntryHistory_ChangedByAccount__fk___fkey" FOREIGN KEY ("ChangedByAccount__fk__") REFERENCES "Account"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_CustomerProfile__fk___fkey" FOREIGN KEY ("CustomerProfile__fk__") REFERENCES "CustomerProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_Company__fk___fkey" FOREIGN KEY ("Company__fk__") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_Order__fk___fkey" FOREIGN KEY ("Order__fk__") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderPayment" ADD CONSTRAINT "OrderPayment_Order__fk___fkey" FOREIGN KEY ("Order__fk__") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Category" ADD CONSTRAINT "Category_Company__fk___fkey" FOREIGN KEY ("Company__fk__") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Category" ADD CONSTRAINT "Category_ParentCategory__fk___fkey" FOREIGN KEY ("ParentCategory__fk__") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_Order__fk___fkey" FOREIGN KEY ("Order__fk__") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_Company__fk___fkey" FOREIGN KEY ("Company__fk__") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_CustomerProfile__fk___fkey" FOREIGN KEY ("CustomerProfile__fk__") REFERENCES "CustomerProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_Account__fk___fkey" FOREIGN KEY ("Account__fk__") REFERENCES "Account"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_Company__fk___fkey" FOREIGN KEY ("Company__fk__") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Scope" ADD CONSTRAINT "Scope_Company__fk___fkey" FOREIGN KEY ("Company__fk__") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Gst" ADD CONSTRAINT "Gst_Company__fk___fkey" FOREIGN KEY ("Company__fk__") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Gst" ADD CONSTRAINT "Gst_Account__fk___fkey" FOREIGN KEY ("Account__fk__") REFERENCES "Account"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Feature" ADD CONSTRAINT "Feature_Project__fk___fkey" FOREIGN KEY ("Project__fk__") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Feature" ADD CONSTRAINT "Feature_gstId_fkey" FOREIGN KEY ("gstId") REFERENCES "Gst"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Feature" ADD CONSTRAINT "Feature_Account__fk___fkey" FOREIGN KEY ("Account__fk__") REFERENCES "Account"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Feature" ADD CONSTRAINT "Feature_Scope__fk___fkey" FOREIGN KEY ("Scope__fk__") REFERENCES "Scope"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Workflow" ADD CONSTRAINT "Workflow_Project__fk___fkey" FOREIGN KEY ("Project__fk__") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Workflow" ADD CONSTRAINT "Workflow_Feature__fk___fkey" FOREIGN KEY ("Feature__fk__") REFERENCES "Feature"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Workflow" ADD CONSTRAINT "Workflow_Account__fk___fkey" FOREIGN KEY ("Account__fk__") REFERENCES "Account"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Workflow" ADD CONSTRAINT "Workflow_Company__fk___fkey" FOREIGN KEY ("Company__fk__") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkflowStep" ADD CONSTRAINT "WorkflowStep_Workflow__fk___fkey" FOREIGN KEY ("Workflow__fk__") REFERENCES "Workflow"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkflowStep" ADD CONSTRAINT "WorkflowStep_Role__fk___fkey" FOREIGN KEY ("Role__fk__") REFERENCES "Role"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectEmployee" ADD CONSTRAINT "ProjectEmployee_Project__fk___fkey" FOREIGN KEY ("Project__fk__") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Role" ADD CONSTRAINT "Role_Company__fk___fkey" FOREIGN KEY ("Company__fk__") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Role" ADD CONSTRAINT "Role_Scope__fk___fkey" FOREIGN KEY ("Scope__fk__") REFERENCES "Scope"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FolderAccount" ADD CONSTRAINT "FolderAccount_Company__fk___fkey" FOREIGN KEY ("Company__fk__") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerProfile" ADD CONSTRAINT "CustomerProfile_Company__fk___fkey" FOREIGN KEY ("Company__fk__") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerProfile" ADD CONSTRAINT "CustomerProfile_Account__fk___fkey" FOREIGN KEY ("Account__fk__") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_Company__fk___fkey" FOREIGN KEY ("Company__fk__") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_AccountToRole" ADD CONSTRAINT "_AccountToRole_A_fkey" FOREIGN KEY ("A") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_AccountToRole" ADD CONSTRAINT "_AccountToRole_B_fkey" FOREIGN KEY ("B") REFERENCES "Role"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_AccountToFolderAccount" ADD CONSTRAINT "_AccountToFolderAccount_A_fkey" FOREIGN KEY ("A") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_AccountToFolderAccount" ADD CONSTRAINT "_AccountToFolderAccount_B_fkey" FOREIGN KEY ("B") REFERENCES "FolderAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_AccountToProjectEmployee" ADD CONSTRAINT "_AccountToProjectEmployee_A_fkey" FOREIGN KEY ("A") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_AccountToProjectEmployee" ADD CONSTRAINT "_AccountToProjectEmployee_B_fkey" FOREIGN KEY ("B") REFERENCES "ProjectEmployee"("id") ON DELETE CASCADE ON UPDATE CASCADE;
