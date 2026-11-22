import { generateBase64Export } from '../../../../dyna_modules/Utils/index'
import { getCreatedAtFilter } from '../../../../dyna_modules/Utils/dateFilter'

export default async (_, { filters, format }, Context) => {
  const functionName = 'Routes -> FleetOwner -> Query -> ExportFleetOwners'

  try {
    if (!Context || !Context.isContext) {
      throw new Error('MISSING__CONTEXT')
    }

    await Context.Debug(
      { 'message': 'Exporting fleet owners.', filters, format },
      functionName
    )

    const where = { 'isDeleted': false }
    const dateFilter = getCreatedAtFilter(filters?.dateFilter)

    if (dateFilter) {
      where.createdAt = dateFilter
    }

    if (filters) {
      const { search, fleetOwner, chargingHub, ownership, accessType, status } = filters

      if (search && search.trim()) {
        where.OR = [{ 'ownerName': { 'contains': search.trim(), 'mode': 'insensitive' } }, { 'fleetId': { 'contains': search.trim(), 'mode': 'insensitive' } }]
      }

      if (fleetOwner && fleetOwner.trim()) {
        where.ownerName = {
          'contains': fleetOwner.trim(),
          'mode': 'insensitive'
        }
      }

      if (status) {
        where.status = status
      }

      const stationConditions = { 'isDeleted': false }

      if (chargingHub && chargingHub.trim()) {
        const hubValue = chargingHub.trim()
        stationConditions.OR = [{ 'id': hubValue }, { 'stationId': { 'equals': hubValue, 'mode': 'insensitive' } }, { 'name': { 'contains': hubValue, 'mode': 'insensitive' } }]
      }

      if (accessType && accessType.trim()) {
        stationConditions.accessType = {
          'equals': accessType.trim(),
          'mode': 'insensitive'
        }
      }

      if (ownership && ownership.trim()) {
        stationConditions.ownership = {
          'equals': ownership.trim(),
          'mode': 'insensitive'
        }
      }

      if (chargingHub || accessType || ownership) {
        where.rfidTags = {
          'some': {
            'isDeleted': false,
            'stationMappings': {
              'some': {
                'isDeleted': false,
                'chargingStation': stationConditions
              }
            }
          }
        }
      }
    }

    const fleetOwners = await Context.DataBase.fleetOwner.findMany({
      where,
      'orderBy': { 'createdAt': 'desc' },
      'include': {
        'rfidTags': {
          'where': { 'isDeleted': false },
          'include': {
            'stationMappings': {
              'where': { 'isDeleted': false },
              'include': {
                'chargingStation': {
                  'include': {
                    'Chargers': {
                      'where': { 'isDeleted': false },
                      'include': {
                        'Connectors': { 'where': { 'isDeleted': false } }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    })

    const exportData = fleetOwners.flatMap(owner => {
      const ownerDetails = {
        'fleetId': owner.fleetId || 'N/A',
        'fleetOwnerName': owner.ownerName || 'N/A',
        'city': owner.city || 'N/A',
        'state': owner.state || 'N/A'
      }
      const stationMap = new Map()

      for (const rfid of owner.rfidTags || []) {
        for (const mapping of rfid.stationMappings || []) {
          const station = mapping.chargingStation

          if (!station || station.isDeleted) {
            continue
          }

          if (!stationMap.has(station.id)) {
            const chargingPoints = (station.Chargers || []).reduce(
              (total, charger) => total + (charger.Connectors || []).length,
              0
            )

            stationMap.set(station.id, {
              'stationName': station.name || 'N/A',
              'hubStationCount': 1,
              'chargingPoints': chargingPoints,
              'accessType': station.accessType || 'Fleet Reserved',
              'rfids': new Set()
            })
          }

          stationMap.get(station.id).rfids.add(rfid.id)
        }
      }

      if (0 === stationMap.size) {
        return [
          {
            ...ownerDetails,
            'chargingStationName': 'N/A',
            'hubStationCount': 0,
            'chargingPoints': 0,
            'accessType': 'N/A',
            'rfidsCount': 0
          }
        ]
      }

      return Array.from(stationMap.values(), station => ({
        ...ownerDetails,
        'chargingStationName': station.stationName,
        'hubStationCount': station.hubStationCount,
        'chargingPoints': station.chargingPoints,
        'accessType': station.accessType,
        'rfidsCount': station.rfids.size
      }))
    })

    const columns = [
      { 'header': 'Fleet ID', 'key': 'fleetId', 'width': 16 },
      { 'header': 'Fleet Owner Name', 'key': 'fleetOwnerName', 'width': 26 },
      { 'header': 'City', 'key': 'city', 'width': 18 },
      { 'header': 'State', 'key': 'state', 'width': 18 },
      { 'header': 'Charging Station Name', 'key': 'chargingStationName', 'width': 28 },
      { 'header': 'Hub/Station Count', 'key': 'hubStationCount', 'width': 20 },
      { 'header': 'Charging Points', 'key': 'chargingPoints', 'width': 18 },
      { 'header': 'Access Type', 'key': 'accessType', 'width': 18 },
      { 'header': 'RFIDs Count', 'key': 'rfidsCount', 'width': 16 }
    ]

    const fileFormat = format.toUpperCase()
    const base64String = await generateBase64Export(
      exportData,
      columns,
      fileFormat,
      'Fleet Owners Export'
    )
    const extension = 'EXCEL' === fileFormat ? 'xlsx' : 'pdf'
    const mimeType = 'EXCEL' === fileFormat ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' : 'application/pdf'

    await Context.Debug(
      {
        'message': 'Fleet owners exported successfully.',
        'count': exportData.length
      },
      functionName
    )

    return {
      base64String,
      'fileName': `Fleet_Owners_${Date.now()}.${extension}`,
      mimeType
    }
  } catch (error) {
    if (Context && Context.isContext) {
      await Context.Debug(
        {
          'message': 'Failed to export fleet owners.',
          filters,
          format,
          error
        },
        functionName
      )
    }

    throw error
  }
}
