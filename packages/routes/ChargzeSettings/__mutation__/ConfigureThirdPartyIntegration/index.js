export default async (_, { input }, Context) => {
  const _functionName = "Routes -> Settings -> Mutation -> ConfigureThirdPartyIntegration";

  try {
    if (Context && Context.isContext) {
      await Context.Debug(
        { message: "Configuring Third-Party Integration Started", serviceName: input.serviceName },
        _functionName
      );

      const updatedIntegrationConfig = await Context.DataBase.$transaction(
        async (tx) => {
          // Using serviceName since it's unique in your Prisma model
          const existingConfig = await tx.thirdPartyIntegration.findUnique({
            where: { serviceName: input.serviceName },
          });

          if (existingConfig) {
            return await tx.thirdPartyIntegration.update({
              where: { id: existingConfig.id },
              data: {
                ...input,
              },
            });
          } else {
            return await tx.thirdPartyIntegration.create({
              data: {
                ...input,
              },
            });
          }
        },
        {
          maxWait: 5000,
          timeout: 20000, // 20 Seconds Timeout standard
        }
      );

      await Context.Debug(
        { message: "Third-Party Integration Configured Successfully", integrationId: updatedIntegrationConfig.id },
        _functionName
      );

      return updatedIntegrationConfig;
    }
  } catch (error) {
    await Context.Debug(
      { message: "Third-Party Integration Configuration Failed", error: error.message },
      _functionName
    );
    throw error;
  }
};