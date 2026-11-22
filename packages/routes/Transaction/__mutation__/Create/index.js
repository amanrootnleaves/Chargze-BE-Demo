/*
 * EXPORTS
 */
import _ from "underscore"; // NPM: Utility module.

/*
 * EXPORTS
 */
export default async (
  __,
  {
    amount,
    currency,
    status,
    type,
    gateway,
    gatewayTxnId,
    orderId,
    companyId,
    customerProfileId,
  },
  Context,
) => {
  // Error handling.
  try {
    /*
     * Only proceed if context is
     * defined else report failure.
     */
    if (Context && Context.isContext) {
      // Const assignment.
      const _functionName = "Routes -> Transaction -> Create";

      // Style guide.
      await Context.Debug({ message: "Creating transaction.." }, _functionName);

      const _transactionData = {
        amount,
        currency: currency ?? "USD",
        status: status ?? "PENDING",
        type: type ?? "PAYMENT",
        gateway: gateway ?? "MANUAL",
        gatewayTxnId,
      };

      if (orderId) _transactionData.Order = { connect: { id: orderId } };
      if (companyId) _transactionData.Company = { connect: { id: companyId } };
      if (customerProfileId)
        _transactionData.CustomerProfile = {
          connect: { id: customerProfileId },
        };

      const _TransactionCreate = await Context.DataBase.transaction.create({
        data: _transactionData,
      });

      if (_TransactionCreate instanceof Error) {
        await Context.Debug(
          {
            message: "Failed to create transaction.",
            error: _TransactionCreate,
          },
          _functionName,
        );
        return _TransactionCreate;
      }

      await Context.Debug(
        { message: "Successfully created transaction." },
        _functionName,
      );

      return {
        ..._TransactionCreate,
        message: "Successfully created the transaction",
        statusMsg: "CREATE_SUCCESSFUL",
      };
    }

    return new Error("MISSING__CONTEXT");
  } catch (error) {
    return error;
  }
};
