import _ from "underscore";

export default async (__, ___, Context) => {
  try {
    if (Context && Context.isContext) {
      const _functionName = "Routes -> Order -> Stats";
      const { DataBase } = Context;

      const calculatePercentage = (current, previous) => {
        if (previous === 0) return current > 0 ? 100 : 0;
        return ((current - previous) / previous) * 100;
      };

      const now = new Date();
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const fourteenDaysAgo = new Date(
        now.getTime() - 14 * 24 * 60 * 60 * 1000,
      );

      const [
        totalOrdersAllTimeCount,
        totalOrders7DaysCount,
        totalOrdersPrevCount,

        newOrdersAllTimeCount,
        newOrders7DaysCount,
        newOrdersPrevCount,

        completedOrdersAllTimeCount,
        completedOrders7DaysCount,
        completedOrdersPrevCount,

        canceledOrdersAllTimeCount,
        canceledOrders7DaysCount,
        canceledOrdersPrevCount,

        totalSalesAllTime,
        totalSales7Days,
        totalSalesPrev,
      ] = await Promise.all([
        DataBase.order.count({ where: { isDeleted: false } }),
        DataBase.order.count({ where: { isDeleted: false, orderedAt: { gte: sevenDaysAgo } } }),
        DataBase.order.count({
          where: { isDeleted: false, orderedAt: { gte: fourteenDaysAgo, lt: sevenDaysAgo } },
        }),
  
        DataBase.order.count({
          where: { isDeleted: false, status: { in: ["PENDING", "PROCESSING"] } },
        }),
        DataBase.order.count({
          where: {
            isDeleted: false,
            status: { in: ["PENDING", "PROCESSING"] },
            orderedAt: { gte: sevenDaysAgo },
          },
        }),
        DataBase.order.count({
          where: {
            isDeleted: false,
            status: { in: ["PENDING", "PROCESSING"] },
            orderedAt: { gte: fourteenDaysAgo, lt: sevenDaysAgo },
          },
        }),
  
        DataBase.order.count({
          where: { isDeleted: false, status: "DELIVERED" },
        }),
        DataBase.order.count({
          where: { isDeleted: false, status: "DELIVERED", orderedAt: { gte: sevenDaysAgo } },
        }),
        DataBase.order.count({
          where: {
            isDeleted: false,
            status: "DELIVERED",
            orderedAt: { gte: fourteenDaysAgo, lt: sevenDaysAgo },
          },
        }),
  
        DataBase.order.count({
          where: { isDeleted: false, status: "CANCELLED" },
        }),
        DataBase.order.count({
          where: { isDeleted: false, status: "CANCELLED", orderedAt: { gte: sevenDaysAgo } },
        }),
        DataBase.order.count({
          where: {
            isDeleted: false,
            status: "CANCELLED",
            orderedAt: { gte: fourteenDaysAgo, lt: sevenDaysAgo },
          },
        }),
  
        DataBase.order.aggregate({
          _sum: { totalAmount: true },
          where: { isDeleted: false, status: { not: "CANCELLED" } },
        }),
        DataBase.order.aggregate({
          _sum: { totalAmount: true },
          where: {
            isDeleted: false,
            status: { not: "CANCELLED" },
            orderedAt: { gte: sevenDaysAgo },
          },
        }),
        DataBase.order.aggregate({
          _sum: { totalAmount: true },
          where: {
            isDeleted: false,
            status: { not: "CANCELLED" },
            orderedAt: { gte: fourteenDaysAgo, lt: sevenDaysAgo },
          },
        }),
      ]);

      return {
        totalOrders: totalOrdersAllTimeCount,
        totalOrders7Days: totalOrders7DaysCount,
        totalOrdersPercentage: calculatePercentage(
          totalOrders7DaysCount,
          totalOrdersPrevCount,
        ),
        newOrders: newOrdersAllTimeCount,
        newOrders7Days: newOrders7DaysCount,
        newOrdersPercentage: calculatePercentage(
          newOrders7DaysCount,
          newOrdersPrevCount,
        ),
        completedOrders: completedOrdersAllTimeCount,
        completedOrders7Days: completedOrders7DaysCount,
        completedOrdersPercentage: calculatePercentage(
          completedOrders7DaysCount,
          completedOrdersPrevCount,
        ),
        canceledOrders: canceledOrdersAllTimeCount,
        canceledOrders7Days: canceledOrders7DaysCount,
        canceledOrdersPercentage: calculatePercentage(
          canceledOrders7DaysCount,
          canceledOrdersPrevCount,
        ),
        totalSales: totalSalesAllTime._sum.totalAmount
          ? Number(totalSalesAllTime._sum.totalAmount)
          : 0,
        totalSalesPercentage: calculatePercentage(
          totalSales7Days._sum.totalAmount
            ? Number(totalSales7Days._sum.totalAmount)
            : 0,
          totalSalesPrev._sum.totalAmount
            ? Number(totalSalesPrev._sum.totalAmount)
            : 0,
        ),
      };
    }
    return new Error("MISSING_CONTEXT");
  } catch (error) {
    return error;
  }
};
