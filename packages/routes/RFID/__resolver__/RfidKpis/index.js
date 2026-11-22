export default async (__, _, Context) => {
  const _functionName = "Routes -> RfidRequest -> Query -> GetRfidKpiStats";

  try {
    if (Context && Context.isContext) {
      await Context.Debug(
        { message: "Fetching RFID dashboard KPI stats." },
        _functionName
      );
    }

    const db = Context.DataBase;

    // Date ranges for Month-over-Month (MoM) comparison
    const now = new Date();
    const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const prevMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);

    // Helper function to calculate percentage change and trend direction
    const calculateMetric = (currentValue, previousValue) => {
      const diff = currentValue - previousValue;
      let percentageChange = 0;

      if (previousValue === 0) {
        percentageChange = currentValue > 0 ? 100 : 0;
      } else {
        percentageChange = Number(((Math.abs(diff) / previousValue) * 100).toFixed(1));
      }

      return {
        value: currentValue,
        percentageChange,
        isIncrease: diff >= 0,
      };
    };

    // Fetching all counts and sums in parallel using Promise.all
    const [
      totalCardsCount,
      totalPrevMonthCount,
      linkedCardsCount,
      linkedPrevMonthCount,
      pendingRequestsCount,
      pendingPrevMonthCount,
      standaloneCount,
      standalonePrevMonthCount,
      totalAmountData,
      prevMonthAmountData,
    ] = await Promise.all([
      // 1. Total RFID Cards
      db.rfidRequest.count(),
      db.rfidRequest.count({ where: { createdAt: { gte: prevMonthStart, lte: prevMonthEnd } } }),

      // 2. Linked RFID (isIssued: true)
      db.rfidRequest.count({ where: { isIssued: true } }),
      db.rfidRequest.count({ where: { isIssued: true, createdAt: { gte: prevMonthStart, lte: prevMonthEnd } } }),

      // 3. Pending Requests (isIssued: false)
      db.rfidRequest.count({ where: { isIssued: false } }),
      db.rfidRequest.count({ where: { isIssued: false, createdAt: { gte: prevMonthStart, lte: prevMonthEnd } } }),

      // 4. Standalone (Safe check if rfidTag exists in database client)
      db.rfidTag ? db.rfidTag.count({ where: { status: 'STANDALONE' } }) : Promise.resolve(0),
      db.rfidTag ? db.rfidTag.count({ where: { status: 'STANDALONE', createdAt: { gte: prevMonthStart, lte: prevMonthEnd } } }) : Promise.resolve(0),

      // 5. Total RFID Amount Paid
      db.rfidRequest.aggregate({ _sum: { amountPaid: true } }),
      db.rfidRequest.aggregate({
        where: { createdAt: { gte: prevMonthStart, lte: prevMonthEnd } },
        _sum: { amountPaid: true },
      }),
    ]);

    const totalAmount = totalAmountData._sum.amountPaid || 0;
    const prevMonthAmount = prevMonthAmountData._sum.amountPaid || 0;

    return {
      totalRfidCards: calculateMetric(totalCardsCount, totalPrevMonthCount),
      linkedRfid: calculateMetric(linkedCardsCount, linkedPrevMonthCount),
      pendingRequests: calculateMetric(pendingRequestsCount, pendingPrevMonthCount),
      standalone: calculateMetric(standaloneCount, standalonePrevMonthCount),
      totalRfidAmount: calculateMetric(totalAmount, prevMonthAmount),
    };

  } catch (error) {
    if (Context && Context.isContext) {
      await Context.Debug(
        { error: error.message, stack: error.stack },
        _functionName
      );
    }
    throw new Error(`Failed to fetch RFID KPI stats: ${error.message}`);
  }
};