export default async (_, { input }, Context) => {
  const _functionName = "Routes -> Settings -> Mutation -> UpdatePlatformSetting";

  try {
    // 1. Context Validation Check
    if (Context && Context.isContext) {
      await Context.Debug(
        { message: "Updating Platform Setting Started", input },
        _functionName
      );

      // 2. Database Transaction with 20s Timeout (Company Standard)
      const updatedPlatformSetting = await Context.DataBase.$transaction(
        async (tx) => {
          // Since PlatformSetting is a singleton config table, check if a record already exists
          let existingSetting = await tx.platformSetting.findFirst();

          if (existingSetting) {
            // Update existing platform settings record
            return await tx.platformSetting.update({
              where: { id: existingSetting.id },
              data: {
                ...input,
              },
            });
          } else {
            // Create initial platform settings record if none exists
            return await tx.platformSetting.create({
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
        { message: "Platform Setting Updated Successfully", settingId: updatedPlatformSetting.id },
        _functionName
      );

      return updatedPlatformSetting;
    }
  } catch (error) {
    await Context.Debug(
      { message: "Platform Setting Update Failed", error: error.message },
      _functionName
    );
    throw error;
  }
};