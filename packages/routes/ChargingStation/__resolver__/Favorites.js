
export default async (__, ___, Context) => {
  try {
    if (Context && Context.isContext) {
      const accountId = Context.Session?.user?.id;
      if (!accountId) return new Error("UNAUTHORIZED");

      const customerProfile = await Context.DataBase.customerProfile.findUnique({
        where: { Account__fk__: accountId },
      });

      if (!customerProfile) return [];

      const favorites = await Context.DataBase.favoriteStation.findMany({
        where: {
          CustomerProfile__fk__: customerProfile.id,
          isDeleted: { not: true },
        },
        include: {
          ChargingStation: {
            include: {
              Chargers: true,
              StationReviews: {
                include: {
                  CustomerProfile: true
                }
              }
            }
          }
        }
      });

      return favorites.map(f => f.ChargingStation);
    }
    return new Error("MISSING__CONTEXT");
  } catch (error) {
    return error;
  }
};
