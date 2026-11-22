export default async (_, args, Context) => {
  const _functionName = "Routes -> Settings -> Query -> GetPlatformSetting";

  try {
    // 1. Context Validation Check
    if (Context && Context.isContext) {
      await Context.Debug(
        { message: "Fetching Platform Setting Started" },
        _functionName
      );

      // 2. Fetch the single/singleton platform settings record from database
      const platformSetting = await Context.DataBase.platformSetting.findFirst();

      await Context.Debug(
        { message: "Platform Setting Fetched Successfully", found: !!platformSetting },
        _functionName
      );

      return platformSetting;
    }
  } catch (error) {
    await Context.Debug(
      { message: "Platform Setting Fetch Failed", error: error.message },
      _functionName
    );
    throw error;
  }
};