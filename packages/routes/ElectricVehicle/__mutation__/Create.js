import _ from "underscore";

export default async (
  __,
  {
    vehicleName,
    brand,
    model,
    variant,
    year,
    vehicleType,
    category,
    bodyType,
    exShowroomPrice,
    onRoadPrice,
    salePrice,
    discountPercent,
    batteryCapacity,
    batteryType,
    batteryVoltage,
    chargingTimeAC,
    chargingTimeDC,
    chargerType,
    fastCharging,
    rangeKm,
    topSpeedKmph,
    motorPowerKW,
    motorTorqueNm,
    abs,
    Abs,
    cruiseControl,
    reverseMode,
    regenerativeBraking,
    navigation,
    bluetooth,
    gps,
    usbCharging,
    mobileApp,
    antiTheft,
    stock,
    images,
    colors,
    brochure,
    videos,
    description,
    specifications,
    features,
    companyId,
  },
  Context,
) => {
  try {
    if (Context && Context.isContext) {
      const _functionName = "Routes -> ElectricVehicle -> Mutation -> Create";

      await Context.Debug({ message: "Creating new electric vehicle.." }, _functionName);

      if (!vehicleName || !brand || !model || !vehicleType || exShowroomPrice === undefined) {
        return new Error("Required fields: vehicleName, brand, model, vehicleType, exShowroomPrice");
      }

      const _data = {
        vehicleName,
        brand,
        model,
        vehicleType,
        exShowroomPrice,
      };

      if (variant !== undefined) _data.variant = variant;
      if (year !== undefined) _data.year = year;
      if (category !== undefined) _data.category = category;
      if (bodyType !== undefined) _data.bodyType = bodyType;
      if (onRoadPrice !== undefined) _data.onRoadPrice = onRoadPrice;
      if (salePrice !== undefined) _data.salePrice = salePrice;
      if (discountPercent !== undefined) _data.discountPercent = discountPercent;
      if (batteryCapacity !== undefined) _data.batteryCapacity = batteryCapacity;
      if (batteryType !== undefined) _data.batteryType = batteryType;
      if (batteryVoltage !== undefined) _data.batteryVoltage = batteryVoltage;
      if (chargingTimeAC !== undefined) _data.chargingTimeAC = chargingTimeAC;
      if (chargingTimeDC !== undefined) _data.chargingTimeDC = chargingTimeDC;
      if (chargerType !== undefined) _data.chargerType = chargerType;
      if (fastCharging !== undefined) _data.fastCharging = fastCharging;
      if (rangeKm !== undefined) _data.rangeKm = rangeKm;
      if (topSpeedKmph !== undefined) _data.topSpeedKmph = topSpeedKmph;
      if (motorPowerKW !== undefined) _data.motorPowerKW = motorPowerKW;
      if (motorTorqueNm !== undefined) _data.motorTorqueNm = motorTorqueNm;
      
      const finalAbs = abs !== undefined ? abs : (Abs !== undefined ? Abs : false);
      _data.abs = finalAbs;

      if (cruiseControl !== undefined) _data.cruiseControl = cruiseControl;
      if (reverseMode !== undefined) _data.reverseMode = reverseMode;
      if (regenerativeBraking !== undefined) _data.regenerativeBraking = regenerativeBraking;
      if (navigation !== undefined) _data.navigation = navigation;
      if (bluetooth !== undefined) _data.bluetooth = bluetooth;
      if (gps !== undefined) _data.gps = gps;
      if (usbCharging !== undefined) _data.usbCharging = usbCharging;
      if (mobileApp !== undefined) _data.mobileApp = mobileApp;
      if (antiTheft !== undefined) _data.antiTheft = antiTheft;
      if (stock !== undefined) _data.stock = stock;
      if (images !== undefined) _data.images = images;
      if (colors !== undefined) _data.colors = colors;
      if (brochure !== undefined) _data.brochure = brochure;
      if (videos !== undefined) _data.videos = videos;
      if (description !== undefined) _data.description = description;
      if (specifications !== undefined) _data.specifications = specifications;
      if (features !== undefined) _data.features = features;

      if (companyId) {
        _data.Company = {
          connect: { id: companyId },
        };
      } else if (Context.user && Context.user.companyId) {
        _data.Company = {
          connect: { id: Context.user.companyId },
        };
      }

      const createdEV = await Context.DataBase.electricVehicle.create({
        data: _data,
      });

      if (createdEV instanceof Error) {
        await Context.Debug(
          {
            message: "Failed to create electric vehicle.",
            error: createdEV,
          },
          _functionName,
        );
        return createdEV;
      }

      await Context.Debug(
        { message: "Successfully created electric vehicle." },
        _functionName,
      );

      return {
        ...createdEV,
        exShowroomPrice: createdEV.exShowroomPrice ? Number(createdEV.exShowroomPrice) : null,
        onRoadPrice: createdEV.onRoadPrice ? Number(createdEV.onRoadPrice) : null,
        salePrice: createdEV.salePrice ? Number(createdEV.salePrice) : null,
        discountPercent: createdEV.discountPercent ? Number(createdEV.discountPercent) : null,
        motorPowerKW: createdEV.motorPowerKW ? Number(createdEV.motorPowerKW) : null,
        motorTorqueNm: createdEV.motorTorqueNm ? Number(createdEV.motorTorqueNm) : null,
        message: "Successfully created the electric vehicle",
        statusMsg: "CREATE_SUCCESSFUL",
      };
    }

    return new Error("MISSING__CONTEXT");
  } catch (error) {
    return error;
  }
};
