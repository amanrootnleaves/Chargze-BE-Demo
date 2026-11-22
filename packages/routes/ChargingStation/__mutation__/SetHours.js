
/**
 * Replaces a station's weekly schedule with the supplied days.
 *
 * Runs as one transaction: a partial save would leave the station showing a
 * half-updated week, which is worse than the edit failing outright.
 *
 * Days are upserted rather than deleted-and-recreated so each row keeps its id
 * and createdAt, and so the unique (station, dayOfWeek) constraint does the
 * de-duplication for us if the caller sends the same day twice.
 */
export default async (__, { stationId, input }, Context) => {
  try {
    if (!Context || !Context.isContext) throw new Error("MISSING__CONTEXT");

    const station = await Context.DataBase.chargingStation.findUnique({
      where: { id: stationId },
    });
    if (!station || station.isDeleted) throw new Error("STATION__NOT__FOUND");

    for (const day of input) {
      if (day.dayOfWeek < 0 || day.dayOfWeek > 6) {
        throw new Error("INVALID__DAY__OF__WEEK");
      }
      // A day that is neither closed nor 24/7 has to say when it opens.
      const timed = day.isClosed !== true && day.isOpen24Hours !== true;
      if (timed && (!day.openTime || !day.closeTime)) {
        throw new Error("MISSING__OPEN__OR__CLOSE__TIME");
      }
    }

    await Context.DataBase.$transaction(
      input.map((day) => {
        const isClosed = day.isClosed === true;
        const isOpen24Hours = !isClosed && day.isOpen24Hours !== false;
        // Times are meaningless for closed or round-the-clock days; store null
        // so the two representations can never disagree.
        const openTime = isClosed || isOpen24Hours ? null : day.openTime;
        const closeTime = isClosed || isOpen24Hours ? null : day.closeTime;

        const values = { isOpen24Hours, isClosed, openTime, closeTime, isDeleted: false };

        return Context.DataBase.stationHours.upsert({
          where: {
            ChargingStation__fk___dayOfWeek: {
              ChargingStation__fk__: stationId,
              dayOfWeek: day.dayOfWeek,
            },
          },
          update: values,
          create: {
            ...values,
            dayOfWeek: day.dayOfWeek,
            ChargingStation__fk__: stationId,
          },
        });
      })
    );

    return await Context.DataBase.stationHours.findMany({
      where: { ChargingStation__fk__: stationId, isDeleted: false },
      orderBy: { dayOfWeek: "asc" },
    });
  } catch (error) {
    // Rethrow: the field is [StationHours!]!, so returning an Error would
    // surface as a null-violation and hide the actual reason.
    throw error;
  }
};
