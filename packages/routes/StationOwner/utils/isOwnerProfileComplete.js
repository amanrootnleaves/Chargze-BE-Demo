const hasValue = (value) => {
  if (typeof value === "string") return value.trim().length > 0;
  return value !== null && value !== undefined;
};

export default (owner) => {
  const basicDetailsComplete = [
    owner.partnerType,
    owner.ownerName,
    owner.email,
    owner.phoneNumber,
    owner.addressLineOne,
    owner.pincode,
    owner.city,
    owner.state,
  ].every(hasValue);

  const legalDetailsComplete =
    owner.LegalDetails &&
    [
      owner.LegalDetails.entityName,
      owner.LegalDetails.entityType,
      owner.LegalDetails.aadhaarNumber,
      owner.LegalDetails.panNumber,
      owner.LegalDetails.gstNumber,
    ].every(hasValue);

  const bankingDetailsComplete =
    owner.BankingDetails &&
    [
      owner.BankingDetails.accountHolderName,
      owner.BankingDetails.accountHolderNumber,
      owner.BankingDetails.accountHolderBank,
      owner.BankingDetails.ifscCode,
    ].every(hasValue);

  const documentsComplete =
    owner.OwnerDocument &&
    [
      owner.OwnerDocument.aadhaar,
      owner.OwnerDocument.pancard,
      owner.OwnerDocument.gst,
      owner.OwnerDocument.cancelledCheque,
    ].every(hasValue);

  return Boolean(
    basicDetailsComplete &&
      legalDetailsComplete &&
      bankingDetailsComplete &&
      documentsComplete,
  );
};