export default async (__, { input }, Context) => {
  const _functionName = "Routes -> RfidTag -> Mutation -> CreateBulkChildRfidTags";

  try {
    if (Context && Context.isContext) {
      await Context.Debug(
        {
          message: "Initiating bulk creation of child RFID tags.",
          input,
        },
        _functionName
      );
    }

    const { parentId, fleetOwnerId, children } = input;

    // 1. Mandatory Input Validations
    if (!parentId) {
      throw new Error("PARENT_RFID_TAG_IS_REQUIRED");
    }

    if (!Array.isArray(children) || children.length === 0) {
      throw new Error("CHILDREN_LIST_CANNOT_BE_EMPTY");
    }

    // 2. Fetch and Validate Parent RFID Tag
    const parentTag = await Context.DataBase.rfidTag.findFirst({
      where: {
        id: parentId,
        isDeleted: false,
      },
    });

    if (!parentTag) {
      throw new Error("PARENT_RFID_TAG_NOT_FOUND");
    }

    if (parentTag.tagType !== "PARENT") {
      throw new Error("SPECIFIED_TAG_IS_NOT_A_PARENT");
    }

    if (parentTag.isBlocked) {
      throw new Error("CANNOT_ATTACH_CHILD_TO_BLOCKED_PARENT");
    }

    const assignedFleetId = parentTag.fleetOwner__fk__ || fleetOwnerId || null;

    if (Context && Context.isContext) {
      await Context.Debug(
        {
          message: "Parent tag verified successfully.",
          parentId: parentTag.id,
          assignedFleetId,
        },
        _functionName
      );
    }

    // 3. Duplicate checks for provided tagIds (Internal payload & Database)
    const providedTagIds = children
      .map((c) => c.tagId?.trim().toUpperCase())
      .filter(Boolean);

    const hasInternalDuplicates =
      new Set(providedTagIds).size !== providedTagIds.length;

    if (hasInternalDuplicates) {
      throw new Error("DUPLICATE_TAG_IDS_IN_REQUEST");
    }

    if (providedTagIds.length > 0) {
      const existing = await Context.DataBase.rfidTag.findFirst({
        where: {
          tagId: { in: providedTagIds },
          isDeleted: false,
        },
        select: {
          tagId: true,
        },
      });

      if (existing) {
        throw new Error(`RFID_TAG_ALREADY_EXISTS: ${existing.tagId}`);
      }
    }

    // 4. Atomic Transaction for creating Child Tags
    const createdRecords = await Context.DataBase.$transaction(
      children.map((child) =>
        Context.DataBase.rfidTag.create({
          data: {
            tagId: child.tagId?.trim().toUpperCase() || null,
            tagType: "CHILD",
            isBlocked: false,
            inTransaction: false,
            balanceAmount: 0,
            reserveAmount: 0,
            maxActiveTransactions:
              typeof child.maxActiveTransactions === "number"
                ? child.maxActiveTransactions
                : 1,
            expiryDate: new Date(child.expiryDate),
            mobileNumber: child.mobileNumber?.toString().trim() || null,
            email: child.email?.trim().toLowerCase() || null,
            parentRfid__fk__: parentTag.id,
            fleetOwner__fk__: assignedFleetId,
          },
        })
      )
    );

    const formattedOutput = createdRecords.map((tag) => ({
      ...tag,
      fleetOwnerId: tag.fleetOwner__fk__,
      parentId: tag.parentRfid__fk__,
    }));

    if (Context && Context.isContext) {
      await Context.Debug(
        {
          message: "Bulk child RFID tags created successfully.",
          count: formattedOutput.length,
          output: formattedOutput,
        },
        _functionName
      );
    }

    return formattedOutput;
  } catch (error) {
    if (Context && Context.isContext) {
      await Context.Debug(
        {
          message: "Failed to create bulk child RFID tags.",
          input,
          error: error.message || error,
        },
        _functionName
      );
    }
    throw error;
  }
};