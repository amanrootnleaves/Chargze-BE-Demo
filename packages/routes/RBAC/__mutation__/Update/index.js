import { ADMIN_ROLE } from "@prisma/client";

// Helper Validation Function
const _hasValue = (value) => {
  if (typeof value === "string") {
    return value.trim().length > 0;
  }
  return value !== null && value !== undefined;
};

export default async (_, args, Context) => {
  const _functionName = "Routes -> Rbac -> Mutation -> UpdateAccountRole";

  try {
    // 1. Context Check
    if (!Context || !Context.isContext) {
      throw new Error("MISSING_CONTEXT");
    }

    const input = args.input || args;
    const { accountId, role } = input;

    await Context.Debug(
      { message: "UpdateAccountRole Execution Started", accountId, role },
      _functionName
    );

    // 2. Validate Inputs
    if (!_hasValue(accountId)) {
      throw new Error("ACCOUNT_ID_IS_REQUIRED");
    }

    if (!_hasValue(role)) {
      throw new Error("ROLE_IS_REQUIRED");
    }

    // 3. Verify Role against Prisma ADMIN_ROLE Enum
    const validRoles = Object.values(ADMIN_ROLE);
    if (!validRoles.includes(role)) {
      throw new Error("INVALID_ROLE_PROVIDED");
    }

    // 4. Check Account Existence
    const existingAccount = await Context.DataBase.account.findFirst({
      where: {
        id: accountId,
        isDeleted: false,
      },
    });

    if (!existingAccount) {
      throw new Error("ACCOUNT_NOT_FOUND_OR_DELETED");
    }

    // 5. Update Account Role
    const updatedAccount = await Context.DataBase.account.update({
      where: {
        id: accountId,
      },
      data: {
        adminRole: role,
      },
      include: {
        AccountStationAccess: {
          where: {
            isDeleted: false,
          },
          include: {
            ChargingStation: true,
          },
        },
      },
    });

    await Context.Debug(
      { message: "UpdateAccountRole Executed Successfully", accountId, newRole: role },
      _functionName
    );

    return {
      success: true,
      message: "ACCOUNT_ROLE_UPDATED_SUCCESSFULLY",
      account: updatedAccount,
    };
  } catch (error) {
    if (Context && Context.isContext) {
      await Context.Debug(
        { message: "Error in UpdateAccountRole Mutation", error: error.message },
        _functionName
      );
    }
    throw new Error(error.message || "INTERNAL_SERVER_ERROR");
  }
};