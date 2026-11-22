import { ADMIN_ROLE } from "@prisma/client";
import { generateBase64Export } from "../../../../dyna_modules/Utils/index";

const _hasValue = (value) => {
  if (typeof value === "string") {
    return value.trim().length > 0;
  }
  return value !== null && value !== undefined;
};

export default async (_, args, Context) => {
  const _functionName = "Routes -> Rbac -> Query -> ExportRbacAccounts";

  try {
    if (!Context || !Context.isContext) {
      throw new Error("MISSING_CONTEXT");
    }

    const { format, search, roles } = args.input || args;
    const searchKeyword = _hasValue(search) ? search.trim() : null;
    const rolesFilter = roles || (args.role ? [args.role] : null);

    await Context.Debug(
      { message: "ExportRbacAccounts Execution Started", format, search: searchKeyword, roles: rolesFilter },
      _functionName
    );

    const whereCondition = {
      isDeleted: false,
    };

    // Filter by Roles
    if (Array.isArray(rolesFilter) && rolesFilter.length > 0) {
      whereCondition.adminRole = {
        in: rolesFilter,
      };
    }

    // Search Filter
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

    const exportData = accounts.map((account, index) => {
      const stationNames = account.AccountStationAccess
        ?.map((access) => access.ChargingStation?.name)
        .filter(Boolean)
        .join(", ");

      return {
        sNo: index + 1,
        fullName: account.fullName || "N/A",
        email: account.email || "N/A",
        role: account.adminRole || "N/A",
        assignedStations: stationNames || "No Stations Assigned",
        createdAt: account.createdAt
          ? new Date(account.createdAt).toLocaleDateString("en-GB")
          : "N/A",
      };
    });

    const columns = [
      { header: "#", key: "sNo", width: 8 },
      { header: "Full Name", key: "fullName", width: 22 },
      { header: "Email", key: "email", width: 28 },
      { header: "Role", key: "role", width: 18 },
      { header: "Assigned Stations", key: "assignedStations", width: 35 },
      { header: "Created At", key: "createdAt", width: 16 },
    ];

    const fileFormat = format.toUpperCase();
    const base64String = await generateBase64Export(
      exportData,
      columns,
      fileFormat,
      "RBAC Accounts Report"
    );

    const extension = fileFormat === "EXCEL" ? "xlsx" : "pdf";
    const mimeType =
      fileFormat === "EXCEL"
        ? "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        : "application/pdf";

    return {
      base64String,
      fileName: `RBAC_Accounts_Export_${new Date().getTime()}.${extension}`,
      mimeType,
    };
  } catch (error) {
    if (Context && Context.isContext) {
      await Context.Debug(
        { message: "Error in ExportRbacAccounts Query", error: error.message },
        _functionName
      );
    }
    throw new Error(error.message || "INTERNAL_SERVER_ERROR");
  }
};