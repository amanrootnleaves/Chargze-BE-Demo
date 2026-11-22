export default async (__, { input }, Context) => {
  const _functionName = "Routes -> RfidTag -> Mutation -> CreateRfidTag";

  try {
    if (Context && Context.isContext) {
      await Context.Debug(
        {
          message: "Creating RFID Tag.",
          input,
        },
        _functionName,
      );
    }

    const parsedExpiryDate = input.expiryDate
      ? new Date(input.expiryDate)
      : null;

    const normalizedInput = {
      ...input,
      tagId: input.tagId ? input.tagId.trim().toUpperCase() : null,
      tagType: input.tagType,
      fleetOwnerId: input.fleetOwnerId?.trim() || null,
      parentId: input.parentId?.trim() || null,
      reserveAmount:
        typeof input.reserveAmount === "number"
          ? input.reserveAmount
          : Number(input.reserveAmount) || 0,
      balanceAmount:
        typeof input.balanceAmount === "number"
          ? input.balanceAmount
          : Number(input.balanceAmount) || 0,
      maxActiveTransactions:
        input.maxActiveTransactions !== undefined
          ? Number(input.maxActiveTransactions) || 1
          : 1,
      expiryDate:
        parsedExpiryDate && !Number.isNaN(parsedExpiryDate.getTime())
          ? parsedExpiryDate
          : null,
      mobileNumber: input.mobileNumber?.toString().trim() || null,
      email: input.email?.trim().toLowerCase() || null,
    };

    if (!normalizedInput.tagType) {
      throw new Error("TAG_TYPE_IS_REQUIRED");
    }

    if (!normalizedInput.expiryDate) {
      throw new Error("EXPIRY_DATE_IS_REQUIRED");
    }

    if (normalizedInput.expiryDate < new Date()) {
      throw new Error("EXPIRY_DATE_CANNOT_BE_IN_THE_PAST");
    }

    if (normalizedInput.tagId) {
      const existingTag = await Context.DataBase.rfidTag.findFirst({
        where: {
          tagId: normalizedInput.tagId,
          isDeleted: false,
        },
        select: { id: true, tagId: true },
      });

      if (existingTag) {
        throw new Error("RFID_TAG_ALREADY_EXISTS");
      }
    }

    let assignedFleetId = normalizedInput.fleetOwnerId || null;

    if (assignedFleetId) {
      const existingFleet = await Context.DataBase.fleetOwner.findFirst({
        where: {
          id: assignedFleetId,
          isDeleted: false,
        },
        select: { id: true },
      });

      if (!existingFleet) {
        throw new Error("FLEET_OWNER_NOT_FOUND");
      }
    }

    let assignedParentId = null;

    if (normalizedInput.tagType === "CHILD") {
      if (!normalizedInput.parentId) {
        throw new Error("PARENT_RFID_REQUIRED_FOR_CHILD_TAG");
      }

      const parentTag = await Context.DataBase.rfidTag.findFirst({
        where: {
          id: normalizedInput.parentId,
          isDeleted: false,
        },
        select: {
          id: true,
          tagType: true,
          isBlocked: true,
          fleetOwner__fk__: true,
        },
      });

      if (!parentTag) {
        throw new Error("PARENT_RFID_NOT_FOUND");
      }

      if (parentTag.tagType !== "PARENT") {
        throw new Error("REFERENCED_TAG_IS_NOT_A_PARENT_TAG");
      }

      if (parentTag.isBlocked) {
        throw new Error("CANNOT_ATTACH_TO_BLOCKED_PARENT_TAG");
      }

      assignedParentId = parentTag.id;

      if (!assignedFleetId && parentTag.fleetOwner__fk__) {
        assignedFleetId = parentTag.fleetOwner__fk__;
      }
    } else if (normalizedInput.parentId) {
      throw new Error("PARENT_TAG_NOT_ALLOWED_FOR_STANDALONE_OR_PARENT_TYPE");
    }

    const newRfidTag = await Context.DataBase.rfidTag.create({
      data: {
        tagId: normalizedInput.tagId,
        tagType: normalizedInput.tagType,
        isBlocked: false,
        inTransaction: false,
        balanceAmount: normalizedInput.balanceAmount,
        reserveAmount: normalizedInput.reserveAmount,
        maxActiveTransactions: normalizedInput.maxActiveTransactions,
        expiryDate: normalizedInput.expiryDate,
        mobileNumber: normalizedInput.mobileNumber,
        email: normalizedInput.email,
        fleetOwner__fk__: assignedFleetId,
        parentRfid__fk__: assignedParentId,
      },
      include: {
        fleetOwner: true,
        parent: true,
        children: true,
        stationMappings: true,
      },
    });

    if (Context && Context.isContext) {
      await Context.Debug(
        {
          message: "RFID Tag created successfully.",
          output: newRfidTag,
        },
        _functionName,
      );
    }

    return {
      ...newRfidTag,
      fleetOwnerId: newRfidTag.fleetOwner__fk__,
      parentId: newRfidTag.parentRfid__fk__,
    };
  } catch (error) {
    if (Context && Context.isContext) {
      await Context.Debug(
        { message: "Unable to create RFID Tag.", input, error },
        _functionName,
      );
    }

    throw error;
  }
};
