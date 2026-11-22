-- AlterTable
ALTER TABLE "ReferralCampaign" ADD COLUMN     "Account__fk__" TEXT;

-- AddForeignKey
ALTER TABLE "ReferralCampaign" ADD CONSTRAINT "ReferralCampaign_Account__fk___fkey" FOREIGN KEY ("Account__fk__") REFERENCES "Account"("id") ON DELETE SET NULL ON UPDATE CASCADE;
