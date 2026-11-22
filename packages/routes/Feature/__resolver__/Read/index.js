/*
 * EXPORTS
 */
import _ from 'underscore' // NPM: Utility module.


/*
 * EXPORTS
 */
export default async (__, { featureId, sort, filter, displayNameToSearch, take, skip }, Context) => {
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
      const _functionName = 'Routes -> Feature -> Read'

      // Variable assignment.
      take = take ?? 10
      skip = skip ?? 0

      // Style guide.
      await Context.Debug({ 'message': 'Searching feature details..' }, _functionName)

      // Conditional query based on args.
      if (!_.isEmpty(displayNameToSearch)) Object.assign(_whatToQuery, ({ 'OR': [{ 'displayName': { 'startsWith': displayNameToSearch, 'mode': 'insensitive' } }] }))
      if (!_.isEmpty(featureId)) { Object.assign(_whatToQuery, ({ 'id': featureId })) }

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

      // Fetch count of feature table.
      const _totalCount = await Context.DataBase.feature.count({ 'where': _whatToQuery })

      // If query caught exception then report failure.
      if (_totalCount instanceof Error) {
        // Style guide.
        await Context.Debug({ 'message': 'Failed to get count of feature details.', 'error': _totalCount }, _functionName)

        // Report failure.
        return _totalCount
      }

      // Fetch all feature details from database.
      const _FeatureFindMany = await Context.DataBase.feature.findMany({
        'where': _whatToQuery,
        'select': {
          'id': true,
          'displayName': true,
          'description': true,
          'createdAt': true,
          'updatedAt': true,
          'thumbnailStoredAt': true,
          'fields': true
        },
        'orderBy': _orderBy,
        take,
        skip
      })

      /*
       * If getting feature details contains error
       * than report failure
       */
      if (0 < _FeatureFindMany?.length && !(_FeatureFindMany instanceof Error)) {
        // Style guide.
        await Context.Debug({ 'message': 'Successfully got given feature details.' }, _functionName)

        // Return feature details.
        return _FeatureFindMany?.map(j => ({ ...j, _totalCount, 'message': 'Successfully read the feature.', 'status': 'READ_SUCCESSFUL' }))
      }

      // Style guide.
      await Context.Debug({ 'message': 'Failed to get feature details.', 'error': _FeatureFindMany }, _functionName)

      // Report failure.
      return _FeatureFindMany instanceof Error ? _FeatureFindMany : new Error('FAILED_TO_FEATURE')
    }

    // Report failure.
    return new Error('MISSING__CONTEXT')
  } catch (error) {
    // Report failure.
    return error
  }
}
