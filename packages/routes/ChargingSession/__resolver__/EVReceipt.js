
export default async (__, { id }, Context) => {
  try {
    if (Context && Context.isContext) {
      const _functionName = 'Routes -> ChargingSession -> EVReceipt'

      const _ChargingSession = await Context.DataBase.chargingSession.findUnique({
        where: {
          id: id
        },
        include: {
          Charger: {
              include: {
                  ChargingStation: true
              }
          },
          Transaction: true,
          CustomerProfile: {
              include: {
                  Account: true
              }
          }
        }
      })

      if (!_ChargingSession || _ChargingSession.isDeleted) {
          return new Error('CHARGING_SESSION_NOT_FOUND')
      }

      return _ChargingSession
    }
    return new Error('MISSING__CONTEXT')
  } catch (error) {
    return error
  }
}
