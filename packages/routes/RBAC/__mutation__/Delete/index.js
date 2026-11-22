export default async (_, args, Context) => {
  const _functionName = "Routes -> Rbac -> Mutation -> DeleteRbacAccount";

  try {
    if (!Context || !Context.isContext) {
      throw new Error("MISSING_CONTEXT");
    }

    const { id } = args;

    if (!id) {
      throw new Error("ACCOUNT_ID_IS_REQUIRED");
    }

    // 1. Check if account exists
    const existingAccount = await Context.DataBase.account.findFirst({
      where: { id, isDeleted: false },
    });

    if (!existingAccount) {
      throw new Error("ACCOUNT_NOT_FOUND_OR_ALREADY_DELETED");
    }

    // 2. Explicit Soft Delete using Update
    await Context.DataBase.$transaction([
      // Account soft-delete
      Context.DataBase.account.update({
        where: { id },
        data: { isDeleted: true },
      }),
      // Associated Station Access entries soft-delete
      Context.DataBase.accountStationAccess.updateMany({
        where: {
          Account__fk__: id,
          isDeleted: false,
        },
        data: { isDeleted: true },
      }),
    ]);

    return {
      success: true,
      message: "ACCOUNT_DELETED_SUCCESSFULLY",
    };
  } catch (error) {
    throw new Error(error.message || "INTERNAL_SERVER_ERROR");
  }
};