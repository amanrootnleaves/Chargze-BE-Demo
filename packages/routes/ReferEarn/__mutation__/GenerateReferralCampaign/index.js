export default async (__, { input }, Context) => {
  const _functionName =
    "Routes -> Referral -> Mutation -> CreateReferralCampaign";

  try {
    const accountId = Context?.Session?.user?.id;
    if (!accountId) {
      throw new Error("REQUIRE__LOGIN");
    }

    if (Context && Context.isContext) {
      await Context.Debug(
        {
          message: "Creating Referral Campaign.",
          input,
        },
        _functionName,
      );
    }

    // 1. Normalize Input
    const normalizedInput = {
      ...input,
      bannerUrl: input.bannerUrl?.trim() || null,
      referralLink: input.referralLink?.trim() || "https://chargze.com/refer&earn",
      customMessage: input.customMessage?.trim() || null,
      termsAndConditions:
        input.termsAndConditions?.map((term) => term.trim()).filter(Boolean) || [],
      referrerRewardAmount:
        typeof input.referrerRewardAmount === "number"
          ? input.referrerRewardAmount
          : Number(input.referrerRewardAmount) || 0,
      refereeRewardAmount:
        typeof input.refereeRewardAmount === "number"
          ? input.refereeRewardAmount
          : Number(input.refereeRewardAmount) || 0,
      minFirstChargeAmount:
        typeof input.minFirstChargeAmount === "number"
          ? input.minFirstChargeAmount
          : Number(input.minFirstChargeAmount) || 0,
      expiryDate: input.expiryDate ? new Date(input.expiryDate) : null,
      isShortened: input.isShortened ?? true,
    };

    // 2. Validations
    if (
      normalizedInput.referrerRewardAmount < 0 ||
      normalizedInput.refereeRewardAmount < 0
    ) {
      throw new Error("INVALID_REWARD_AMOUNT");
    }

    if (normalizedInput.minFirstChargeAmount < 0) {
      throw new Error("INVALID_MIN_CHARGE_AMOUNT");
    }

    if (normalizedInput.expiryDate && normalizedInput.expiryDate < new Date()) {
      throw new Error("EXPIRY_DATE_CANNOT_BE_IN_THE_PAST");
    }

    // 3. Transaction Execution
    const _campaign = await Context.DataBase.$transaction(async (tx) => {
      // If GENERAL campaign, deactivate existing active general campaigns
      if (normalizedInput.linkType === "GENERAL") {
        await tx.referralCampaign.updateMany({
          where: {
            linkType: "GENERAL",
            status: "ACTIVE",
            isDeleted: false,
          },
          data: { status: "INACTIVE" },
        });
      }

      // Duplicate Check (Honoring Soft-Delete)
      const existingLink = await tx.referralCampaign.findFirst({
        where: {
          referralLink: normalizedInput.referralLink,
          isDeleted: false,
        },
        select: { id: true },
      });

      if (existingLink) {
        throw new Error("REFERRAL_LINK_ALREADY_EXISTS");
      }

      // Create Campaign Entry linked to the authenticated account
      return await tx.referralCampaign.create({
        data: {
          bannerUrl: normalizedInput.bannerUrl,
          linkType: normalizedInput.linkType,
          referralLink: normalizedInput.referralLink,
          referrerRewardAmount: normalizedInput.referrerRewardAmount,
          refereeRewardAmount: normalizedInput.refereeRewardAmount,
          minFirstChargeAmount: normalizedInput.minFirstChargeAmount,
          expiryDate: normalizedInput.expiryDate,
          customMessage: normalizedInput.customMessage,
          termsAndConditions: normalizedInput.termsAndConditions,
          isShortened: normalizedInput.isShortened,
          status: "ACTIVE",
          isDeleted: false,
          Account__fk__: accountId,
        },
      });
    });

    if (Context && Context.isContext) {
      await Context.Debug(
        {
          message: "Referral Campaign created successfully.",
          campaignId: _campaign.id,
        },
        _functionName,
      );
    }

    // 4. Output Mapping
    return {
      ..._campaign,
      accountId: _campaign.Account__fk__,
    };
  } catch (error) {
    if (Context && Context.isContext) {
      await Context.Debug(
        {
          message: "Error creating referral campaign.",
          input,
          error: error.message,
        },
        _functionName,
      );
    }
    throw error;
  }
};