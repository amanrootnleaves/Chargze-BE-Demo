
import { getCreatedAtFilter } from '../../../dyna_modules/Utils/dateFilter'

const stationStatusValues = {
  'UNDER_DEVELOPMENT': ['UNDER_DEVELOPMENT', 'Under Development'],
  'LIVE': ['LIVE', 'Live'],
  'CLOSED': ['CLOSED', 'Closed']
}

const stationTypeValues = {
  'STATION': ['STATION', 'Station'],
  'HUB': ['HUB', 'Hub'],
  'FLEET_DEPOT': ['FLEET_DEPOT', 'Fleet Depot']
}

const stationAccessTypeValues = {
  'PUBLIC': ['PUBLIC', 'Public'],
  'PRIVATE': ['PRIVATE', 'Private'],
  'RESIDENT_ONLY': ['RESIDENT_ONLY', 'Resident Only'],
  'EMPLOYEE_ONLY': ['EMPLOYEE_ONLY', 'Employee Only'],
  'FLEET_RESERVED': ['FLEET_RESERVED', 'Fleet Reserved']
}

export default async (__, { dateFilter, filter = {}, page = null, limit = null }, Context) => {
  const functionName = 'Routes -> ChargingStation -> Query -> GetAllChargingStations'
  filter = filter || {}

  try {
    if (!Context || !Context.isContext) {
      throw new Error('MISSING__CONTEXT')
    }

    await Context.Debug(
      { 'message': 'Fetching charging stations.', dateFilter, filter, page, limit },
      functionName
    )

    const createdAtFilter = getCreatedAtFilter(dateFilter)
    const search = filter.search && filter.search.trim()
    const where = {
      'isDeleted': false,
      ...(createdAtFilter ? { 'createdAt': createdAtFilter } : {}),
      ...(filter.stationId ? { 'id': filter.stationId } : {}),
      ...(filter.stationOwnerId ? { 'StationOwner__fk__': filter.stationOwnerId } : {}),
      ...(filter.stationType ? { 'type': { 'in': stationTypeValues[filter.stationType] } } : {}),
      ...(filter.ownership ? { 'ownership': filter.ownership } : {}),
      ...(filter.accessType ? { 'accessType': { 'in': stationAccessTypeValues[filter.accessType] } } : {}),
      ...(filter.status ? { 'status': { 'in': stationStatusValues[filter.status] } } : {}),
      ...(search ? {
        'OR': [
          { 'stationId': { 'contains': search, 'mode': 'insensitive' } },
          { 'name': { 'contains': search, 'mode': 'insensitive' } },
          { 'StationOwner': { 'ownerName': { 'contains': search, 'mode': 'insensitive' } } },
          { 'city': { 'contains': search, 'mode': 'insensitive' } },
          { 'ownership': { 'contains': search, 'mode': 'insensitive' } }
        ]
      } : {})
    }
    const hasPage = null !== page
    const hasLimit = null !== limit
    const shouldPaginate = hasPage || hasLimit
    const currentPage = hasPage ? page : 1
    const pageSize = hasLimit ? limit : 20

    if (
      shouldPaginate && (
        !Number.isInteger(currentPage) || 1 > currentPage || !Number.isInteger(pageSize) || 1 > pageSize || 100 < pageSize
      )
    ) {
      throw new Error('INVALID_PAGINATION')
    }
    const stations = await Context.DataBase.chargingStation.findMany({
      where,
      ...(shouldPaginate ? {
        'skip': (currentPage - 1) * pageSize,
        'take': pageSize
      } : {}),
      'orderBy': { 'createdAt': 'desc' },
      'include': {
        'Company': true,
        'StationOwner': true,
        'Chargers': {
          'include': {
            'Connectors': true
          }
        }
      }
    })

    await Context.Debug(
      { 'message': 'Charging stations fetched successfully.', 'count': stations.length },
      functionName
    )

    return stations
  } catch (error) {
    if (Context && Context.isContext) {
      await Context.Debug(
        { 'message': 'Failed to fetch charging stations.', dateFilter, filter, error },
        functionName
      )
    }

    throw error
  }
}
