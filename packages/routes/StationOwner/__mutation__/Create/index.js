import { OwnerProfileStatus } from "@prisma/client";
import isOwnerProfileComplete from "../../utils/isOwnerProfileComplete";

export default async (__, { input }, Context) => {
  const _functionName =
    "Routes -> StationOwner -> Mutation -> CreateStationOwner";

  try {
    if (Context && Context.isContext) {
      await Context.Debug(
        {
          message: "Creating Station Owner.",
          input,
        },
        _functionName,
      );
    }

    // Normalize Input
    const normalizedInput = {
      ...input,
      ownerName: input.ownerName?.trim(),
      email: input.email?.trim().toLowerCase(),
      phoneNumber: input.phoneNumber?.toString().trim(),
      addressLineOne: input.addressLineOne?.trim(),
      addressLineTwo: input.addressLineTwo?.trim(),
      city: input.city?.trim(),
      state: input.state?.trim(),

      legalDetails: input.legalDetails && {
        ...input.legalDetails,
        entityName: input.legalDetails.entityName?.trim(),
        panNumber: input.legalDetails.panNumber?.trim().toUpperCase(),
        gstNumber: input.legalDetails.gstNumber?.trim().toUpperCase(),
      },

      bankingDetails: input.bankingDetails && {
        ...input.bankingDetails,
        accountHolderName: input.bankingDetails.accountHolderName?.trim(),
        accountHolderBank: input.bankingDetails.accountHolderBank?.trim(),
        ifscCode: input.bankingDetails.ifscCode?.trim().toUpperCase(),
      },
    };

    // Email Validation
    const _emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!_emailRegex.test(normalizedInput.email)) {
      throw new Error("INVALID_EMAIL");
    }

    // Phone Validation
    const _phoneRegex = /^[6-9]\d{9}$/;

    if (!_phoneRegex.test(normalizedInput.phoneNumber)) {
      throw new Error("INVALID_PHONE_NUMBER");
    }

    // Duplicate Validation
    const _existingOwner = await Context.DataBase.stationOwner.findFirst({
      where: {
        isDeleted: false,
        OR: [
          {
            email: normalizedInput.email,
          },
          {
            phoneNumber: normalizedInput.phoneNumber,
          },
        ],
      },
    });

    if (_existingOwner) {
      throw new Error("OWNER_ALREADY_EXISTS");
    }

    const _stationOwner = await Context.DataBase.$transaction(async (tx) => {
      const owners = await tx.stationOwner.findMany({
        select: { displayId: true },
      });

      const lastNumber = Math.max(
        0,
        ...owners
          .map((owner) => Number.parseInt(owner.displayId, 10))
          .filter(Number.isFinite),
      );

      const displayId = String(lastNumber + 1).padStart(3, "0");
      return tx.stationOwner.create({
        data: {
          partnerType: normalizedInput.partnerType,
          onboardingDate: normalizedInput.onboardingDate,
          status: normalizedInput.status ?? "ACTIVE",
          profileStatus: isOwnerProfileComplete({
            ...normalizedInput,
            LegalDetails: normalizedInput.legalDetails,
            BankingDetails: normalizedInput.bankingDetails,
            OwnerDocument: normalizedInput.ownerDocument,
          })
            ? OwnerProfileStatus.COMPLETED
            : OwnerProfileStatus.INCOMPLETE,
          closedDate: normalizedInput.closedDate ?? null,

          ownerName: normalizedInput.ownerName,
          email: normalizedInput.email,
          phoneNumber: normalizedInput.phoneNumber,

          addressLineOne: normalizedInput.addressLineOne,
          addressLineTwo: normalizedInput.addressLineTwo,
          pincode: normalizedInput.pincode,
          city: normalizedInput.city,
          state: normalizedInput.state,
          displayId,

          LegalDetails: normalizedInput.legalDetails
            ? {
                create: {
                  ...normalizedInput.legalDetails,
                },
              }
            : undefined,

          BankingDetails: normalizedInput.bankingDetails
            ? {
                create: {
                  ...normalizedInput.bankingDetails,
                },
              }
            : undefined,

          OwnerDocument: normalizedInput.ownerDocument
            ? {
                create: {
                  ...normalizedInput.ownerDocument,
                },
              }
            : undefined,
        },

        include: {
          LegalDetails: true,
          BankingDetails: true,
          OwnerDocument: true,
        },
      });
    });

    if (Context && Context.isContext) {
      await Context.Debug(
        {
          message: "Station Owner created successfully.",
          output: _stationOwner,
        },
        _functionName,
      );
    }

    return _stationOwner;
  } catch (error) {
    if (Context && Context.isContext) {
      await Context.Debug(
        { message: "Unable to create Station Owner.", input },
        _functionName,
      );
    }

    throw error;
  }
};
