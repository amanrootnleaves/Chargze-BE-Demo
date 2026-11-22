import _ from "underscore"; 

export default async (_root, _args, Context) => {
  try {
    if (Context && Context.isContext) {
      const _functionName = "Routes -> Customer -> Overview";

      await Context.Debug(
        { message: "Getting customer overview.." },
        _functionName,
      );

      const { timeframe } = _args; 

      let startDate, endDate;
      const now = new Date();

      if (timeframe === "last_week") {
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay() - 7);
        endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay());
      } else {
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay());
        endDate = new Date();
      }

      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(23, 59, 59, 999);

      const activeCustomers = await Context.DataBase.customerProfile.count({
        where: {
          isDeleted: false,
          status: "ACTIVE",
          createdAt: { gte: startDate, lte: endDate },
        },
      });

      const repeatCustomers = await Context.DataBase.customerProfile.count({
        where: {
          isDeleted: false,
          totalOrders: { gt: 1 },
          lastOrderAt: { gte: startDate, lte: endDate },
        },
      });

      const shopVisitors = await Context.DataBase.customerProfile.count({
        where: {
          isDeleted: false,
          lastLoginAt: { gte: startDate, lte: endDate },
        },
      });

      const conversionRate = shopVisitors > 0 ? ((activeCustomers / shopVisitors) * 100).toFixed(1) : 0;

      const chartData = {
        activeCustomers: [],
        repeatCustomers: [],
        shopVisitors: [],
        conversionRate: []
      };

      const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

      for (let i = 0; i < 7; i++) {
        const dayStart = new Date(startDate);
        dayStart.setDate(startDate.getDate() + i);
        dayStart.setHours(0, 0, 0, 0);

        const dayEnd = new Date(dayStart);
        dayEnd.setHours(23, 59, 59, 999);

        const dailyActive = await Context.DataBase.customerProfile.count({
          where: {
            isDeleted: false,
            createdAt: { gte: dayStart, lte: dayEnd },
          },
        });

        const dailyRepeat = await Context.DataBase.customerProfile.count({
          where: {
            isDeleted: false,
            totalOrders: { gt: 1 },
            lastOrderAt: { gte: dayStart, lte: dayEnd },
          },
        });

        const dailyVisitors = await Context.DataBase.customerProfile.count({
          where: {
            isDeleted: false,
            lastLoginAt: { gte: dayStart, lte: dayEnd },
          },
        });

        const dailyConversion = dailyVisitors > 0 ? ((dailyActive / dailyVisitors) * 100).toFixed(1) : 0;

        chartData.activeCustomers.push({ name: days[i], value: dailyActive });
        chartData.repeatCustomers.push({ name: days[i], value: dailyRepeat });
        chartData.shopVisitors.push({ name: days[i], value: dailyVisitors });
        chartData.conversionRate.push({ name: days[i], value: parseFloat(dailyConversion) });
      }

      return {
        activeCustomers,
        repeatCustomers,
        shopVisitors,
        conversionRate: parseFloat(conversionRate),
        chartData,
      };
    }

    return new Error("MISSING__CONTEXT");
  } catch (error) {
    return error;
  }
};
