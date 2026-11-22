-- CreateEnum
CREATE TYPE "REFERRAL_LINK_TYPE" AS ENUM ('GENERAL', 'CUSTOM');

-- CreateEnum
CREATE TYPE "REFERRAL_STATUS" AS ENUM ('ACTIVE', 'INACTIVE', 'EXPIRED');

-- CreateEnum
CREATE TYPE "COMMISSION_STATUS" AS ENUM ('PENDING', 'PAID', 'CANCELLED');

-- CreateTable
CREATE TABLE "ReferralCampaign" (
    "id" TEXT NOT NULL,
    "bannerUrl" TEXT,
    "linkType" "REFERRAL_LINK_TYPE" NOT NULL DEFAULT 'GENERAL',
    "referralLink" TEXT NOT NULL,
    "referrerRewardAmount" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "refereeRewardAmount" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "minFirstChargeAmount" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "expiryDate" TIMESTAMP(3),
    "customMessage" TEXT,
    "termsAndConditions" TEXT[],
    "isShortened" BOOLEAN NOT NULL DEFAULT true,
    "status" "REFERRAL_STATUS" NOT NULL DEFAULT 'ACTIVE',
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReferralCampaign_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReferralShare" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "referrerId" TEXT NOT NULL,
    "channelsUsed" TEXT[],
    "totalClicks" INTEGER NOT NULL DEFAULT 0,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReferralShare_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReferralClickLog" (
    "id" TEXT NOT NULL,
    "referralShareId" TEXT NOT NULL,
    "deviceInfo" TEXT,
    "location" TEXT,
    "channel" TEXT,
    "source" TEXT,
    "ipAddress" TEXT,
    "clickedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReferralClickLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReferralUsage" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "referralShareId" TEXT,
    "referrerId" TEXT NOT NULL,
    "refereeId" TEXT NOT NULL,
    "signupStatus" TEXT NOT NULL DEFAULT 'Pending',
    "firstChargeDate" TIMESTAMP(3),
    "amountSpent" DOUBLE PRECISION,
    "discountGiven" DOUBLE PRECISION,
    "conversionStatus" TEXT NOT NULL DEFAULT 'Pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReferralUsage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReferralCommission" (
    "id" TEXT NOT NULL,
    "usageId" TEXT NOT NULL,
    "referrerId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "status" "COMMISSION_STATUS" NOT NULL DEFAULT 'PENDING',
    "earningDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "payoutDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReferralCommission_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ReferralCampaign_referralLink_key" ON "ReferralCampaign"("referralLink");

-- CreateIndex
CREATE UNIQUE INDEX "ReferralUsage_refereeId_key" ON "ReferralUsage"("refereeId");

-- CreateIndex
CREATE UNIQUE INDEX "ReferralCommission_usageId_key" ON "ReferralCommission"("usageId");

-- AddForeignKey
ALTER TABLE "ReferralShare" ADD CONSTRAINT "ReferralShare_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "ReferralCampaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReferralShare" ADD CONSTRAINT "ReferralShare_referrerId_fkey" FOREIGN KEY ("referrerId") REFERENCES "CustomerProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReferralClickLog" ADD CONSTRAINT "ReferralClickLog_referralShareId_fkey" FOREIGN KEY ("referralShareId") REFERENCES "ReferralShare"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReferralUsage" ADD CONSTRAINT "ReferralUsage_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "ReferralCampaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReferralUsage" ADD CONSTRAINT "ReferralUsage_referralShareId_fkey" FOREIGN KEY ("referralShareId") REFERENCES "ReferralShare"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReferralUsage" ADD CONSTRAINT "ReferralUsage_referrerId_fkey" FOREIGN KEY ("referrerId") REFERENCES "CustomerProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReferralUsage" ADD CONSTRAINT "ReferralUsage_refereeId_fkey" FOREIGN KEY ("refereeId") REFERENCES "CustomerProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReferralCommission" ADD CONSTRAINT "ReferralCommission_usageId_fkey" FOREIGN KEY ("usageId") REFERENCES "ReferralUsage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReferralCommission" ADD CONSTRAINT "ReferralCommission_referrerId_fkey" FOREIGN KEY ("referrerId") REFERENCES "CustomerProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
