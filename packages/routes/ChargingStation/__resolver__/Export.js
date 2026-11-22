import { generateBase64Export } from "../../../dyna_modules/Utils/index";
import { getCreatedAtFilter } from "../../../dyna_modules/Utils/dateFilter";

export default async (__, { dateFilter, format }, Context) => {
  const functionName = "Routes -> ChargingStation -> Query -> ExportChargingStations";

  try {
    if (!Context || !Context.isContext) {
      throw new Error("MISSING__CONTEXT");
    }

    await Context.Debug(
      { message: "Exporting charging stations.", dateFilter, format },
      functionName,
    );

    const createdAtFilter = getCreatedAtFilter(dateFilter);
    const stations = await Context.DataBase.chargingStation.findMany({
      where: {
        isDeleted: false,
        ...(createdAtFilter ? { createdAt: createdAtFilter } : {}),
      },
      orderBy: { createdAt: "desc" },
      include: {
        Company: true,
        StationOwner: true,
        Chargers: {
          include: {
            Connectors: true,
          },
        },
      },
    });

    const exportData = stations.map((station, index) => ({
      sNo: index + 1,
      stationId: station.stationId || "N/A",
      name: station.name || "N/A",
      type: station.type || "N/A",
      status: station.status || "N/A",
      address: station.address || station.addressLine1 || "N/A",
      city: station.city || "N/A",
      state: station.state || "N/A",
      pincode: station.pincode || "N/A",
      chargerCount: station.Chargers?.length || 0,
      chargers: station.Chargers?.map((charger) => charger.name || charger.chargeboxId)
        .filter(Boolean)
        .join(", ") || "N/A",
      ownership: station.ownership || "N/A",
      accessType: station.accessType || "N/A",
      company: station.Company?.displayName || "N/A",
      stationOwner: station.StationOwner?.ownerName || "N/A",
      poc: station.poc || "N/A",
      pocEmail: station.pocEmail || "N/A",
      pocMobile: station.pocMobile || "N/A",
      createdAt: station.createdAt
        ? new Date(station.createdAt).toLocaleDateString("en-GB")
        : "N/A",
    }));

    const columns = [
      { header: "#", key: "sNo", width: 8 },
      { header: "Station ID", key: "stationId", width: 18 },
      { header: "Station Name", key: "name", width: 24 },
      { header: "Type", key: "type", width: 16 },
      { header: "Status", key: "status", width: 16 },
      { header: "Address", key: "address", width: 28 },
      { header: "City", key: "city", width: 18 },
      { header: "State", key: "state", width: 18 },
      { header: "Pincode", key: "pincode", width: 12 },
      { header: "Charger Count", key: "chargerCount", width: 16 },
      { header: "Chargers", key: "chargers", width: 28 },
      { header: "Ownership", key: "ownership", width: 16 },
      { header: "Access Type", key: "accessType", width: 18 },
      { header: "Company", key: "company", width: 24 },
      { header: "Station Owner", key: "stationOwner", width: 24 },
      { header: "POC", key: "poc", width: 22 },
      { header: "POC Email", key: "pocEmail", width: 28 },
      { header: "POC Mobile", key: "pocMobile", width: 18 },
      { header: "Created At", key: "createdAt", width: 16 },
    ];

    const fileFormat = format.toUpperCase();
    const base64String = await generateBase64Export(
      exportData,
      columns,
      fileFormat,
      "Charging Stations Report",
    );
    const extension = fileFormat === "EXCEL" ? "xlsx" : "pdf";
    const mimeType =
      fileFormat === "EXCEL"
        ? "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        : "application/pdf";

    await Context.Debug(
      { message: "Charging stations exported successfully.", count: stations.length },
      functionName,
    );

    return {
      base64String,
      fileName: `Charging_Stations_${Date.now()}.${extension}`,
      mimeType,
    };
  } catch (error) {
    if (Context && Context.isContext) {
      await Context.Debug(
        { message: "Failed to export charging stations.", dateFilter, format, error },
        functionName,
      );
    }

    throw error;
  }
};
