import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const campaignId = "9a0f987a-aaa9-4faa-9caa-7185a4c764b7";

  console.log(`Checking campaign ${campaignId}...`);
  const campaign = await prisma.referralCampaign.findUnique({
    where: { id: campaignId },
  });

  if (!campaign) {
    throw new Error(
      `Campaign with ID ${campaignId} not found. Please verify the ID.`
    );
  }

  // 1. Create Referrer Customer
  const referrerAccount = await prisma.account.create({
    data: {
      fullName: "Rahul Singh",
      phoneNumber: "+919711078976",
      email: `rahul.referrer.${Date.now()}@chargze.com`,
      accountType: "CUSTOMER",
      isBlocked: false,
      isDeleted: false,
    },
  });

  const referrerProfile = await prisma.customerProfile.create({
    data: {
      customerCode: `CUST-${Math.floor(100000 + Math.random() * 900000)}`,
      Account__fk__: referrerAccount.id,
      status: "ACTIVE",
      isDeleted: false,
    },
  });

  // 2. Create Referee Customers (Friends who joined)
  const referee1Account = await prisma.account.create({
    data: {
      fullName: "Ram Neeraj Sharma",
      phoneNumber: "+919811223344",
      email: `ram.referee.${Date.now()}@chargze.com`,
      accountType: "CUSTOMER",
      isBlocked: false,
      isDeleted: false,
    },
  });

  const referee1Profile = await prisma.customerProfile.create({
    data: {
      customerCode: `CUST-${Math.floor(100000 + Math.random() * 900000)}`,
      Account__fk__: referee1Account.id,
      status: "ACTIVE",
      isDeleted: false,
    },
  });

  const referee2Account = await prisma.account.create({
    data: {
      fullName: "Mukul Pandey",
      phoneNumber: "+919955443322",
      email: `mukul.referee.${Date.now()}@chargze.com`,
      accountType: "CUSTOMER",
      isBlocked: false,
      isDeleted: false,
    },
  });

  const referee2Profile = await prisma.customerProfile.create({
    data: {
      customerCode: `CUST-${Math.floor(100000 + Math.random() * 900000)}`,
      Account__fk__: referee2Account.id,
      status: "ACTIVE",
      isDeleted: false,
    },
  });

  // 3. Create ReferralShare for Referrer
  const referralShare = await prisma.referralShare.create({
    data: {
      campaignId: campaign.id,
      referrerId: referrerProfile.id,
      channelsUsed: ["WHATSAPP", "LINKEDIN", "FACEBOOK", "TWITTER"],
      totalClicks: 6,
      isDeleted: false,
    },
  });

  // 4. Create ReferralClickLogs
  await prisma.referralClickLog.createMany({
    data: [
      {
        referralShareId: referralShare.id,
        channel: "WHATSAPP",
        deviceInfo: "Chrome on Android",
        ipAddress: "192.168.1.1",
      },
      {
        referralShareId: referralShare.id,
        channel: "LINKEDIN",
        deviceInfo: "Safari on iOS",
        ipAddress: "192.168.1.2",
      },
    ],
  });

  // 5. Create ReferralUsage 1 (Converted with First Charge & Commission)
  const usage1 = await prisma.referralUsage.create({
    data: {
      campaignId: campaign.id,
      referralShareId: referralShare.id,
      referrerId: referrerProfile.id,
      refereeId: referee1Profile.id,
      signupStatus: "Converted",
      conversionStatus: "Converted",
      amountSpent: 480.0,
      firstChargeDate: new Date(),
    },
  });

  await prisma.referralCommission.create({
    data: {
      usageId: usage1.id,
      referrerId: referrerProfile.id,
      amount: 180.0,
      status: "PENDING",
      earningDate: new Date(),
    },
  });

  // 6. Create ReferralUsage 2 (Pending - Signed up but no charge yet)
  await prisma.referralUsage.create({
    data: {
      campaignId: campaign.id,
      referralShareId: referralShare.id,
      referrerId: referrerProfile.id,
      refereeId: referee2Profile.id,
      signupStatus: "Pending",
      conversionStatus: "Pending",
      amountSpent: null,
      firstChargeDate: null,
    },
  });

  console.log("Mock seed data created successfully for Referral testing.");
}

main()
  .catch((e) => {
    console.error("Error running seed script:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });