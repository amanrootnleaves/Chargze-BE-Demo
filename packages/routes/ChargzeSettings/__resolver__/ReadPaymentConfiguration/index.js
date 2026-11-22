export default async (_, args, Context) => {
  const _functionName = "Routes -> Settings -> Query -> GetPaymentGateways";

  try {
    // 1. Context Validation Check
    if (Context && Context.isContext) {
      await Context.Debug(
        { message: "Fetching Payment Gateways Started" },
        _functionName
      );

      // 2. Fetch all active/non-deleted payment gateway configurations from database
      const paymentGateways = await Context.DataBase.paymentGatewayConfig.findMany({
        where: {
          isDeleted: {
            not: true,
          },
        },
      });

      await Context.Debug(
        { message: "Payment Gateways Fetched Successfully", count: paymentGateways.length },
        _functionName
      );

      return paymentGateways;
    }
  } catch (error) {
    await Context.Debug(
      { message: "Payment Gateways Fetch Failed", error: error.message },
      _functionName
    );
    throw error;
  }
};