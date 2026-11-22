import _ from "underscore";

export default async (_, { productId, pincode }, Context) => {
  try {
    if (Context && Context.isContext) {
      const _functionName =
        "Routes -> Customer -> Mutation -> CheckPincodeDelivery";

      await Context.Debug(
        { message: "Checking pincode delivery availability.." },
        _functionName,
      );

      if (!productId || !pincode) {
        return new Error("MISSING_REQUIRED_FIELDS");
      }

      return {
        isAvailable: true,
        estimatedDays: "3-4",
        message: "Get Delivery in 3-4 Days",
        statusMsg: "PINCODE_DELIVERY_AVAILABLE",
      };
    }

    return new Error("MISSING__CONTEXT");
  } catch (error) {
    return error;
  }
};
