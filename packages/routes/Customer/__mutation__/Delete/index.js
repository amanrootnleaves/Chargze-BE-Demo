export default async (_root, _args, Context) => {
  try {
    if (Context && Context.isContext) {
      const _functionName = "Routes -> Customer -> Delete";

      await Context.Debug(
        { message: "Deleting customer profile.." },
        _functionName,
      );

      const { customerId } = _args;

      if (!customerId) {
        return new Error("MISSING__CUSTOMER_ID");
      }

      const existingProfile = await Context.DataBase.customerProfile.findUnique({
        where: { id: customerId }
      });

      if (!existingProfile) {
        return new Error("CUSTOMER_NOT_FOUND");
      }

      const updatedProfile = await Context.DataBase.customerProfile.update({
        where: { id: customerId },
        data: {
          isDeleted: true
        }
      });

      if (updatedProfile.Account__fk__) {
        await Context.DataBase.account.update({
          where: { id: updatedProfile.Account__fk__ },
          data: {
            isDeleted: true
          }
        });
      }

      return updatedProfile;

    }

    return new Error("MISSING__CONTEXT");
  } catch (error) {
    return error;
  }
};
