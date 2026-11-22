export default async (__, { filter }, Context) => {
  const _functionName = "Routes -> Referral -> Query -> GetReferralDetails";

  try {
    if (Context && Context.isContext) {
      await Context.Debug(
        { message: "Fetching referral details.", filter },
        _functionName
      );
    }

    const {
      referralShareId,
      clicksPagination = {},
      signupsPagination = {},
      conversionsPagination = {},
      activityLogsPagination = {},
    } = filter || {};

    if (!referralShareId || referralShareId.trim() === "") {
      throw new Error("REFERRAL_SHARE_ID_IS_REQUIRED");
    }

    const shareId = referralShareId.trim();

    // Helper for section-level pagination (Default 5 rows as per UI)
    const getPagination = (pag) => {
      const page = Math.max(1, pag?.page || 1);
      const limit = Math.max(1, pag?.limit || 5);
      const skip = (page - 1) * limit;
      return { page, limit, skip, take: limit };
    };

    const clicksPag = getPagination(clicksPagination);
    const signupsPag = getPagination(signupsPagination);
    const conversionsPag = getPagination(conversionsPagination);
    const logsPag = getPagination(activityLogsPagination);

    // 1. Fetch Base ReferralShare with Referrer, RFID, and Campaign Info
    const share = await Context.DataBase.referralShare.findFirst({
      where: {
        id: shareId,
        isDeleted: false,
      },
      include: {
        campaign: {
          include: {
            Account: true,
          },
        },
        referrer: {
          include: {
            Account: true,
            RfidTags: {
              where: { isDeleted: false },
              select: { id: true, isBlocked: true },
            },
          },
        },
      },
    });

    if (!share) {
      throw new Error("REFERRAL_SHARE_NOT_FOUND");
    }

    // 2. Concurrent Queries for All Sections & Aggregations
    const [
      totalClicksCount,
      clicksNodes,
      channelGroups,
      allUsagesForMetrics,
      paginatedSignups,
      paginatedConversions,
    ] = await Promise.all([
      // Clicks Count
      Context.DataBase.referralClickLog.count({
        where: { referralShareId: shareId },
      }),
      // Paginated Clicks
      Context.DataBase.referralClickLog.findMany({
        where: { referralShareId: shareId },
        skip: clicksPag.skip,
        take: clicksPag.take,
        orderBy: { clickedAt: "desc" },
      }),
      // Channel Breakdown for Share Performance
      Context.DataBase.referralClickLog.groupBy({
        by: ["channel"],
        where: { referralShareId: shareId },
        _count: { _all: true },
      }),
      // All Usages for Summary KPIs, Commissions & Activity Log
      Context.DataBase.referralUsage.findMany({
        where: { referralShareId: shareId },
        orderBy: { createdAt: "desc" },
        include: {
          referee: {
            include: { Account: true },
          },
          commission: true,
        },
      }),
      // Paginated Signed Up Users
      Context.DataBase.referralUsage.findMany({
        where: { referralShareId: shareId },
        skip: signupsPag.skip,
        take: signupsPag.take,
        orderBy: { createdAt: "desc" },
        include: {
          referee: {
            include: { Account: true },
          },
        },
      }),
      // Paginated Converted Users (Completed First Charge)
      Context.DataBase.referralUsage.findMany({
        where: {
          referralShareId: shareId,
          OR: [
            { conversionStatus: { in: ["Converted", "Completed"] } },
            { firstChargeDate: { not: null } },
          ],
        },
        skip: conversionsPag.skip,
        take: conversionsPag.take,
        orderBy: { firstChargeDate: "desc" },
        include: {
          referee: {
            include: { Account: true },
          },
        },
      }),
    ]);

    // =========================================================================
    // Calculations & Section Mappings
    // =========================================================================

    const effectiveTotalClicks = Math.max(
      share.totalClicks || 0,
      totalClicksCount
    );
    const totalSignupsCount = allUsagesForMetrics.length;

    const pendingVerificationCount = allUsagesForMetrics.filter(
      (u) => u.signupStatus?.toLowerCase() === "pending"
    ).length;
    const verifiedUsersCount = totalSignupsCount - pendingVerificationCount;

    const convertedUsages = allUsagesForMetrics.filter(
      (u) =>
        ["converted", "completed"].includes(
          u.conversionStatus?.toLowerCase()
        ) || u.firstChargeDate !== null
    );
    const totalConversionsCount = convertedUsages.length;

    const totalRevenueGenerated = convertedUsages.reduce(
      (sum, u) => sum + (u.amountSpent || 0),
      0
    );
    const avgTransactionValue =
      totalConversionsCount > 0
        ? Number((totalRevenueGenerated / totalConversionsCount).toFixed(2))
        : 0;

    // Commissions Breakdown
    let totalCommission = 0;
    let paidCommission = 0;
    let pendingCommission = 0;
    let cancelledCommission = 0;
    let latestEarningDate = null;
    let latestPayoutDate = null;

    for (const usage of allUsagesForMetrics) {
      if (usage.commission) {
        const amt = usage.commission.amount || 0;
        totalCommission += amt;

        if (usage.commission.status === "PAID") {
          paidCommission += amt;
        } else if (usage.commission.status === "PENDING") {
          pendingCommission += amt;
        } else if (usage.commission.status === "CANCELLED") {
          cancelledCommission += amt;
        }

        if (
          usage.commission.earningDate &&
          (!latestEarningDate ||
            usage.commission.earningDate > latestEarningDate)
        ) {
          latestEarningDate = usage.commission.earningDate;
        }
        if (
          usage.commission.payoutDate &&
          (!latestPayoutDate || usage.commission.payoutDate > latestPayoutDate)
        ) {
          latestPayoutDate = usage.commission.payoutDate;
        }
      }
    }

    // Section 1: Referrer Information
    const isRfidLinked = (share.referrer?.RfidTags?.length || 0) > 0;
    const referrerInfo = {
      customerId: share.referrer?.id || "",
      customerCode: share.referrer?.customerCode || "N/A",
      customerName: share.referrer?.Account?.fullName || "N/A",
      mobile: share.referrer?.Account?.phoneNumber || "N/A",
      email: share.referrer?.Account?.email || "N/A",
      joinedOn: share.referrer?.createdAt
        ? share.referrer.createdAt.toISOString()
        : share.createdAt.toISOString(),
      totalReferrals: totalSignupsCount,
      totalLinkClicks: effectiveTotalClicks,
      totalSignups: totalSignupsCount,
      totalCommissionEarned: totalCommission,
      referralStatus: isRfidLinked ? "Linked RFID" : "Not Linked",
      isRfidLinked,
    };

    // Section 2: Shared Link Details & Share Performance
    const totalLoggedChannelClicks = channelGroups.reduce(
      (sum, g) => sum + (g._count?._all || 0),
      0
    );
    const sharePerformance = channelGroups.map((g) => {
      const count = g._count?._all || 0;
      const percentage =
        totalLoggedChannelClicks > 0
          ? Number(((count / totalLoggedChannelClicks) * 100).toFixed(1))
          : 0;
      return {
        channel: g.channel || "Direct",
        shares: count,
        percentage,
      };
    });

    const latestClickAt = clicksNodes[0]?.clickedAt || share.updatedAt;
    const sharedLinkDetails = {
      referralLink: share.campaign?.referralLink || "",
      shareViaChannels: share.channelsUsed || [],
      totalShares: effectiveTotalClicks,
      lastSharedOn: latestClickAt ? latestClickAt.toISOString() : null,
      sharePerformance,
    };

    // Section 3: Link Clicks
    const linkClicks = {
      totalClicks: effectiveTotalClicks,
      signupLinkCount: totalSignupsCount,
      usedByCount: totalConversionsCount,
      nodes: clicksNodes.map((click) => ({
        id: click.id,
        clickedOn: click.clickedAt ? click.clickedAt.toISOString() : "",
        deviceInfo: click.deviceInfo || "Unknown Device",
        location: click.location || "N/A",
        channel: click.channel || "Direct",
        source: click.source || "Direct",
        ipAddress: click.ipAddress || "N/A",
      })),
      totalCount: totalClicksCount,
      totalPages: Math.ceil(totalClicksCount / clicksPag.take) || 1,
      currentPage: clicksPag.page,
    };

    // Section 4: Signed Up Users
    const signupConversionRate =
      effectiveTotalClicks > 0
        ? Number(((totalSignupsCount / effectiveTotalClicks) * 100).toFixed(1))
        : 0;

    const signedUpUsers = {
      totalSignups: totalSignupsCount,
      pendingVerification: pendingVerificationCount,
      verifiedUsers: verifiedUsersCount,
      signupConversionRate,
      nodes: paginatedSignups.map((u) => ({
        id: u.id,
        usedByName: u.referee?.Account?.fullName || "N/A",
        mobile: u.referee?.Account?.phoneNumber || "N/A",
        email: u.referee?.Account?.email || "N/A",
        signupDate: u.createdAt ? u.createdAt.toISOString() : "",
        signupStatus:
          u.signupStatus?.toLowerCase() === "pending" ? "Pending" : "Verified",
      })),
      totalCount: totalSignupsCount,
      totalPages: Math.ceil(totalSignupsCount / signupsPag.take) || 1,
      currentPage: signupsPag.page,
    };

    // Section 5: Converted Users — Completed First Charge
    const convertedUsers = {
      totalConversions: totalConversionsCount,
      totalRevenueGenerated,
      avgTransactionValue,
      nodes: paginatedConversions.map((u) => ({
        id: u.id,
        usedByName: u.referee?.Account?.fullName || "N/A",
        mobile: u.referee?.Account?.phoneNumber || "N/A",
        firstChargeDate: u.firstChargeDate
          ? u.firstChargeDate.toISOString()
          : null,
        amountSpent: u.amountSpent || 0,
        discountGiven:
          u.discountGiven ?? (share.campaign?.refereeRewardAmount || 0),
        status: "Completed",
      })),
      totalCount: totalConversionsCount,
      totalPages: Math.ceil(totalConversionsCount / conversionsPag.take) || 1,
      currentPage: conversionsPag.page,
    };

    // Section 6: Commission Details
    const rewardPerReferral = share.campaign?.referrerRewardAmount || 0;
    const payoutStatus =
      pendingCommission > 0
        ? "Pending"
        : paidCommission > 0
        ? "Paid"
        : "No Payouts";

    const commissionDetails = {
      totalCommission,
      paidCommission,
      pendingCommission,
      cancelledCommission,
      commissionPerReferral: rewardPerReferral,
      commissionPerConversion: rewardPerReferral,
      lastCommissionDate: latestEarningDate
        ? latestEarningDate.toISOString()
        : null,
      nextPayoutDate: latestPayoutDate ? latestPayoutDate.toISOString() : null,
      payoutStatus,
    };

    // Section 7: Program Information
    const programInformation = {
      campaignId: share.campaign?.id || "",
      programName: "Refer & Earn",
      programStartDate: share.campaign?.createdAt
        ? share.campaign.createdAt.toISOString()
        : "",
      programEndDate: share.campaign?.expiryDate
        ? share.campaign.expiryDate.toISOString()
        : "No End Date",
      programStatus: share.campaign?.status || "ACTIVE",
      termsAndConditions: share.campaign?.termsAndConditions || [],
      lastUpdated: share.campaign?.updatedAt
        ? share.campaign.updatedAt.toISOString()
        : "",
      updatedBy:
        share.campaign?.Account?.fullName ||
        share.campaign?.Account?.displayName ||
        "Admin",
    };

    // Section 8: Dynamic Activity Logs
    const rawActivityEvents = [];

    rawActivityEvents.push({
      id: `share-${share.id}`,
      eventType: "LINK_SHARED",
      title: "Referral Link Shared",
      description: `${referrerInfo.customerName} shared the referral link via ${(
        share.channelsUsed || []
      ).join(", ") || "Direct"}.`,
      timestamp: share.createdAt,
    });

    for (const u of allUsagesForMetrics) {
      const refereeName = u.referee?.Account?.fullName || "A user";
      rawActivityEvents.push({
        id: `signup-${u.id}`,
        eventType: "USER_SIGNED_UP",
        title: "New Referee Signup",
        description: `${refereeName} signed up using the referral link.`,
        timestamp: u.createdAt,
      });

      if (u.firstChargeDate) {
        rawActivityEvents.push({
          id: `charge-${u.id}`,
          eventType: "FIRST_CHARGE_COMPLETED",
          title: "First Charge Completed",
          description: `${refereeName} completed their first charge of ₹${
            u.amountSpent || 0
          }.`,
          timestamp: u.firstChargeDate,
        });
      }

      if (u.commission) {
        rawActivityEvents.push({
          id: `commission-${u.commission.id}`,
          eventType: "COMMISSION_GENERATED",
          title: `Commission ${u.commission.status}`,
          description: `Commission of ₹${u.commission.amount} (${u.commission.status}) for referring ${refereeName}.`,
          timestamp: u.commission.earningDate || u.commission.createdAt,
        });
      }
    }

    rawActivityEvents.sort(
      (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
    );

    const totalActivityLogs = rawActivityEvents.length;
    const paginatedActivityLogs = rawActivityEvents
      .slice(logsPag.skip, logsPag.skip + logsPag.take)
      .map((ev) => ({
        ...ev,
        timestamp: ev.timestamp ? new Date(ev.timestamp).toISOString() : "",
      }));

    const activityLogs = {
      nodes: paginatedActivityLogs,
      totalCount: totalActivityLogs,
      totalPages: Math.ceil(totalActivityLogs / logsPag.take) || 1,
      currentPage: logsPag.page,
    };

    if (Context && Context.isContext) {
      await Context.Debug(
        {
          message: "Referral details fetched successfully.",
          referralShareId: shareId,
        },
        _functionName
      );
    }

    return {
      id: share.id,
      referrerInfo,
      sharedLinkDetails,
      linkClicks,
      signedUpUsers,
      convertedUsers,
      commissionDetails,
      programInformation,
      activityLogs,
    };
  } catch (error) {
    if (Context && Context.isContext) {
      await Context.Debug(
        {
          message: "Unable to fetch Referral Details.",
          filter,
          error: error.message,
        },
        _functionName
      );
    }
    throw error;
  }
};