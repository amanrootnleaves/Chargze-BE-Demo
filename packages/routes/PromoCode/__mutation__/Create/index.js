export default async (parent, { input }, Context) => {
  const _functionName = "Routes -> PromoCode -> Mutation -> CreatePromoCode";

  try {
    if (Context && Context.isContext) {
      await Context.Debug(
        { 
          message: "Creating new promo code.", 
          input: { ...input, banner: input.banner ? "[BASE64_STRING]" : null } 
        },
        _functionName
      );
    }

    const {
      code,
      banner,
      discountType,
      discountScope,
      discountValue,
      maxDiscountValue,
      minTransactionValue,
      usageLimit,
      validFrom,
      validUntil,
      status,
    } = input;

    if (!code || !code.trim()) {
      throw new Error("PROMO_CODE_REQUIRED");
    }

    if (typeof usageLimit === "number" && usageLimit < 0) {
      throw new Error("INVALID_USAGE_LIMIT");
    }

    const formattedCode = code.trim().toUpperCase();

    // 1. Check if promo code already exists
    const existingPromo = await Context.DataBase.promoCode.findUnique({
      where: { code: formattedCode },
    });

    if (existingPromo) {
      throw new Error("PROMO_CODE_ALREADY_EXISTS");
    }

    // 2. Create Promo Code record in database
    const promoCode = await Context.DataBase.promoCode.create({
      data: {
        code: formattedCode,
        banner: banner || null,
        discountType,
        discountScope,
        discountValue: Number(discountValue),
        maxDiscountValue: maxDiscountValue ? Number(maxDiscountValue) : null,
        minTransactionValue: minTransactionValue ? Number(minTransactionValue) : null,
        usageLimit: usageLimit ?? null,
        validFrom: new Date(validFrom),
        validUntil: new Date(validUntil),
        status: status || "ACTIVE",
      },
    });

    // 3. Return response with ISO string dates
    return {
      success: true,
      message: "Promo code created successfully",
      promoCode: {
        id: promoCode.id,
        code: promoCode.code,
        banner: promoCode.banner,
        discountType: promoCode.discountType,
        discountScope: promoCode.discountScope,
        discountValue: promoCode.discountValue,
        maxDiscountValue: promoCode.maxDiscountValue,
        minTransactionValue: promoCode.minTransactionValue,
        usageLimit: promoCode.usageLimit,
        validFrom: promoCode.validFrom ? new Date(promoCode.validFrom).toISOString() : null,
        validUntil: promoCode.validUntil ? new Date(promoCode.validUntil).toISOString() : null,
        status: promoCode.status,
        createdAt: promoCode.createdAt ? new Date(promoCode.createdAt).toISOString() : null,
        updatedAt: promoCode.updatedAt ? new Date(promoCode.updatedAt).toISOString() : null,
      },
    };

  } catch (error) {
    if (Context && Context.isContext) {
      await Context.Debug(
        { message: "Failed to create promo code.", input, error },
        _functionName
      );
    }
    throw error;
  }
};
