export default async (_, args, Context) => {
  const _functionName = "Routes -> Settings -> Query -> GetThirdPartyIntegrations";

  try {
    // 1. Context Validation Check
    if (Context && Context.isContext) {
      await Context.Debug(
        { message: "Fetching Third-Party Integrations Started" },
        _functionName
      );

      // 2. Fetch all active/non-deleted third-party integrations from database
      const integrations = await Context.DataBase.thirdPartyIntegration.findMany({
        where: {
          isDeleted: {
            not: true,
          },
        },
      });

      await Context.Debug(
        { message: "Third-Party Integrations Fetched Successfully", count: integrations.length },
        _functionName
      );

      return integrations;
    }
  } catch (error) {
    await Context.Debug(
      { message: "Third-Party Integrations Fetch Failed", error: error.message },
      _functionName
    );
    throw error;
  }
};