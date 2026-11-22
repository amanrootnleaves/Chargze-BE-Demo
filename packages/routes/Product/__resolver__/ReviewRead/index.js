import _ from "underscore";

export default async (_, { productId, take, skip }, Context) => {
  try {
    if (Context && Context.isContext) {
      const _functionName = "Routes -> Product -> Read -> ReviewRead";

      await Context.Debug(
        { message: "Fetching product reviews..", productId },
        _functionName,
      );

      const product = await Context.DataBase.product.findUnique({
        where: { id: productId },
      });

      if (!product) {
        return new Error("PRODUCT_NOT_FOUND");
      }

      const queryArgs = {
        where: {
          Product__fk__: productId,
          isDeleted: false,
        },
        include: {
          CustomerProfile: {
            include: {
              Account: true,
            },
          }, 
        },
        orderBy: {
          createdAt: "desc", 
        },
      };

      if (typeof take === "number") queryArgs.take = take;
      if (typeof skip === "number") queryArgs.skip = skip;

      const reviews = await Context.DataBase.review.findMany(queryArgs);

      await Context.Debug(
        { message: "Successfully fetched product reviews." },
        _functionName,
      );

      return reviews.map((review) => ({
        ...review,
        message: "Successfully fetched review",
        statusMsg: "REVIEW_FOUND",
      }));
    }

    return new Error("MISSING__CONTEXT");
  } catch (error) {
    if (Context && Context.isContext) {
      await Context.Debug(
        { message: "Error in ReviewRead", error },
        "Routes -> Product -> Read -> ReviewRead",
      );
    }
    return error;
  }
};
