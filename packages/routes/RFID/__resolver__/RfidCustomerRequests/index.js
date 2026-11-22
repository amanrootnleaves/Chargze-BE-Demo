export default async (__, { filter = {} }, Context) => {
  const _functionName = "Routes -> RfidTag -> Query -> GetRfidPurchaseRequests";

  try {
    if (Context && Context.isContext) {
      await Context.Debug(
        { message: "Fetching customer RFID requests/linked cards.", filter },
        _functionName
      );
    }

    const { page = 1, limit = 20, isIssued , search,dateFilter} = filter;
    const skip = (Math.max(1, page) - 1) * Math.max(1, limit);
    const take = Math.max(1, limit);

    const where = {
      isDeleted: false,
    };

    // Tab switch based purely on isIssued (false = Purchase Requests, true = Linked Cards)
    if (typeof isIssued === "boolean") {
      where.isIssued = isIssued;
    }
    if (dateFilter) {
      const { period, startDate, endDate } = dateFilter;
      let gteDate = startDate ? new Date(startDate) : null;
      let lteDate = endDate ? new Date(endDate) : null;
      const now = new Date();

      if (period) {
        switch (period) {
          case "TODAY":
            gteDate = new Date(now.setHours(0, 0, 0, 0));
            lteDate = new Date();
            break;
          case "WEEK":
            gteDate = new Date();
            gteDate.setDate(now.getDate() - 7);
            break;
          case "MONTH":
            gteDate = new Date();
            gteDate.setMonth(now.getMonth() - 1);
            break;
          case "HALF_YEAR":
            gteDate = new Date();
            gteDate.setMonth(now.getMonth() - 6);
            break;
          case "YEAR":
            gteDate = new Date();
            gteDate.setFullYear(now.getFullYear() - 1);
            break;
          default:
            break;
        }
      }

      if (gteDate || lteDate) {
        where.createdAt = {};
        if (gteDate) where.createdAt.gte = gteDate;
        if (lteDate) where.createdAt.lte = lteDate;
      }
    }
    if (search && search.trim() !== "") {
      const searchPattern = search.trim();
      where.OR = [
         
      
        // 2. Tag ID search via linked RfidTag relation
        {
          RfidTag: {
            tagId: { contains: searchPattern, mode: "insensitive" },
          },
        },
        // 3. Account Email search via CustomerProfile relation
        {
          CustomerProfile: {
            Account: {
              email: { contains: searchPattern, mode: "insensitive" },
            },
          },
        },
      ];
    }

    const [totalCount, records] = await Promise.all([
      Context.DataBase.rfidRequest.count({ where }),
      Context.DataBase.rfidRequest.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: "desc" },
        include: {
          CustomerProfile: {
            include: {
              Account: true,
            },
          },
          RfidTag: true,
        },
      }),
    ]);

    return {
      nodes: records.map((record) => ({
        ...record,
        customerProfile: record.CustomerProfile, // Map uppercase to lowercase for GraphQL
        rfidTag: record.RfidTag,                // Map uppercase to lowercase for GraphQL
      })),
      totalCount,
      totalPages: Math.ceil(totalCount / take) || 1,
      currentPage: page,
    };

  } catch (error) {
    if (Context && Context.isContext) {
      await Context.Debug(
        { message: "Failed to fetch RFID requests.", filter, error },
        _functionName
      );
    }
    throw error;
  }
};