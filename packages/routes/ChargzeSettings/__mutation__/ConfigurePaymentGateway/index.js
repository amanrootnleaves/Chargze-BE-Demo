export default async (_, { input }, Context) => {
  const _functionName = "Routes -> Settings -> Mutation -> ConfigurePaymentGateway";

  try {
    // 1. Context Validation Check
    if (Context && Context.isContext) {
      await Context.Debug(
        { message: "Configuring Payment Gateway Started", gatewayName: input.gatewayName },
        _functionName
      );

      // 2. Database Transaction with 20s Timeout (Company Standard)
      const updatedGatewayConfig = await Context.DataBase.$transaction(
        async (tx) => {
          // Since gatewayName is unique, check if configuration for this specific gateway already exists
          const existingConfig = await tx.paymentGatewayConfig.findUnique({
            where: { gatewayName: input.gatewayName },
          });

          if (existingConfig) {
            // Update existing gateway configuration
            return await tx.paymentGatewayConfig.update({
              where: { id: existingConfig.id },
              data: {
                ...input,
              },
            });
          } else {
            // Create new gateway configuration if it doesn't exist
            return await tx.paymentGatewayConfig.create({
              data: {
                ...input,
              },
            });
          }
        },
        {
          maxWait: 5000,
          timeout: 20000, // 20 Seconds Timeout matching your company standard
        }
      );

      await Context.Debug(
        { message: "Payment Gateway Configured Successfully", gatewayId: updatedGatewayConfig.id },
        _functionName
      );

      return updatedGatewayConfig;
    }
  } catch (error) {
    await Context.Debug(
      { message: "Payment Gateway Configuration Failed", error: error.message },
      _functionName
    );
    throw error;
  }
};