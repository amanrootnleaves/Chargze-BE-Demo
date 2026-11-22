
export default async (__, { chargerId, amountLimit, energyLimit }, Context) => {
  try {
    const unitRate = 18.0;
    const sessionFees = 2.0;
    const taxPercentage = 18.0;
    const taxRate = taxPercentage / 100;
    
    let total = sessionFees;
    if (amountLimit) {
      total = amountLimit;
    } else if (energyLimit) {
      const energyCost = energyLimit * unitRate;
      const taxAmount = (energyCost + sessionFees) * taxRate;
      total = sessionFees + energyCost + taxAmount;
    } else {
      const energyCost = 20 * unitRate;
      const taxAmount = (energyCost + sessionFees) * taxRate;
      total = sessionFees + energyCost + taxAmount;
    }

    return {
      timeSlot: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      sessionFees,
      unitRate,
      tax: taxPercentage,
      total: parseFloat(total.toFixed(2)),
    };
  } catch (error) {
    return error;
  }
};
