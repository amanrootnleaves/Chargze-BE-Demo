import _ from "underscore";

export default async (_, { productId }, Context) => {
  try {
    if (Context && Context.isContext) {
      const _functionName = "Routes -> Product -> Read -> ProductDetailsRead";

      await Context.Debug(
        { message: "Fetching product details..", productId },
        _functionName,
      );

      const product = await Context.DataBase.product.findUnique({
        where: { id: productId },
        include: {
          Company: true,
          Reviews: {
            where: { isDeleted: false },
          },
        },
      });

      if (!product) {
        return new Error("PRODUCT_NOT_FOUND");
      }

      // Calculate rating variables based on fetched Reviews
      let totalReviews = 0;
      let averageRating = 0;

      if (product.Reviews && product.Reviews.length > 0) {
        totalReviews = product.Reviews.length;
        const sumRating = product.Reviews.reduce(
          (sum, review) => sum + review.rating,
          0,
        );
        averageRating = sumRating / totalReviews;
      }

      await Context.Debug(
        { message: "Successfully fetched product details." },
        _functionName,
      );

      return {
        ...product,
        mrp: product.mrp ? Number(product.mrp) : null,
        taxPercent: product.taxPercent ? Number(product.taxPercent) : null,
        salePrice: product.salePrice ? Number(product.salePrice) : null,
        discountPercent: product.discountPercent
          ? Number(product.discountPercent)
          : null,
        rating: Number(averageRating.toFixed(1)),
        totalReviews,
        message: "Successfully fetched product details",
        statusMsg: "PRODUCT_FOUND",
      };
    }

    return new Error("MISSING__CONTEXT");
  } catch (error) {
    if (Context && Context.isContext) {
      await Context.Debug(
        { message: "Error in ProductDetailsRead", error },
        "Routes -> Product -> Read -> ProductDetailsRead",
      );
    }
    return error;
  }
};
