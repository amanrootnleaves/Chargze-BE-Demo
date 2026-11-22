export default async (__, { id, input }, Context) => {
  const _functionName =
    "Routes -> FleetOwner -> Mutation -> UpdateFleetOwnerProfile";

  try {
    if (Context && Context.isContext) {
      await Context.Debug(
        {
          message: "Updating Fleet Owner Profile.",
          id,
          input,
        },
        _functionName,
      );
    }

    // 1. Check if Fleet Owner exists
    const _currentFleet = await Context.DataBase.fleetOwner.findFirst({
      where: {
        id,
        isDeleted: false,
      },
    });

    if (!_currentFleet) {
      throw new Error("FLEET_OWNER_NOT_FOUND");
    }

    // 2. Normalize Partial Input
    const normalizedData = {};

    if (input.ownerName !== undefined) normalizedData.ownerName = input.ownerName?.trim();
    if (input.status !== undefined) normalizedData.status = input.status;
    if (input.onboardingDate !== undefined) normalizedData.onboardingDate = input.onboardingDate;
    if (input.closedDate !== undefined) normalizedData.closedDate = input.closedDate ? new Date(input.closedDate) : null;

    if (input.poc !== undefined) normalizedData.poc = input.poc?.trim();
    if (input.email !== undefined) normalizedData.email = input.email?.trim().toLowerCase();
    if (input.mobileNo !== undefined) normalizedData.mobileNo = input.mobileNo?.toString().trim();

    if (input.addressLine1 !== undefined) normalizedData.addressLine1 = input.addressLine1?.trim();
    if (input.addressLine2 !== undefined) normalizedData.addressLine2 = input.addressLine2?.trim() ?? null;
    if (input.pincode !== undefined) normalizedData.pincode = input.pincode?.toString().trim();
    if (input.city !== undefined) normalizedData.city = input.city?.trim();
    if (input.state !== undefined) normalizedData.state = input.state?.trim();

    if (input.paymentTerms !== undefined) normalizedData.paymentTerms = input.paymentTerms;
    if (input.payoutDay !== undefined) normalizedData.payoutDay = input.payoutDay?.trim() ?? null;

    if (input.entityName !== undefined) normalizedData.entityName = input.entityName?.trim() ?? null;
    if (input.entityType !== undefined) normalizedData.entityType = input.entityType;
    if (input.gstNumber !== undefined) normalizedData.gstNumber = input.gstNumber?.trim().toUpperCase();

    if (input.gstDocUrl !== undefined) {
      normalizedData.gstDocUrl = input.gstDocUrl
        ? (input.gstDocUrl.href || input.gstDocUrl.toString()).trim()
        : null;
    }

    if (input.agreementDocUrl !== undefined) {
      normalizedData.agreementDocUrl = input.agreementDocUrl
        ? (input.agreementDocUrl.href || input.agreementDocUrl.toString()).trim()
        : null;
    }

    // 3. GST Number Validation (If provided or modified)
    if (normalizedData.gstNumber) {
      const _gstRegex =
        /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
      if (!_gstRegex.test(normalizedData.gstNumber)) {
        throw new Error("INVALID_GST_NUMBER");
      }
    }

    // 4. Date Validation
    const effectiveOnboardingDate =
      normalizedData.onboardingDate !== undefined
        ? new Date(normalizedData.onboardingDate)
        : new Date(_currentFleet.onboardingDate);

    const effectiveClosedDate =
      normalizedData.closedDate !== undefined
        ? normalizedData.closedDate
        : _currentFleet.closedDate;

    if (
      effectiveClosedDate &&
      new Date(effectiveClosedDate) < effectiveOnboardingDate
    ) {
      throw new Error("CLOSED_DATE_CANNOT_BE_BEFORE_ONBOARDING_DATE");
    }

    // 5. Duplicate Checks (Exclude current Fleet Owner by id)
    const duplicateConditions = [];

    if (normalizedData.ownerName && normalizedData.ownerName.toLowerCase() !== _currentFleet.ownerName.toLowerCase()) {
      duplicateConditions.push({
        ownerName: { equals: normalizedData.ownerName, mode: "insensitive" },
      });
    }

    if (normalizedData.email && normalizedData.email !== _currentFleet.email) {
      duplicateConditions.push({ email: normalizedData.email });
    }

    if (normalizedData.mobileNo && normalizedData.mobileNo !== _currentFleet.mobileNo) {
      duplicateConditions.push({ mobileNo: normalizedData.mobileNo });
    }

    if (normalizedData.gstNumber && normalizedData.gstNumber !== _currentFleet.gstNumber) {
      duplicateConditions.push({ gstNumber: normalizedData.gstNumber });
    }

    if (duplicateConditions.length > 0) {
      const _existingFleet = await Context.DataBase.fleetOwner.findFirst({
        where: {
          isDeleted: false,
          id: { not: id },
          OR: duplicateConditions,
        },
      });

      if (_existingFleet) {
        if (
          normalizedData.ownerName &&
          _existingFleet.ownerName.toLowerCase() === normalizedData.ownerName.toLowerCase()
        ) {
          throw new Error("FLEET_OWNER_NAME_ALREADY_EXISTS");
        }
        if (normalizedData.email && _existingFleet.email === normalizedData.email) {
          throw new Error("EMAIL_ALREADY_EXISTS");
        }
        if (normalizedData.mobileNo && _existingFleet.mobileNo === normalizedData.mobileNo) {
          throw new Error("MOBILE_NUMBER_ALREADY_EXISTS");
        }
        if (normalizedData.gstNumber && _existingFleet.gstNumber === normalizedData.gstNumber) {
          throw new Error("GST_NUMBER_ALREADY_EXISTS");
        }
        throw new Error("FLEET_OWNER_ALREADY_EXISTS");
      }
    }

    // 6. Update Fleet Owner Record
    const _updatedFleetOwner = await Context.DataBase.fleetOwner.update({
      where: { id },
      data: normalizedData,
      include: {
        rfidTags: true,
      },
    });

    if (Context && Context.isContext) {
      await Context.Debug(
        {
          message: "Fleet Owner profile updated successfully.",
          output: _updatedFleetOwner,
        },
        _functionName,
      );
    }

    return _updatedFleetOwner;
  } catch (error) {
    if (Context && Context.isContext) {
      await Context.Debug(
        { message: "Unable to update Fleet Owner profile.", id, input, error },
        _functionName,
      );
    }

    throw error;
  }
};