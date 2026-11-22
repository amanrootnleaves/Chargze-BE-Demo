// export default async (__, ___, Context) => {
//   try {
//     if (Context && Context.isContext) {
//       const _functionName = 'Routes -> ChargingSession -> EVTransactionHistory'

//       const _ChargingSessions = await Context.DataBase.chargingSession.findMany({
//         where: {
//           isDeleted: false,
//           CustomerProfile: {
//             Account: {
//               id: Context.Session.user.id
//             }
//           }
//         },
//         include: {
//           Charger: true,
//           Transaction: true
//         },
//         orderBy: {
//             createdAt: 'desc'
//         }
//       })

//       return _ChargingSessions || []
//     }
//     return new Error('MISSING__CONTEXT')
//   } catch (error) {
//     return error
//   }
// }

export default async (__, { status, month, year }, Context) => {
  try {
    if (Context && Context.isContext) {
      const _functionName =
        "Routes -> ChargingSession -> Query -> EVTransactionHistory";
      await Context.Debug(
        {
          message: "Fetching EV transaction history.",
          filters: {
            status,
            month,
            year,
          },
        },
        _functionName,
      );
      if (!Context.Session?.user?.id) {
        throw new Error("UNAUTHORIZED");
      }

      const where = {
        isDeleted: false,
        CustomerProfile: {
          Account: {
            id: Context.Session.user.id,
          },
        },
      };

      if (status) {
        where.status = status;
      }

      if (month !== undefined && year !== undefined) {
        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 1);

        where.createdAt = {
          gte: startDate,
          lt: endDate,
        };
      }
await Context.Debug(
  {
    message: "EV Transaction History where clause",
    where,
    userId: Context.Session.user.id,
  },
  _functionName,
);
      const sessions = await Context.DataBase.chargingSession.findMany({
        where,
        include: {
          Charger: {
            include: {
              ChargingStation: true,
              Connectors: true, // if needed
            },
          },
          Transaction: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      });
await Context.Debug(
  {
    message: "Sessions fetched",
    count: sessions.length,
  },
  _functionName,
);
      const overview = await Context.DataBase.chargingSession.aggregate({
        where,
        _count: {
          id: true,
        },
        _sum: {
          energyConsumed: true,
          totalAmount: true,
        },
      });

      return {
        overview: {
          totalSessions: overview._count.id,
          totalEnergy: Number(overview._sum.energyConsumed || 0),
          totalAmountSpent: Number(overview._sum.totalAmount || 0),
        },
        sessions,
      };
    }

    throw new Error("MISSING__CONTEXT");
  } catch (error) {
    throw error;
  }
};
