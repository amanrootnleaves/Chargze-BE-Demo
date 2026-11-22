import { generateBase64Export } from '../../../../dyna_modules/Utils/index'
import { getCreatedAtFilter } from '../../../../dyna_modules/Utils/dateFilter'

export default async (_, { dateFilter, format }, Context) => {
  const functionName = 'Routes -> StationOwner -> Query -> ExportStationOwners'

  try {
    if (!Context || !Context.isContext) {
      throw new Error('MISSING__CONTEXT')
    }

    await Context.Debug(
      { 'message': 'Exporting station owners with charging stations.', dateFilter, format },
      functionName
    )

    const createdAtFilter = getCreatedAtFilter(dateFilter)
    const where = {
      'isDeleted': false,
      ...(createdAtFilter ? { 'createdAt': createdAtFilter } : {})
    }

    const stationOwners = await Context.DataBase.stationOwner.findMany({
      where,
      'orderBy': { 'createdAt': 'desc' },
      'include': {
        'ChargingStations': {
          'where': { 'isDeleted': false },
          'include': {
            'Chargers': {
              'where': { 'isDeleted': false },
              'include': {
                'Connectors': {
                  'where': { 'isDeleted': false },
                  'select': { 'price': true }
                }
              }
            }
          }
        }
      }
    })

    const exportData = stationOwners.flatMap(owner => {
      const ownerDetails = {
        'id': owner.id,
        'displayId': owner.displayId || 'N/A',
        'ownerName': owner.ownerName || 'N/A'
      }

      if (0 === owner.ChargingStations.length) {
        return [
          {
            ...ownerDetails,
            'stationId': 'N/A',
            'stationName': 'N/A',
            'ownership': 'N/A',
            'accessType': 'N/A',
            'chargingPoint': '0',
            'chargerPrice': 'N/A',
            'city': 'N/A',
            'state': 'N/A',
            'status': 'N/A'
          }
        ]
      }

      return owner.ChargingStations.map(station => {
        const connectors = station.Chargers.flatMap(
          charger => charger.Connectors
        )
        const chargerPrice = connectors
          .map(connector => connector.price)
          .filter(price => null !== price)

        return {
          ...ownerDetails,
          'stationId': station.id,
          'stationName': station.name || 'N/A',
          'ownership': station.ownership || 'N/A',
          'accessType': station.accessType || 'N/A',
          'chargingPoint': String(connectors.length),
          'chargerPrice': chargerPrice.length ? chargerPrice.join(', ') : 'N/A',
          'city': station.city || 'N/A',
          'state': station.state || 'N/A',
          'status': station.status || 'N/A'
        }
      })
    })

    const columns = [
      { 'header': 'ID', 'key': 'id', 'width': 24 },
      { 'header': 'Display ID', 'key': 'displayId', 'width': 18 },
      { 'header': 'Owner Name', 'key': 'ownerName', 'width': 24 },
      { 'header': 'Station ID', 'key': 'stationId', 'width': 24 },
      { 'header': 'Station Name', 'key': 'stationName', 'width': 24 },
      { 'header': 'Ownership', 'key': 'ownership', 'width': 16 },
      { 'header': 'Access Type', 'key': 'accessType', 'width': 18 },
      { 'header': 'Charging Point', 'key': 'chargingPoint', 'width': 16 },
      { 'header': 'Charger Price', 'key': 'chargerPrice', 'width': 24 },
      { 'header': 'City', 'key': 'city', 'width': 18 },
      { 'header': 'State', 'key': 'state', 'width': 18 },
      { 'header': 'Status', 'key': 'status', 'width': 16 }
    ]

    const fileFormat = format.toUpperCase()
    const base64String = await generateBase64Export(
      exportData,
      columns,
      fileFormat,
      'Station Owners with Stations Report'
    )
    const extension = 'EXCEL' === fileFormat ? 'xlsx' : 'pdf'
    const mimeType = 'EXCEL' === fileFormat ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' : 'application/pdf'

    await Context.Debug(
      {
        'message': 'Station owners exported successfully.',
        'count': exportData.length
      },
      functionName
    )

    return {
      base64String,
      'fileName': `Station_Owners_${Date.now()}.${extension}`,
      mimeType
    }
  } catch (error) {
    if (Context && Context.isContext) {
      await Context.Debug(
        {
          'message': 'Failed to export station owners with charging stations.',
          dateFilter,
          format,
          error
        },
        functionName
      )
    }

    throw error
  }
}
