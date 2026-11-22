
import _ from "underscore"; 


export default async (
  __,
  { id, gatewayTxnId, status, take, skip },
  Context,
) => {
  try {

    if (Context && Context.isContext) {
      const _whatToQuery = { isDeleted: false };

      const _functionName = "Routes -> Transaction -> Read";

      take = take ?? 10;
      skip = skip ?? 0;

      await Context.Debug(
        { message: "Searching transaction details.." },
        _functionName,
      );

      if (!_.isEmpty(id)) Object.assign(_whatToQuery, { id });
      if (!_.isEmpty(gatewayTxnId))
        Object.assign(_whatToQuery, { gatewayTxnId });
      if (!_.isEmpty(status)) Object.assign(_whatToQuery, { status });

      const _totalCount = await Context.DataBase.transaction.count({
        where: _whatToQuery,
      });

      if (_totalCount instanceof Error) {
        await Context.Debug(
          {
            message: "Failed to get count of transaction details.",
            error: _totalCount,
          },
          _functionName,
        );
        return _totalCount;
      }

      const _TransactionFindMany = await Context.DataBase.transaction.findMany({
        where: _whatToQuery,
        include: {
          Order: {
            include: {
              CustomerProfile: {
                include: {
                  Account: true,
                },
              },
            },
          },
          Company: true,
          CustomerProfile: {
            include: {
              Account: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
        take,
        skip,
      });

      if (
        0 < _TransactionFindMany?.length &&
        !(_TransactionFindMany instanceof Error)
      ) {
        await Context.Debug(
          { message: "Successfully got given transaction details." },
          _functionName,
        );
        return _TransactionFindMany?.map((j) => ({
          ...j,
          CustomerProfile: j.CustomerProfile || j.Order?.CustomerProfile,
          _totalCount,
          message: "Successfully read the transactions",
          statusMsg: "READ_SUCCESSFUL",
        }));
      }

      await Context.Debug(
        {
          message: `Failed to get transaction details.`,
          error: _TransactionFindMany,
        },
        _functionName,
      );
      return _TransactionFindMany instanceof Error ? _TransactionFindMany : [];
    }

    return new Error("MISSING__CONTEXT");
  } catch (error) {
    return error;
  }
};
