
import _ from "underscore"; 


export default async (
  __,
  {
    orderCode,
    status,
    totalAmount,
    currency,
    items,
    payment,
    companyId,
    customerProfileId,
  },
  Context,
) => {
  try {

    if (Context && Context.isContext) {
      const _functionName = "Routes -> Order -> Mutation -> Create";

      await Context.Debug({ message: "Creating new order.." }, _functionName);

      if (!totalAmount) {
        return new Error("Total amount is required.");
      }

      if (!items || items.length === 0) {
        return new Error("Order must have at least one item.");
      }

      if (!orderCode) {
        orderCode = `ORD-${String.random(8).toUpperCase()}`;
      }

      const _data = {
        orderCode,
        status: status || "PENDING",
        totalAmount,
        currency: currency || "USD",
        orderedAt: new Date(),
        Items: {
          create: items.map((item) => ({
            quantity: item.quantity || 1,
            unitPrice: item.unitPrice,
            subtotal: item.subtotal || (item.quantity || 1) * item.unitPrice,
            ProductName: item.productName,
            ProductSku: item.productSku,
            ProductImage: item.productImage || {},
          })),
        },
      };

      if (payment) {
        _data.Payment = {
          create: {
            status: payment.status || "UNPAID",
            method: payment.method,
            amount: payment.amount || totalAmount, 
            transactionId: payment.transactionId,
          },
        };
      }

      if (companyId) {
        _data.Company = {
          connect: { id: companyId },
        };
      } else if (Context.Session.user.accountType === "COMPANY") {

      }

      if (customerProfileId) {
        _data.CustomerProfile = {
          connect: { id: customerProfileId },
        };
      }

      const _OrderCreate = await Context.DataBase.order.create({
        data: _data,
        include: {
          Items: true,
          Payment: true,
          CustomerProfile: true,
        },
      });

      if (_OrderCreate instanceof Error) {
        await Context.Debug(
          {
            message: "Failed to create order.",
            error: _OrderCreate,
          },
          _functionName,
        );
        return _OrderCreate;
      }

      await Context.Debug(
        { message: "Successfully created order." },
        _functionName,
      );

      if (customerProfileId) {
        try {
          await Context.DataBase.customerProfile.update({
            where: { id: customerProfileId },
            data: {
              totalOrders: { increment: 1 },
              totalSpend: { increment: totalAmount },
              lastOrderAt: new Date(),
            },
          });
          await Context.Debug(
            { message: "Successfully updated customer profile stats." },
            _functionName,
          );
        } catch (updateError) {
          await Context.Debug(
            {
              message: "Failed to update customer profile stats.",
              error: updateError,
            },
            _functionName,
          );
        }
      }

      return {
        ..._OrderCreate,
        message: "Successfully created the order",
        statusMsg: "CREATE_SUCCESSFUL",
      };
    }

    return new Error("MISSING__CONTEXT");
  } catch (error) {
    return error;
  }
};
