// packages/utils/dateFilter.js
export const getCreatedAtFilter = (dateFilter) => {
  if (!dateFilter) {
    return undefined;
  }
  const { period, startDate, endDate } = dateFilter;
  if (period && (startDate || endDate)) {
    throw new Error("INVALID_DATE_FILTER");
  }
  if (!period && (!startDate || !endDate)) {
    throw new Error("INVALID_DATE_FILTER");
  }  
  if (period) {  
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    let filterStartDate = new Date(today);
    switch (period) {
      case "TODAY":
        break;
      case "WEEK":
        filterStartDate.setDate(filterStartDate.getDate() - 6);
        break;
      case "MONTH":
        filterStartDate = new Date(today.getFullYear(), today.getMonth(), 1);
        break;
      case "HALF_YEAR":
        filterStartDate = new Date(
          today.getFullYear(),
          today.getMonth() - 5,
          1,
        );
        break;
      case "YEAR":
        filterStartDate = new Date(today.getFullYear(), 0, 1);
        break;
      default:
        throw new Error("INVALID_DATE_FILTER");
    }
    return {
      gte: filterStartDate,
      lt: tomorrow,
    };
  }
  const filterStartDate = new Date(startDate);
  const filterEndDate = new Date(endDate);
  if (
    Number.isNaN(filterStartDate.getTime()) ||
    Number.isNaN(filterEndDate.getTime()) ||
    filterStartDate > filterEndDate
  ) {
    throw new Error("INVALID_DATE_FILTER");
  }
  filterStartDate.setHours(0, 0, 0, 0);
  filterEndDate.setHours(23, 59, 59, 999);
  return {
    gte: filterStartDate,
    lte: filterEndDate,
  };
};