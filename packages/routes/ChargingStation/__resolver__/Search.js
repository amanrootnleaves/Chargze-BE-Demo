export default async (__, { input }, Context) => {
  try {
    if (Context && Context.isContext) {
      const { query } = input || {};
      const _whatToQuery = {
        OR: [
          { isDeleted: false },
          { isDeleted: null }
        ]
      };
      
      if (query) {
        _whatToQuery.AND = [
          {
            OR: [
              { name: { contains: query, mode: "insensitive" } },
              { address: { contains: query, mode: "insensitive" } }
            ]
          }
        ];
      }

      return await Context.DataBase.chargingStation.findMany({
        where: _whatToQuery,
        include: {
          Chargers: true,
        },
        orderBy: {
          name: "asc",
        },
      });
    }
    return new Error("MISSING__CONTEXT");
  } catch (error) {
    return error;
  }
};
