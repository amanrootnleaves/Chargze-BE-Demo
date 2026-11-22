import { ADMIN_ROLE } from "@prisma/client";

const _hasValue = (value) => {
  if (typeof value === "string") {
    return value.trim().length > 0;
  }
  return value !== null && value !== undefined;
};

export default async (_, args, Context) => {
  const _functionName = "Routes -> Rbac -> Query -> RbacAccounts";

  try {
    if (!Context || !Context.isContext) {
      throw new Error("MISSING_CONTEXT");
    }

    const input = args.input || args;
    const searchKeyword = _hasValue(input.search) ? input.search.trim() : null;
    const rolesFilter = input.roles || input.adminRoles || (input.role ? [input.role] : null);

    await Context.Debug(
      { message: "RbacAccounts Execution Started", search: searchKeyword, roles: rolesFilter },
      _functionName
    );

    // 1. Base Where Condition
    const whereCondition = {
      isDeleted: false,
    };

    // 2. Exact Role Filtering (For Partner vs Team Member UI separation)
    if (Array.isArray(rolesFilter) && rolesFilter.length > 0) {
      whereCondition.adminRole = {
        in: rolesFilter,
      };
    }

    // 3. Global Multi-Field Search
    if (searchKeyword) {
      const matchedRoles = Object.values(ADMIN_ROLE).filter((role) =>
        role.toLowerCase().includes(searchKeyword.toLowerCase())
      );

      whereCondition.OR = [
        {
          fullName: {
            contains: searchKeyword,
            mode: "insensitive",
          },
        },
        {
          email: {
            contains: searchKeyword,
            mode: "insensitive",
          },
        },
        {
          AccountStationAccess: {
            some: {
              isDeleted: false,
              ChargingStation: {
                OR: [
                  {
                    id: {
                      contains: searchKeyword,
                      mode: "insensitive",
                    },
                  },
                  {
                    name: {
                      contains: searchKeyword,
                      mode: "insensitive",
                    },
                  },
                ],
              },
            },
          },
        },
      ];

      if (matchedRoles.length > 0) {
        whereCondition.OR.push({
          adminRole: {
            in: matchedRoles,
          },
        });
      }
    }

    // 4. Query Database
    const accounts = await Context.DataBase.account.findMany({
      where: whereCondition,
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
      orderBy: {
        createdAt: "desc",
      },
    });

    await Context.Debug(
      {
        message: "RbacAccounts Fetched Successfully",
        count: accounts.length,
      },
      _functionName
    );

    return accounts;
  } catch (error) {
    if (Context && Context.isContext) {
      await Context.Debug(
        { message: "Error in RbacAccounts Resolver", error: error.message },
        _functionName
      );
    }
    throw new Error(error.message || "INTERNAL_SERVER_ERROR");
  }
};