export default async (__, { id }, Context) => {
  const _functionName = "Routes -> FleetHubInvoice -> Query -> FleetHubInvoiceById";

  try {
    if (Context && Context.isContext) {
      await Context.Debug(
        {
          message: "Fetching single Fleet Hub Invoice by ID.",
          id,
        },
        _functionName,
      );
    }

    if (!id || id.trim() === "") {
      throw new Error("INVALID_INVOICE_ID");
    }

    const invoice = await Context.DataBase.fleetHubInvoice.findFirst({
      where: {
        id: id.trim(),
        isDeleted: false,
      },
      include: {
        fleetOwner: true,
        chargingStation: true,
      },
    });

    if (!invoice) {
      if (Context && Context.isContext) {
        await Context.Debug(
          { message: "Fleet Hub Invoice not found.", id },
          _functionName,
        );
      }
      return null;
    }

    if (Context && Context.isContext) {
      await Context.Debug(
        {
          message: "Fleet Hub Invoice fetched successfully.",
          id: invoice.id,
          invoiceNumber: invoice.invoiceNumber,
        },
        _functionName,
      );
    }

    return {
      ...invoice,
      totalSessions: invoice.totalSessions,
      totalEnergy: Number(invoice.totalEnergy || 0),
      subtotal: Number(invoice.subtotal || 0),
      gstAmount: Number(invoice.gstAmount || 0),
      totalAmount: Number(invoice.totalAmount || 0),
      fleetName: invoice.fleetOwner?.ownerName || "N/A",
      chargingHub: invoice.chargingStation?.name || "N/A",
      FleetOwner: invoice.fleetOwner,
      ChargingStation: invoice.chargingStation,
    };
  } catch (error) {
    console.error(`[${_functionName}] Error:`, error.message);
    throw error;
  }
};