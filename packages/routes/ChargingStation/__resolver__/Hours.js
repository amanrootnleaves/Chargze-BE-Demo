
/**
 * Weekly schedule for one station, Sunday first.
 *
 * Returns an empty list when a station has never had hours set; the app reads
 * that as "open 24/7" rather than "closed", which matches how the seeded
 * stations behave today.
 */
export default async (__, { stationId }, Context) => {
  try {
    if (Context && Context.isContext) {
      return await Context.DataBase.stationHours.findMany({
        where: { ChargingStation__fk__: stationId, isDeleted: false },
        orderBy: { dayOfWeek: "asc" },
      });
    }
    return new Error("MISSING__CONTEXT");
  } catch (error) {
    return error;
  }
};
