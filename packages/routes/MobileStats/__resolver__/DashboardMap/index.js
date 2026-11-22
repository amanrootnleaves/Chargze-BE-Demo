const parseCoordinate = value => {
  if ('string' !== typeof value || !value.trim()) {
    return null
  }

  const coordinate = Number(value)

  return Number.isFinite(coordinate) ? coordinate : null
}

export default async (_, __, Context) => {
  const _functionName = 'Routes -> MobileStats -> Resolver -> DashboardMap'

  if (!Context || !Context.isContext) {
    throw new Error('MISSING__CONTEXT')
  }

  try {
    Context.Debug({ 'message': 'Fetching DashboardMaps' }, _functionName)
    const stations = await Context.DataBase.chargingStation.findMany({
      'where': {
        'OR': [{ 'isDeleted': false }, { 'isDeleted': null }]
      }
    })
    const totalStation = await Context.DataBase.chargingStation.aggregate({
      '_count': true,
      'where': {
        'OR': [{ 'isDeleted': false }, { 'isDeleted': null }]
      }
    })
    Context.Debug({ 'message': 'Fetched DashboardMaps' }, _functionName)

    return {
      'stations': stations.map(station => ({
        'id': station.id,
        'stationId': station.id,
        'stationName': station.name,
        'latitude': parseCoordinate(station.latitude),
        'longitude': parseCoordinate(station.longitude),
        'amenities': station.amenities,
        'address': station.address,
        'status': station.status || 'UNKNOWN'
      })),
      'totalCount': totalStation._count
    }
  } catch (error) {
    if (Context && Context.isContext) {
      Context.Debug({ 'message': 'Unable to fetch DashboardMap' }, _functionName)
    }

    throw error
  }
}
