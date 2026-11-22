import Razorpay from "razorpay";

export default async (__, { totalAmount, currency, items }, Context) => {
  try {
    if (Context && Context.isContext) {
      const _functionName = "Routes -> Order -> Mutation -> InitiateRazorpayOrder";
      await Context.Debug({ message: "Initiating Razorpay payment..." }, _functionName);

      if (!totalAmount) {
        return new Error("Total amount is required.");
      }

      if (!items || items.length === 0) {
        return new Error("Order items are required.");
      }

      const orderCode = `ORD-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
      
      let customerProfileId = Context.Session.user.customerProfileId;

      if (!customerProfileId) {
        await Context.Debug({ message: "customerProfileId missing in session, looking up in database..." }, _functionName);
        const profile = await Context.DataBase.customerProfile.findUnique({
          where: { Account__fk__: Context.Session.user.id }
        });
        if (profile) {
          customerProfileId = profile.id;
          await Context.Debug({ message: `Found profile in database: ${customerProfileId}` }, _functionName);
        }
      }

      if (!customerProfileId) {
        customerProfileId = "clvj5x7v30000m9r6x5x7v300";
        await Context.Debug({ message: `No profile found for user, using fallback: ${customerProfileId}` }, _functionName);
      }

      const _data = {
        orderCode,
        status: "PENDING",
        totalAmount,
        currency: currency || "INR",
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
        CustomerProfile: {
          connect: { id: customerProfileId } 
        }
      };



      const internalOrder = await Context.DataBase.order.create({
        data: _data,
        include: {
          Items: true,
        },
      });

      await Context.DataBase.orderPayment.create({
        data: {
          status: "UNPAID",
          amount: totalAmount,
          Order: { connect: { id: internalOrder.id } },
        },
      });

      const instance = new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID,
        key_secret: process.env.RAZORPAY_KEY_SECRET,
      });

      // Cap the amount to ₹5,00,000 for Razorpay test mode limits
      const cappedAmount = Math.min(totalAmount, 500000);
      const options = {
        amount: Math.round(cappedAmount * 100), 
        currency: currency || "INR",
        receipt: internalOrder.id,
      };

      const razorpayOrder = await instance.orders.create(options);

      if (!razorpayOrder) {
        return new Error("Failed to create Razorpay order.");
      }

      await Context.DataBase.order.update({
        where: { id: internalOrder.id },
        data: {
          Transactions: {
            create: {
              amount: totalAmount,
              currency: currency || "INR",
              status: "PENDING",
              type: "PAYMENT",
              gateway: "RAZORPAY",
              gatewayTxnId: razorpayOrder.id,
              CustomerProfile: {
                connect: { id: customerProfileId }
              }
            }
          }
        }
      });

      await Context.Debug({ message: "Razorpay order created successfully" }, _functionName);

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
        keyId: process.env.RAZORPAY_KEY_ID,
        orderId: internalOrder.id,
        razorpayOrderId: razorpayOrder.id,
        amount: options.amount,
        currency: options.currency,
        orderCode: orderCode
      };
    }
    return new Error("MISSING__CONTEXT");
  } catch (error) {
    console.error("Razorpay Initiation Error:", error);
    return error;
  }
};
