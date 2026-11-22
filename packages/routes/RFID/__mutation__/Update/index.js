export default async (__, { input }, Context) => {
  const _functionName = "Routes -> RfidTag -> Mutation -> UpdateRfidTag";

  try {
    if (Context && Context.isContext) {
      await Context.Debug(
        { message: "Updating RFID Tag details.", input },
        _functionName
      );
    }

    const {
      id,
      balanceAmount,
      reserveAmount,
      maxActiveTransactions,
      isBlocked,
      expiryDate,
      mobileNumber,
      email
    } = input;

    // 1. ID & Payload Validation
    if (!id) {
      throw new Error("RFID_TAG_ID_IS_REQUIRED");
    }
    if (Object.keys(input).length <= 1) {
      throw new Error("NO_UPDATE_DATA_PROVIDED");
    }

    // 2. Fetch Existing Data (Added select for tagType and amounts)
    const existingTag = await Context.DataBase.rfidTag.findFirst({
      where: { id, isDeleted: false },
      select: { 
        id: true, 
        tagType: true, 
        balanceAmount: true, 
        reserveAmount: true, 
        expiryDate: true 
      }
    });

    if (!existingTag) {
      throw new Error("RFID_TAG_NOT_FOUND");
    }

    // 3. Financial & Limits Validations (No Negative Values)
    if (balanceAmount !== undefined && balanceAmount < 0) {
      throw new Error("BALANCE_AMOUNT_CANNOT_BE_NEGATIVE");
    }
    if (reserveAmount !== undefined && reserveAmount < 0) {
      throw new Error("RESERVE_AMOUNT_CANNOT_BE_NEGATIVE");
    }
    if (maxActiveTransactions !== undefined && maxActiveTransactions < 0) {
      throw new Error("MAX_TRANSACTIONS_CANNOT_BE_NEGATIVE");
    }

    // 4. Logical Integrity: Reserve vs Balance
    const effectiveBalance = balanceAmount !== undefined ? balanceAmount : existingTag.balanceAmount;
    const effectiveReserve = reserveAmount !== undefined ? reserveAmount : existingTag.reserveAmount;
    
    if (effectiveReserve > effectiveBalance) {
      throw new Error("RESERVE_AMOUNT_CANNOT_EXCEED_BALANCE");
    }

    const now = new Date();

    // 5. Expiry Date Validations
    if (expiryDate) {
      const newExpiry = new Date(expiryDate);
      if (newExpiry <= now) {
        throw new Error("EXPIRY_DATE_MUST_BE_IN_THE_FUTURE");
      }
    }

    // 6. Unblock Integrity Check
    if (isBlocked === false) {
      const effectiveExpiry = expiryDate ? new Date(expiryDate) : new Date(existingTag.expiryDate);
      if (effectiveExpiry <= now) {
        throw new Error("CANNOT_UNBLOCK_EXPIRED_TAG");
      }
    }

    // 7. Format Validations
    if (email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        throw new Error("INVALID_EMAIL_FORMAT");
      }
    }
    if (mobileNumber) {
      // Allows optional '+' followed by 10 to 15 digits
      const phoneRegex = /^\+?[1-9]\d{9,14}$/; 
      if (!phoneRegex.test(mobileNumber)) {
        throw new Error("INVALID_MOBILE_NUMBER_FORMAT");
      }
    }

    // Execution: Update only provided fields dynamically
    const updatedTag = await Context.DataBase.rfidTag.update({
      where: { id },
      data: {
        ...(balanceAmount !== undefined && { balanceAmount }),
        ...(reserveAmount !== undefined && { reserveAmount }),
        ...(maxActiveTransactions !== undefined && { maxActiveTransactions }),
        ...(isBlocked !== undefined && { isBlocked }),
        ...(expiryDate && { expiryDate: new Date(expiryDate) }),
        ...(mobileNumber !== undefined && { mobileNumber }),
        ...(email !== undefined && { email }),
      },
    });

    if (Context && Context.isContext) {
      await Context.Debug(
        { message: "RFID Tag successfully updated.", tagId: updatedTag.id },
        _functionName
      );
    }

    return updatedTag;

  } catch (error) {
    // Replaced Context.Warning with console.error
    console.error(`[${_functionName}] Error:`, error.message);
    throw error;
  }
};