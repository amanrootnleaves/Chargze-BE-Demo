const vehicleModels = [
  {
    id: "1",
    brand: "Tata",
    model: "Nexon EV",
    chargerType: "CCS2",
  },
  {
    id: "2",
    brand: "Tata",
    model: "Punch EV",
    chargerType: "CCS2",
  },
  {
    id: "3",
    brand: "Mahindra",
    model: "XUV400",
    chargerType: "CCS2",
  },
  {
    id: "4",
    brand: "MG",
    model: "ZS EV",
    chargerType: "CCS2",
  },
];

export default async (_, { brand, searchText }, Context) => {
  const _functionName =
    "Routes -> CustomerVehicle -> Resolver -> ReadVehicleModels";

  try {
    await Context.Debug(
      {
        message: "Reading vehicle models.",
        brand,
        searchText,
      },
      _functionName,
    );

    let vehicles = vehicleModels;

    if (brand) {
      vehicles = vehicles.filter(
        (item) => item.brand.toLowerCase() === brand.toLowerCase(),
      );
    }

    if (searchText) {
      vehicles = vehicles.filter((item) =>
        item.model.toLowerCase().includes(searchText.toLowerCase()),
      );
    }
await Context.Debug(
      {
        message: "Vehicle models fetched",
        brand,
        searchText,
      },
      _functionName,
    );
    return vehicles || [];
  } catch (error) {
    await Context.Debug(
      {
        message: "Error while fetching models",
      },
      _functionName,
    );
    throw error;
  }
};