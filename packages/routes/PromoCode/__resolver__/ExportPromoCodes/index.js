import { generateBase64Export } from '../../../../dyna_modules/Utils/index'

// Tera standard date filter helper yahan import ya defined hoga
const _getCreatedAtFilter = (dateFilter) => {
  if (!dateFilter) return undefined;
  const { period, startDate, endDate } = dateFilter;
  if (period && (startDate || endDate)) throw new Error("INVALID_DATE_FILTER");
  if (!period && (!startDate || !endDate)) throw new Error("INVALID_DATE_FILTER");

  if (period) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    let filterStartDate = new Date(today);

    switch (period) {
      case "TODAY": break;
      case "WEEK": filterStartDate.setDate(filterStartDate.getDate() - 6); break;
      case "MONTH": filterStartDate = new Date(today.getFullYear(), today.getMonth(), 1); break;
      case "HALF_YEAR": filterStartDate = new Date(today.getFullYear(), today.getMonth() - 5, 1); break;
      case "YEAR": filterStartDate = new Date(today.getFullYear(), 0, 1); break;
      default: throw new Error("INVALID_DATE_FILTER");
    }
    return { gte: filterStartDate, lt: tomorrow };
  }

  const filterStartDate = new Date(startDate);
  const filterEndDate = new Date(endDate);
  if (Number.isNaN(filterStartDate.getTime()) || Number.isNaN(filterEndDate.getTime()) || filterStartDate > filterEndDate) {
    throw new Error("INVALID_DATE_FILTER");
  }
  filterStartDate.setHours(0, 0, 0, 0);
  filterEndDate.setHours(23, 59, 59, 999);
  return { gte: filterStartDate, lte: filterEndDate };
};

export default async (parent, { filter, format }, Context) => {
  const _functionName = 'Routes -> PromoCode -> Query -> exportPromoCodes'

  try {
    if (Context && Context.isContext) {
      await Context.Debug(
        { 'message': 'Exporting promo codes.', filter, format },
        _functionName
      )
    }

    // 1. Destructure dateFilter along with status and search
    const { status, search, dateFilter } = filter || {}
    const where = {}

    // 2. Apply status filter
    if (status) {
      where.status = status
    }

    // 3. Apply search filter
    if (search && search.trim()) {
      where.code = {
        'contains': search.trim().toUpperCase(),
        'mode': 'insensitive'
      }
    }

    // 4. Apply date filter using the standard helper
    if (dateFilter) {
      const createdAtFilter = _getCreatedAtFilter(dateFilter)
      if (createdAtFilter) {
        where.createdAt = createdAtFilter
      }
    }

    const promoCodes = await Context.DataBase.promoCode.findMany({
      where,
      'orderBy': { 'createdAt': 'desc' }
    })

    const exportData = promoCodes.map((promo, index) => ({
      'sNo': index + 1,
      'code': promo.code,
      'discountType': promo.discountType,
      'discountScope': promo.discountScope,
      'discountValue': promo.discountValue,
      'maxDiscountValue': promo.maxDiscountValue ?? 'N/A',
      'minTransactionValue': promo.minTransactionValue ?? 'N/A',
      'validFrom': promo.validFrom ? new Date(promo.validFrom).toLocaleDateString('en-GB') : 'N/A',
      'validUntil': promo.validUntil ? new Date(promo.validUntil).toLocaleDateString('en-GB') : 'N/A',
      'status': promo.status,
      'createdAt': promo.createdAt ? new Date(promo.createdAt).toLocaleDateString('en-GB') : 'N/A'
    }))

    const columns = [
      { 'header': '#', 'key': 'sNo', 'width': 8 },
      { 'header': 'Promo Code', 'key': 'code', 'width': 22 },
      { 'header': 'Discount Type', 'key': 'discountType', 'width': 18 },
      { 'header': 'Discount Scope', 'key': 'discountScope', 'width': 18 },
      { 'header': 'Discount Value', 'key': 'discountValue', 'width': 16 },
      { 'header': 'Max Discount', 'key': 'maxDiscountValue', 'width': 16 },
      { 'header': 'Minimum Transaction', 'key': 'minTransactionValue', 'width': 22 },
      { 'header': 'Valid From', 'key': 'validFrom', 'width': 16 },
      { 'header': 'Valid Until', 'key': 'validUntil', 'width': 16 },
      { 'header': 'Status', 'key': 'status', 'width': 14 },
      { 'header': 'Created At', 'key': 'createdAt', 'width': 16 }
    ]

    const fileFormat = format.toUpperCase()
    const base64String = await generateBase64Export(
      exportData,
      columns,
      fileFormat,
      'Promo Codes Report'
    )

    const extension = 'EXCEL' === fileFormat ? 'xlsx' : 'pdf'
    const mimeType = 'EXCEL' === fileFormat ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' : 'application/pdf'

    return {
      base64String,
      'fileName': `Promo_Codes_Export_${Date.now()}.${extension}`,
      mimeType
    }
  } catch (error) {
    if (Context && Context.isContext) {
      await Context.Debug(
        { 'message': 'Failed to export promo codes.', filter, format, error },
        _functionName
      )
    }

    throw error
  }
}