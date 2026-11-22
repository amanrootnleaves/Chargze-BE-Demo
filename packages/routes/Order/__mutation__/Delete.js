
export default async (
  __,
  {
    orderIds,
  },
  Context,
) => {
  try {
    if (Context && Context.isContext) {
      const _functionName = "Routes -> Order -> Mutation -> Delete";

      await Context.Debug({ message: "Deleting order(s).." }, _functionName);

      if (!orderIds || orderIds.length === 0) {
        return new Error("Order IDs are required.");
      }

      const _OrderDelete = await Context.DataBase.order.updateMany({
        where: {
          id: {
            in: orderIds,
          },
        },
        data: {
          isDeleted: true,
        },
      });

      if (_OrderDelete instanceof Error) {
        await Context.Debug(
          {
            message: "Failed to delete order(s).",
            error: _OrderDelete,
          },
          _functionName,
        );
        return _OrderDelete;
      }

      await Context.Debug(
        { message: "Successfully deleted order(s)." },
        _functionName,
      );

      return {
        message: `Successfully deleted ${_OrderDelete.count} order(s)`,
        statusMsg: "DELETE_SUCCESSFUL",
      };
    }

    return new Error("MISSING__CONTEXT");
  } catch (error) {
    return error;
  }
};
