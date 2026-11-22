export default async (parent, { filter }, Context) => {
  const _functionName = "Routes -> PromoCode -> Query -> GetPromoCodes";

  try {
    if (Context && Context.isContext) {
      await Context.Debug(
        { message: "Fetching promo codes list.", filter },
        _functionName
      );
    }

    const { status, search, page = 1, limit = 10 } = filter || {};

    const queryPage = Number(page) || 1;
    const queryLimit = Number(limit) || 10;
    const skip = (queryPage - 1) * queryLimit;

    // Build dynamic Prisma where clause
    const where = {};

    // 1. Filter by status if provided (Active, Inactive, Expired tabs)
    if (status) {
      where.status = status;
    }

    // 2. Search filter by promo code text
    if (search && search.trim()) {
      where.code = {
        contains: search.trim().toUpperCase(),
        mode: 'insensitive',
      };
    }

    // Fetch matching promo codes and total count concurrently for performance
    const [promoCodes, totalCount] = await Promise.all([
      Context.DataBase.promoCode.findMany({
        where,
        skip,
        take: queryLimit,
        orderBy: { createdAt: 'desc' },
      }),
      Context.DataBase.promoCode.count({ where }),
    ]);

    // Format dates to ISO strings for GraphQL schema compatibility
    const formattedPromoCodes = promoCodes.map((promo) => ({
      id: promo.id,
      code: promo.code,
      banner: promo.banner,
      discountType: promo.discountType,
      discountScope: promo.discountScope,
      discountValue: promo.discountValue,
      maxDiscountValue: promo.maxDiscountValue,
      minTransactionValue: promo.minTransactionValue,
      usageLimit: promo.usageLimit,
      validFrom: promo.validFrom ? new Date(promo.validFrom).toISOString() : null,
      validUntil: promo.validUntil ? new Date(promo.validUntil).toISOString() : null,
      status: promo.status,
      createdAt: promo.createdAt ? new Date(promo.createdAt).toISOString() : null,
      updatedAt: promo.updatedAt ? new Date(promo.updatedAt).toISOString() : null,
    }));

    return {
      success: true,
      message: "Promo codes fetched successfully",
      promoCodes: formattedPromoCodes,
      totalCount,
    };

  } catch (error) {
    if (Context && Context.isContext) {
      await Context.Debug(
        { message: "Failed to fetch promo codes.", filter, error },
        _functionName
      );
    }
    throw error;
  }
};
