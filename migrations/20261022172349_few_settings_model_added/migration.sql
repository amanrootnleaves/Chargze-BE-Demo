-- AlterTable
ALTER TABLE "Account" ADD COLUMN     "is2FAEnabled" BOOLEAN DEFAULT false,
ADD COLUMN     "twoFactorSecret" TEXT;

-- CreateTable
CREATE TABLE "PlatformSetting" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isDeleted" BOOLEAN DEFAULT false,
    "platformName" TEXT,
    "email" TEXT,
    "logoUrl" TEXT,
    "pocName" TEXT,
    "pocMobile" TEXT,
    "supportPhone" TEXT,
    "website" TEXT,
    "addressLine1" TEXT,
    "addressLine2" TEXT,
    "city" TEXT,
    "pincode" TEXT,
    "googlePlayUrl" TEXT,
    "appStoreUrl" TEXT,
    "referralBaseUrl" TEXT,

    CONSTRAINT "PlatformSetting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaymentGatewayConfig" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isDeleted" BOOLEAN DEFAULT false,
    "gatewayName" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "apiKey" TEXT,
    "apiSecret" TEXT,
    "isLive" BOOLEAN NOT NULL DEFAULT true,
    "webhookVerified" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "PaymentGatewayConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ThirdPartyIntegration" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isDeleted" BOOLEAN DEFAULT false,
    "serviceName" TEXT NOT NULL,
    "isConnected" BOOLEAN NOT NULL DEFAULT false,
    "configData" TEXT,

    CONSTRAINT "ThirdPartyIntegration_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PlatformSetting_id_key" ON "PlatformSetting"("id");

-- CreateIndex
CREATE UNIQUE INDEX "PaymentGatewayConfig_id_key" ON "PaymentGatewayConfig"("id");

-- CreateIndex
CREATE UNIQUE INDEX "PaymentGatewayConfig_gatewayName_key" ON "PaymentGatewayConfig"("gatewayName");

-- CreateIndex
CREATE UNIQUE INDEX "ThirdPartyIntegration_id_key" ON "ThirdPartyIntegration"("id");

-- CreateIndex
CREATE UNIQUE INDEX "ThirdPartyIntegration_serviceName_key" ON "ThirdPartyIntegration"("serviceName");
