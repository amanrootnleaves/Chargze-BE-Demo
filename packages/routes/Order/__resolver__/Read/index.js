/*
 * EXPORTS
 */
import _ from "underscore"; // NPM: Utility module.

/*
 * EXPORTS
 */
export default async (
  __,
  { orderId, orderCode, status, take, skip },
  Context,
) => {
  // Error handling.
  try {
    /*
     * Only proceed if context is
     * defined else report failure.
     */
    if (Context && Context.isContext) {
      // Variable assignment.
      const _whatToQuery = { isDeleted: false };

      // Const assignment.
      const _functionName = "Routes ->   -> Read";

      // Variable assignment.
      take = take ?? 10;
      skip = skip ?? 0;

      // Style guide.
      await Context.Debug(
        { message: "Searching order details.." },
        _functionName,
      );

      // Conditional query based on args.
      if (!_.isEmpty(orderId)) Object.assign(_whatToQuery, { id: orderId });
      if (!_.isEmpty(orderCode))
        Object.assign(_whatToQuery, {
          orderCode: { startsWith: orderCode, mode: "insensitive" },
        });
      // Filter by status.
      if (!_.isEmpty(status)) {
        if (Context.Session.user.accountType === "CUSTOMER") {
          if (status === "ACTIVE") {
            Object.assign(_whatToQuery, {
              status: { in: ["PENDING", "PROCESSING", "SHIPPED"] },
            });
          } else if (status === "COMPLETED") {
            Object.assign(_whatToQuery, { status: "DELIVERED" });
          } else {
            Object.assign(_whatToQuery, { status: status });
          }
        } else {
          Object.assign(_whatToQuery, { status: status });
        }
      } else if (Context.Session.user.accountType === "CUSTOMER") {
        // By default, exclude CANCELLED and REFUNDED for customers as per request
        Object.assign(_whatToQuery, {
          status: { notIn: ["CANCELLED", "REFUNDED"] },
        });
      }

      // Filter by Company/Account if applicable
      if (Context.Session.user.accountType === "CUSTOMER") {
        const _CustomerProfileFindUnique =
          await Context.DataBase.customerProfile.findUnique({
            where: { Account__fk__: Context.Session.user.id },
          });

        if (!_CustomerProfileFindUnique) {
          await Context.Debug(
            { message: "Customer profile not found for account." },
            _functionName,
          );
          return new Error("CUSTOMER_PROFILE_NOT_FOUND");
        }

        Object.assign(_whatToQuery, {
          CustomerProfile__fk__: _CustomerProfileFindUnique.id,
        });
      } else if (Context.Session.user.accountType === "COMPANY") {
        // Company filtering could go here
      }

      const _totalCount = await Context.DataBase.order.count({
        where: _whatToQuery,
      });

      if (_totalCount instanceof Error) {
        await Context.Debug(
          {
            message: "Failed to get count of order details.",
            error: _totalCount,
          },
          _functionName,
        );
        return _totalCount;
      }

      const _OrderFindMany = await Context.DataBase.order.findMany({
        where: _whatToQuery,
        select: {
          id: true,
          createdAt: true,
          updatedAt: true,
          orderCode: true,
          status: true,
          totalAmount: true,
          currency: true,
          orderedAt: true,
          cancelledAt: true,
          deliveredAt: true,
          CustomerProfile: {
            select: {
              id: true,
              customerCode: true,
              status: true,
              Account: {
                select: {
                  displayName: true,
                  email: true,
                },
              },
            },
          },
          Items: {
            select: {
              id: true,
              quantity: true,
              unitPrice: true,
              subtotal: true,
              ProductName: true,
              ProductSku: true,
              ProductImage: true,
            },
          },
          Payment: {
            select: {
              status: true,
              method: true,
              amount: true,
              transactionId: true,
              paidAt: true,
            },
          },
        },
        orderBy: {
          orderedAt: "desc",
        },
        take,
        skip,
      });

      if (0 < _OrderFindMany?.length && !(_OrderFindMany instanceof Error)) {
        await Context.Debug(
          { message: "Successfully got given order details." },
          _functionName,
        );
        return _OrderFindMany?.map((j) => {
          let _status = j.status;
          if (Context.Session.user.accountType === "CUSTOMER") {
            if (["PENDING", "PROCESSING", "SHIPPED"].includes(j.status)) {
              _status = "ACTIVE";
            } else if (j.status === "DELIVERED") {
              _status = "COMPLETED";
            }
          }

          return {
            ...j,
            status: _status,
            _totalCount,
            message: "Successfully read the orders",
            statusMsg: "READ_SUCCESSFUL",
          };
        });
      }

      await Context.Debug(
        { message: `Failed to get order details.`, error: _OrderFindMany },
        _functionName,
      );
      return _OrderFindMany instanceof Error ? _OrderFindMany : []; // Return empty array if not found, consistent with list query
    }

    return new Error("MISSING__CONTEXT");
  } catch (error) {
    return error;
  }
};
