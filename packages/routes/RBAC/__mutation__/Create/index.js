// Helper Validations
const _isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

const _hasValue = (value) => {
  if (typeof value === "string") {
    return value.trim().length > 0;
  }
  return value !== null && value !== undefined;
};

export default async (_, { input }, Context) => {
  const _functionName = "Routes -> Rbac -> Mutation -> AssignTeamMemberRole";

  try {
    // 1. Context Validation Check (As per company pattern)
    if (Context && Context.isContext) {
      await Context.Debug(
        { message: "Assigning Team Member Role Started", input },
        _functionName
      );

      const { fullName, email, role, stationIds } = input;

      // 2. Strict Input Integrity Validations
      if (!_hasValue(email)) {
        throw new Error("EMAIL_IS_REQUIRED");
      }

      if (!_isValidEmail(email)) {
        throw new Error("INVALID_EMAIL_FORMAT");
      }

      if (!_hasValue(role)) {
        throw new Error("ROLE_IS_REQUIRED");
      }

      // 3. Database Transaction with 20s Timeout
      const assignedAccount = await Context.DataBase.$transaction(
        async (tx) => {
          // Check existing account
          let account = await tx.account.findUnique({
            where: { email },
          });

          if (account) {
            // Update existing account
            account = await tx.account.update({
              where: { id: account.id },
              data: {
                adminRole: role,
                ...(_hasValue(fullName) && { fullName }),
              },
            });
          } else {
            // Create new account with INVITED status
            account = await tx.account.create({
              data: {
                email,
                fullName,
                adminRole: role,
                status: "INVITED",
              },
            });
          }

          // 4. Soft Delete Previous Active Mappings
          await tx.accountStationAccess.updateMany({
            where: {
              Account__fk__: account.id,
              isDeleted: false,
            },
            data: {
              isDeleted: true,
            },
          });

          // 5. Bulk Insert New Station Mappings
          if (Array.isArray(stationIds) && stationIds.length > 0) {
            const stationAccessEntries = stationIds.map((stationId) => ({
              Account__fk__: account.id,
              ChargingStation__fk__: stationId,
              isDeleted: false,
            }));

            await tx.accountStationAccess.createMany({
              data: stationAccessEntries,
            });
          }

          // Fetch updated account record with active station access relations
          return await tx.account.findUnique({
            where: { id: account.id },
            include: {
              AccountStationAccess: {
                where: {
                  isDeleted: false,
                },
              },
            },
          });
        },
        {
          maxWait: 5000,
          timeout: 20000, // 20 Seconds Timeout
        }
      );

      await Context.Debug(
        { message: "Team Member Role Assigned Successfully", accountId: assignedAccount.id },
        _functionName
      );

      return {
        success: true,
        message: "Team member role assigned successfully.",
        account: assignedAccount,
      };
    } else {
      throw new Error("MISSING_CONTEXT");
    }
  } catch (error) {
    if (Context && Context.isContext) {
      await Context.Debug(
        { message: "Error in AssignTeamMemberRole Resolver", error: error.message },
        _functionName
      );
    }
    throw new Error(error.message || "INTERNAL_SERVER_ERROR");
  }
};