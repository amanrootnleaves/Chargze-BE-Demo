/*
 * EXPORTS
 */
import _ from 'underscore' // NPM: Utility module.


/*
 * EXPORTS
 */
export default async (__, { companyFeatureEntryId, filter, sort, startDate, endDate, take, skip }, Context) => {
  // Error handling.
  try {
    /*
     * Only proceed if context is
     * defined else report failure.
     */
    if (Context && Context.isContext) {
      // Variable assignment.
      const _whatToQuery = { 'isDeleted': false }

      // Const assignment.
      const _functionName = 'Routes -> CompanyFeatureEntry -> Audit'

      // Variable assignment.
      take = take ?? 10
      skip = skip ?? 0

      // Style guide.
      await Context.Debug({ 'message': 'Searching feature audit details.' }, _functionName)

      // Conditional query based on args.
      if (startDate && endDate) Object.assign(_whatToQuery, ({ 'updatedAt': { 'gte': startDate, 'lte': endDate } }))

      // Update query.
      Object.assign(_whatToQuery, ({ 'CompanyFeatureEntry__fk__': { 'equals': companyFeatureEntryId } }))

      // Const assignment.
      const _orderBy = {}

      /*
       * Loop over short if provided and update filters
       * accordingly else proceed with default sorting.
       */
      if (_.isEmpty(sort)) {
        // Update default filter.
        Object.assign(_orderBy, { 'updatedAt': 'desc' })
      } else {
        // Loop over sort and push each sorting.
        for (const j of sort) {
          // Update _orderBy
          _orderBy[j.field] = j.sort || 'desc'
        }
      }

      // Add filters to query if they are provided.
      if (!_.isEmpty(filter)) {
        // Update query with fields to filter.
        Object.assign(_whatToQuery, {
          [filter?.logicOperator?.toUpperCase?.()]: filter.items.map(r => Object.MuiToPrismaFilter(r.field, r.operator, r.value))
        })
      }

      // Fetch count of feature project table.
      const _totalCount = await Context.DataBase.companyFeatureEntryHistory.count({ 'where': _whatToQuery })

      // If query caught exception then report failure.
      if (_totalCount instanceof Error) {
        // Style guide.
        await Context.Debug({ 'message': 'Failed to get count of feature project details.', 'error': _totalCount }, _functionName)

        // Report failure.
        return _totalCount
      }

      // Fetch all feature project details from database.
      const _CompanyFeatureEntryFindMany = await Context.DataBase.companyFeatureEntryHistory.findMany({
        'where': _whatToQuery,
        'include': {
          'ChangedByAccount': {
            'where': {
              'isDeleted': false
            },
            'select': {
              'id': true,
              'displayName': true,
              'email': true
            }
          }
        },
        'orderBy': _orderBy,
        take,
        skip
      })

      /*
       * If getting feature details contains error
       * than report failure
       */
      if (0 < _CompanyFeatureEntryFindMany?.length && !(_CompanyFeatureEntryFindMany instanceof Error)) {
        // Style guide.
        await Context.Debug({ 'message': 'Successfully got given feature details.' }, _functionName)

        // Return feature details.
        return _CompanyFeatureEntryFindMany?.map(j => ({ ...j, _totalCount, 'message': 'Successfully read the feature project', 'status': 'READ_SUCCESSFUL' }))
      }

      // Style guide.
      await Context.Debug({ 'message': 'Failed to get feature details.', 'error': _CompanyFeatureEntryFindMany }, _functionName)

      // Report failure.
      return _CompanyFeatureEntryFindMany instanceof Error ? _CompanyFeatureEntryFindMany : new Error('NO_ENTRY_FOUND')
    }

    // Report failure.
    return new Error('MISSING__CONTEXT')
  } catch (error) {
    // Report failure.
    return error
  }
}
