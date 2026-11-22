export default async (__, { id }, Context) => {
  const _functionName = "Routes -> FleetHubInvoice -> Mutation -> FleetHubInvoiceMarkAsPaid";

  try {
    if (Context && Context.isContext) {
      await Context.Debug(
        {
          message: "Executing FleetHubInvoiceMarkAsPaid mutation.",
          id,
        },
        _functionName,
      );
    }

    if (!id || id.trim() === "") {
      throw new Error("INVALID_INVOICE_ID");
    }

    // 1. Verify existence of invoice
    const existingInvoice = await Context.DataBase.fleetHubInvoice.findFirst({
      where: {
        id: id.trim(),
        isDeleted: false,
      },
    });

    if (!existingInvoice) {
      throw new Error("INVOICE_NOT_FOUND");
    }

    if (existingInvoice.status === "PAID") {
      throw new Error("INVOICE_ALREADY_PAID");
    }

    // 2. Update status to PAID with timestamp
    const updatedInvoice = await Context.DataBase.fleetHubInvoice.update({
      where: {
        id: existingInvoice.id,
      },
      data: {
        status: "PAID",
      },
      include: {
        fleetOwner: true,
        chargingStation: true,
      },
    });

    if (Context && Context.isContext) {
      await Context.Debug(
        {
          message: "Invoice marked as PAID successfully.",
          id: updatedInvoice.id,
          invoiceNumber: updatedInvoice.invoiceNumber,
        },
        _functionName,
      );
    }

    // 3. Return response conforming to GraphQL schema types
    return {
      ...updatedInvoice,
      totalSessions: updatedInvoice.totalSessions,
      totalEnergy: Number(updatedInvoice.totalEnergy || 0),
      subtotal: Number(updatedInvoice.subtotal || 0),
      gstAmount: Number(updatedInvoice.gstAmount || 0),
      totalAmount: Number(updatedInvoice.totalAmount || 0),
      FleetOwner: updatedInvoice.fleetOwner,
      ChargingStation: updatedInvoice.chargingStation,
    };
  } catch (error) {
    console.error(`[${_functionName}] Error:`, error.message);
    throw error;
  }
};