import _ from "underscore";

export default async (_, { productId, rating, comment, images }, Context) => {
  try {
    if (Context && Context.isContext) {
      const _functionName = "Routes -> Product -> Mutation -> ReviewCreate";

      await Context.Debug(
        { message: "Creating product review" },
        _functionName,
      );

      const _accountId = Context.Session?.user?.id;
      if (!_accountId) {
        return new Error("REQUIRE__LOGIN");
      }

      const account = await Context.DataBase.account.findUnique({
        where: { id: _accountId },
      });

      if (!account) return new Error("ACCOUNT_NOT_FOUND");

      const customerProfile = await Context.DataBase.customerProfile.findUnique(
        {
          where: { Account__fk__: _accountId },
        },
      );

      if (!customerProfile) {
        return new Error("MISSING_CUSTOMER_PROFILE");
      }

      if (!productId) {
        return new Error("MISSING_PRODUCT_ID");
      }

      if (rating < 1 || rating > 5) {
        return new Error("INVALID_RATING_VALUE");
      }

      const product = await Context.DataBase.product.findUnique({
        where: { id: productId },
      });

      if (!product || product.isDeleted) {
        return new Error("PRODUCT_NOT_FOUND");
      }

      const review = await Context.DataBase.review.create({
        data: {
          rating,
          comment,
          images,
          CustomerProfile: {
            connect: { id: customerProfile.id },
          },
          Product: {
            connect: { id: productId },
          },
        },
      });

      return {
        ...review,
        message: "Successfully submitted review",
        statusMsg: "REVIEW_CREATED",
      };
    }

    return new Error("MISSING__CONTEXT");
  } catch (error) {
    if (Context && Context.isContext) {
      await Context.Debug(
        { message: "Error in ReviewCreate", error },
        "Routes -> Product -> Mutation -> ReviewCreate",
      );
    }
    return error;
  }
};
