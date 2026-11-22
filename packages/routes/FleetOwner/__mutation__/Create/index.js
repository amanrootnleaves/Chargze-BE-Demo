export default async (__, { input }, Context) => {
  const _functionName = "Routes -> FleetOwner -> Mutation -> CreateFleetOwner";

  try {
    if (Context && Context.isContext) {
      await Context.Debug(
        {
          message: "Creating Fleet Owner.",
          input,
        },
        _functionName,
      );
    }

    // Normalize Input
    const normalizedInput = {
      ...input,
      ownerName: input.ownerName?.trim(),
      poc: input.poc?.trim(),
      email: input.email?.trim().toLowerCase(),
      mobileNo: input.mobileNo?.toString().trim(),
      addressLine1: input.addressLine1?.trim(),
      addressLine2: input.addressLine2?.trim(),
      pincode: input.pincode?.toString().trim(),
      city: input.city?.trim(),
      state: input.state?.trim(),
      paymentTerms: input.paymentTerms ?? "PREPAID",
      payoutDay: input.payoutDay?.trim(),
      entityName: input.entityName?.trim(),
      entityType: input.entityType ?? "PRIVATE_LIMITED",
      gstNumber: input.gstNumber?.trim().toUpperCase(),
      gstDocUrl: input.gstDocUrl
        ? (input.gstDocUrl.href || input.gstDocUrl.toString()).trim()
        : null,
      agreementDocUrl: input.agreementDocUrl
        ? (
            input.agreementDocUrl.href || input.agreementDocUrl.toString()
          ).trim()
        : null,
    };

    // GST Number Validation (Standard 15-digit GSTIN)
    const _gstRegex =
      /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
    if (!_gstRegex.test(normalizedInput.gstNumber)) {
      throw new Error("INVALID_GST_NUMBER");
    }

    // Date Validation
    if (
      normalizedInput.closedDate &&
      new Date(normalizedInput.closedDate) <
        new Date(normalizedInput.onboardingDate)
    ) {
      throw new Error("CLOSED_DATE_CANNOT_BE_BEFORE_ONBOARDING_DATE");
    }

    // Duplicate Validation
    const _existingFleet = await Context.DataBase.fleetOwner.findFirst({
      where: {
        isDeleted: false,
        OR: [
          {
            ownerName: {
              equals: normalizedInput.ownerName,
              mode: "insensitive",
            },
          },
          {
            email: normalizedInput.email,
          },
          {
            mobileNo: normalizedInput.mobileNo,
          },
          {
            gstNumber: normalizedInput.gstNumber,
          },
        ],
      },
    });

    if (_existingFleet) {
      if (
        _existingFleet.ownerName.toLowerCase() ===
        normalizedInput.ownerName.toLowerCase()
      ) {
        throw new Error("FLEET_OWNER_NAME_ALREADY_EXISTS");
      }
      if (_existingFleet.email === normalizedInput.email) {
        throw new Error("EMAIL_ALREADY_EXISTS");
      }
      if (_existingFleet.mobileNo === normalizedInput.mobileNo) {
        throw new Error("MOBILE_NUMBER_ALREADY_EXISTS");
      }
      if (_existingFleet.gstNumber === normalizedInput.gstNumber) {
        throw new Error("GST_NUMBER_ALREADY_EXISTS");
      }
      throw new Error("FLEET_OWNER_ALREADY_EXISTS");
    }

    // Sequential 3-digit Fleet ID generation & record creation
    const _fleetOwner = await Context.DataBase.$transaction(async (tx) => {
      const fleets = await tx.fleetOwner.findMany({
        select: { fleetId: true },
      });

      const lastNumber = Math.max(
        0,
        ...fleets
          .map((fleet) => Number.parseInt(fleet.fleetId, 10))
          .filter(Number.isFinite),
      );

      const fleetId = String(lastNumber + 1).padStart(3, "0");

      return tx.fleetOwner.create({
        data: {
          fleetId,
          ownerName: normalizedInput.ownerName,
          status: normalizedInput.status ?? "ONBOARDED",
          onboardingDate: normalizedInput.onboardingDate,
          closedDate: normalizedInput.closedDate ?? null,

          poc: normalizedInput.poc,
          email: normalizedInput.email,
          mobileNo: normalizedInput.mobileNo,

          addressLine1: normalizedInput.addressLine1,
          addressLine2: normalizedInput.addressLine2 ?? null,
          pincode: normalizedInput.pincode,
          city: normalizedInput.city,
          state: normalizedInput.state,

          paymentTerms: normalizedInput.paymentTerms,
          payoutDay: normalizedInput.payoutDay ?? null,

          entityName: normalizedInput.entityName ?? null,
          entityType: normalizedInput.entityType,
          gstNumber: normalizedInput.gstNumber,
          gstDocUrl: normalizedInput.gstDocUrl ?? null,
          agreementDocUrl: normalizedInput.agreementDocUrl ?? null,
        },
        include: {
          rfidTags: true,
        },
      });
    });

    if (Context && Context.isContext) {
      await Context.Debug(
        {
          message: "Fleet Owner created successfully.",
          output: _fleetOwner,
        },
        _functionName,
      );
    }

    return _fleetOwner;
  } catch (error) {
    if (Context && Context.isContext) {
      await Context.Debug(
        { message: "Unable to create Fleet Owner.", input, error },
        _functionName,
      );
    }

    throw error;
  }
};
