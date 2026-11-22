/*
 * EXPORTS
 */
import _ from "underscore"; // NPM: Utility module.

/*
 * EXPORTS
 */
export default async (_root, _args, Context) => {
  // Error handling.
  try {
    /*
     * Only proceed if context is
     * defined else report failure.
     */
    if (Context && Context.isContext) {
      // Const assignment.
      const _functionName = "Routes -> Customer -> Stats";

      // Style guide.
      await Context.Debug(
        { message: "Getting customer stats.." },
        _functionName,
      );

      const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);

      const totalCustomers = await Context.DataBase.customerProfile.count({
        where: { isDeleted: false },
      });

      const activeCustomers = await Context.DataBase.customerProfile.count({
        where: { isDeleted: false, status: "ACTIVE" },
      });

      const inactiveCustomers = await Context.DataBase.customerProfile.count({
        where: { isDeleted: false, status: "INACTIVE" },
      });

      const vipCustomers = await Context.DataBase.customerProfile.count({
        where: { isDeleted: false, status: "VIP" },
      });

      const activeUsersInLast30Mins =
        await Context.DataBase.customerProfile.count({
          where: {
            isDeleted: false,
            lastLoginAt: { gte: thirtyMinutesAgo },
          },
        });

      // Calculate percentages
      const total = totalCustomers || 1; // Avoid division by zero

      return {
        totalCustomers,
        activeCustomers,
        inactiveCustomers,
        vipCustomers,
        totalCustomersPercentage: 100,
        activeCustomersPercentage: (activeCustomers / total) * 100,
        inactiveCustomersPercentage: (inactiveCustomers / total) * 100,
        vipCustomersPercentage: (vipCustomers / total) * 100,
        activeUsersInLast30Mins,
      };
    }

    return new Error("MISSING__CONTEXT");
  } catch (error) {
    return error;
  }
};
