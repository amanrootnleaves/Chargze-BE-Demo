import { getCreatedAtFilter } from "../../../../dyna_modules/Utils/dateFilter";

export default async (__, { filter = {} }, Context) => {
  const _functionName = "Routes -> Referral -> Query -> GetReferralShares";

  try {
    if (Context && Context.isContext) {
      await Context.Debug(
        { message: "Fetching referral shares list.", filter },
        _functionName
      );
    }

    const {
      search,
      tab = "ALL",
      status,
      dateFilter,
      page = 1,
      limit = 10,
    } = filter;

    const skip = (Math.max(1, page) - 1) * Math.max(1, limit);
    const take = Math.max(1, limit);
    const createdAtFilter = getCreatedAtFilter(dateFilter);
    const searchPattern = search && search.trim() !== "" ? search.trim() : null;

    let totalCount = 0;
    let nodes = [];

    // =========================================================================
    // CASE 1: USED & COMMISSION TABS (Row Granularity = ReferralUsage)
    // =========================================================================
    if (tab === "USED" || tab === "COMMISSION") {
      const usageWhere = {
        campaign: {
          isDeleted: false,
          ...(status ? { status } : {}),
        },
        OR: [{ referralShareId: null }, { referralShare: { isDeleted: false } }],
      };

      if (tab === "COMMISSION") {
        usageWhere.commission = { isNot: null };
      }

      if (createdAtFilter) {
        usageWhere.createdAt = createdAtFilter;
      }

      if (searchPattern) {
        usageWhere.AND = [
          {
            OR: [
              {
                referrer: {
                  customerCode: { contains: searchPattern, mode: "insensitive" },
                },
              },
              {
                referrer: {
                  Account: {
                    fullName: { contains: searchPattern, mode: "insensitive" },
                  },
                },
              },
              {
                referrer: {
                  Account: {
                    phoneNumber: { contains: searchPattern, mode: "insensitive" },
                  },
                },
              },
              {
                referee: {
                  customerCode: { contains: searchPattern, mode: "insensitive" },
                },
              },
              {
                referee: {
                  Account: {
                    fullName: { contains: searchPattern, mode: "insensitive" },
                  },
                },
              },
              {
                referee: {
                  Account: {
                    phoneNumber: { contains: searchPattern, mode: "insensitive" },
                  },
                },
              },
              {
                campaign: {
                  referralLink: { contains: searchPattern, mode: "insensitive" },
                },
              },
            ],
          },
        ];
      }

      const [count, usages] = await Promise.all([
        Context.DataBase.referralUsage.count({ where: usageWhere }),
        Context.DataBase.referralUsage.findMany({
          where: usageWhere,
          skip,
          take,
          orderBy: { createdAt: "desc" },
          include: {
            campaign: true,
            referralShare: {
              include: {
                _count: {
                  select: { usages: true },
                },
              },
            },
            referrer: {
              include: {
                Account: true,
              },
            },
            referee: {
              include: {
                Account: true,
              },
            },
            commission: true,
          },
        }),
      ]);

      totalCount = count;
      nodes = usages.map((usage) => ({
        id: usage.id,
        referralLink: usage.campaign?.referralLink || "",
        customerId: usage.referrer?.id || null,
        customerCode: usage.referrer?.customerCode || null,
        sharedByName: usage.referrer?.Account?.fullName || "N/A",
        mobile:
          tab === "USED"
            ? usage.referee?.Account?.phoneNumber ||
              usage.referrer?.Account?.phoneNumber ||
              "N/A"
            : usage.referrer?.Account?.phoneNumber || "N/A",
        sharedWithCount: usage.referralShare?.totalClicks || 0,
        sharedChannels: usage.referralShare?.channelsUsed || [],
        usedByName: usage.referee?.Account?.fullName || "N/A",
        usedOn: usage.createdAt ? usage.createdAt.toISOString() : null,
        usedByCount: usage.referralShare?._count?.usages || 1,
        firstChargeAmount: usage.amountSpent ?? null,
        firstChargeDate: usage.firstChargeDate
          ? usage.firstChargeDate.toISOString()
          : null,
        totalClicks: usage.referralShare?.totalClicks || 0,
        commissionAmount: usage.commission?.amount || 0,
        status: usage.campaign?.status || "ACTIVE",
        signupStatus: usage.signupStatus || "Pending",
        commissionStatus: usage.commission?.status || null,
        earningDate: usage.commission?.earningDate
          ? usage.commission.earningDate.toISOString()
          : null,
        payoutDate: usage.commission?.payoutDate
          ? usage.commission.payoutDate.toISOString()
          : null,
        createdAt: usage.createdAt ? usage.createdAt.toISOString() : null,
        updatedAt: usage.updatedAt ? usage.updatedAt.toISOString() : null,
      }));
    } else {
      // =========================================================================
      // CASE 2: ALL & SHARED TABS (Row Granularity = ReferralShare)
      // =========================================================================
      const shareWhere = {
        isDeleted: false,
      };

      if (status) {
        shareWhere.campaign = { status };
      }

      if (tab === "SHARED") {
        shareWhere.channelsUsed = { isEmpty: false };
      }

      if (createdAtFilter) {
        shareWhere.createdAt = createdAtFilter;
      }

      if (searchPattern) {
        shareWhere.OR = [
          {
            referrer: {
              customerCode: { contains: searchPattern, mode: "insensitive" },
            },
          },
          {
            referrer: {
              Account: {
                fullName: { contains: searchPattern, mode: "insensitive" },
              },
            },
          },
          {
            referrer: {
              Account: {
                phoneNumber: { contains: searchPattern, mode: "insensitive" },
              },
            },
          },
          {
            campaign: {
              referralLink: { contains: searchPattern, mode: "insensitive" },
            },
          },
        ];
      }

      const [count, shares] = await Promise.all([
        Context.DataBase.referralShare.count({ where: shareWhere }),
        Context.DataBase.referralShare.findMany({
          where: shareWhere,
          skip,
          take,
          orderBy: { createdAt: "desc" },
          include: {
            campaign: true,
            referrer: {
              include: {
                Account: true,
              },
            },
            usages: {
              include: {
                referee: {
                  include: {
                    Account: true,
                  },
                },
                commission: true,
              },
            },
          },
        }),
      ]);

      totalCount = count;
      nodes = shares.map((share) => {
        const latestUsage = share.usages?.[0] || null;
        const totalCommission = (share.usages || []).reduce(
          (acc, usage) => acc + (usage.commission?.amount || 0),
          0
        );

        return {
          id: share.id,
          referralLink: share.campaign?.referralLink || "",
          customerId: share.referrer?.id || null,
          customerCode: share.referrer?.customerCode || null,
          sharedByName: share.referrer?.Account?.fullName || "N/A",
          mobile: share.referrer?.Account?.phoneNumber || "N/A",
          sharedWithCount: share.totalClicks || 0,
          sharedChannels: share.channelsUsed || [],
          usedByName: latestUsage?.referee?.Account?.fullName || null,
          usedOn: latestUsage?.createdAt
            ? latestUsage.createdAt.toISOString()
            : null,
          usedByCount: share.usages?.length || 0,
          firstChargeAmount: latestUsage?.amountSpent ?? null,
          firstChargeDate: latestUsage?.firstChargeDate
            ? latestUsage.firstChargeDate.toISOString()
            : null,
          totalClicks: share.totalClicks || 0,
          commissionAmount: totalCommission,
          status: share.campaign?.status || "ACTIVE",
          signupStatus: latestUsage?.signupStatus || "Pending",
          commissionStatus: latestUsage?.commission?.status || null,
          earningDate: latestUsage?.commission?.earningDate
            ? latestUsage.commission.earningDate.toISOString()
            : null,
          payoutDate: latestUsage?.commission?.payoutDate
            ? latestUsage.commission.payoutDate.toISOString()
            : null,
          createdAt: share.createdAt ? share.createdAt.toISOString() : null,
          updatedAt: share.updatedAt ? share.updatedAt.toISOString() : null,
        };
      });
    }

    if (Context && Context.isContext) {
      await Context.Debug(
        {
          message: "Referral shares fetched successfully.",
          tab,
          totalCount,
          count: nodes.length,
        },
        _functionName
      );
    }

    return {
      nodes,
      totalCount,
      totalPages: Math.ceil(totalCount / take) || 1,
      currentPage: page,
    };
  } catch (error) {
    if (Context && Context.isContext) {
      await Context.Debug(
        {
          message: "Unable to fetch Referral Shares.",
          filter,
          error: error.message,
        },
        _functionName
      );
    }
    throw error;
  }
};