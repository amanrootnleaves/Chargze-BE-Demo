
import _ from "underscore"; 

export default async (
  __,
  {
    id,
    status,
    totalAmount,
    currency,
    items,
    payment,
  },
  Context,
) => {
  try {

    if (Context && Context.isContext) {
      const _functionName = "Routes -> Order -> Mutation -> Update";

      await Context.Debug({ message: "Updating order.." }, _functionName);

      if (!id) {
        return new Error("Order ID is required.");
      }

      const _data = {};
      if (!_.isEmpty(status)) {
        Object.assign(_data, { status });
        
        if (status === "DELIVERED") {
            Object.assign(_data, { deliveredAt: new Date() });
        } else if (status === "CANCELLED") {
            Object.assign(_data, { cancelledAt: new Date() });
        }
      }
      
      if (totalAmount) Object.assign(_data, { totalAmount });
      if (currency) Object.assign(_data, { currency });
      
    
      if (items && items.length > 0) {
        Object.assign(_data, {
          Items: {
            deleteMany: {},
            create: items.map((item) => ({
              quantity: item.quantity || 1,
              unitPrice: item.unitPrice,
              subtotal: item.subtotal || (item.quantity || 1) * item.unitPrice,
              ProductName: item.productName,
              ProductSku: item.productSku,
              ProductImage: item.productImage || {},
            })),
          },
        });
      }

      if (payment) {
        Object.assign(_data, {
            Payment: {
                update: {
                    status: payment.status,
                    method: payment.method,
                    amount: payment.amount,
                    transactionId: payment.transactionId,
                }
            }
        });
      }

      const _OrderUpdate = await Context.DataBase.order.update({
        where: { id },
        data: _data,
        include: {
          Items: true,
          Payment: true,
          CustomerProfile: true,
        },
      });

      if (_OrderUpdate instanceof Error) {
        await Context.Debug(
          {
            message: "Failed to update order.",
            error: _OrderUpdate,
          },
          _functionName,
        );
        return _OrderUpdate;
      }

      await Context.Debug(
        { message: "Successfully updated order." },
        _functionName,
      );

      return {
        ..._OrderUpdate,
        message: "Successfully updated the order",
        statusMsg: "UPDATE_SUCCESSFUL",
      };
    }

    return new Error("MISSING__CONTEXT");
  } catch (error) {
    return error;
  }
};
