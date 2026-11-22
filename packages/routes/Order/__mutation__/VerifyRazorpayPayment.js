import crypto from "crypto";

export default async (__, { razorpayOrderId, razorpayPaymentId, razorpaySignature, orderId }, Context) => {
  try {
    if (Context && Context.isContext) {
      const _functionName = "Routes -> Order -> Mutation -> VerifyRazorpayPayment";
      await Context.Debug({ message: "Verifying Razorpay payment..." }, _functionName);

      const secret = process.env.RAZORPAY_KEY_SECRET;
      const body = razorpayOrderId + "|" + razorpayPaymentId;
      const expectedSignature = crypto
        .createHmac("sha256", secret)
        .update(body.toString())
        .digest("hex");

      if (expectedSignature !== razorpaySignature) {
        await Context.Debug({ message: "Invalid Razorpay signature" }, _functionName);
        return new Error("Invalid payment signature.");
      }

      await Context.DataBase.transaction.update({
        where: { gatewayTxnId: razorpayOrderId },
        data: {
          status: "SUCCESS",
          paidAt: new Date(),
          gatewayResponse: { razorpayPaymentId, razorpaySignature }
        }
      });

      await Context.DataBase.orderPayment.upsert({
        where: { Order__fk__: orderId },
        update: {
          status: "PAID",
          transactionId: razorpayPaymentId,
          paidAt: new Date(),
        },
        create: {
          status: "PAID",
          amount: 0,
          transactionId: razorpayPaymentId,
          paidAt: new Date(),
          Order: { connect: { id: orderId } },
        },
      });

      const updatedOrder = await Context.DataBase.order.update({
        where: { id: orderId },
        data: { status: "PROCESSING" },
        include: {
          Payment: true,
          Items: true
        }
      });

      await Context.Debug({ message: "Payment verified and order updated" }, _functionName);

      return {
        success: true,
        message: "Payment successful",
        order: updatedOrder
      };
    }
    return new Error("MISSING__CONTEXT");
  } catch (error) {
    console.error("Razorpay Verification Error:", error);
    return error;
  }
};
