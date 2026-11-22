/*
 * EXPORTS
 */
import _ from 'underscore' // NPM: Utility module.


/*
 * EXPORTS
 */
export default async (__, { displayNameToSearch, take, skip }, Context) => {
  // Error handling.
  try {
    /*
     * Only proceed if context is
     * defined else report failure.
     */
    if (Context && Context.isContext) {
      // Variable assignment.
      const _whatToQuery = { 'Account__fk__': Context.Session.user.id, 'isDeleted': false }

      // Const assignment.
      const _functionName = 'Routes -> DynamicColumn -> Read'

      // Variable assignment.
      take = take ?? 10
      skip = skip ?? 0

      // Style guide.
      await Context.Debug({ 'message': 'Searching dynamicColumn details..' }, _functionName)

      // Conditional query based on args.
      if (!_.isEmpty(displayNameToSearch)) Object.assign(_whatToQuery, ({ 'displayName': { 'contains': displayNameToSearch } }))

      // Fetch count of dynamicColumn table.
      const _totalCount = await Context.DataBase.dynamicColumn.count({ 'where': _whatToQuery })

      // If query caught exception then report failure.
      if (_totalCount instanceof Error) {
        // Style guide.
        await Context.Debug({ 'message': 'Failed to get count of dynamicColumn details.', 'error': _totalCount }, _functionName)

        // Report failure.
        return _totalCount
      }

      // Fetch all dynamicColumn details from database.
      const _DynamicColumnFindMany = await Context.DataBase.dynamicColumn.findMany({
        'where': _whatToQuery,
        'select': {
          'id': true,
          'createdAt': true,
          'updatedAt': true,
          'fields': true,
          'Feature': {
            'where': {
              'isDeleted': false
            },
            'select': {
              'id': true,
              'displayName': true,
              'fields': true
            }
          }
        },
        take,
        skip
      })

      /*
       * If getting dynamicColumn details contains error
       * than report failure
       */
      if (0 < _DynamicColumnFindMany?.length && !(_DynamicColumnFindMany instanceof Error)) {
        // Style guide.
        await Context.Debug({ 'message': 'Successfully got given dynamicColumn details.' }, _functionName)

        // Return dynamicColumn details.
        return _DynamicColumnFindMany?.map(j => ({ ...j, _totalCount, 'message': 'Successfully read the dynamicColumns', 'status': 'READ_SUCCESSFUL' }))
      }

      // Style guide.
      await Context.Debug({ 'message': 'Failed to get dynamicColumn details.', 'error': _DynamicColumnFindMany }, _functionName)

      // Report failure.
      return _DynamicColumnFindMany instanceof Error ? _DynamicColumnFindMany : new Error('FAILED_TO_DYNAMIC_COLUMN')
    }

    // Report failure.
    return new Error('MISSING__CONTEXT')
  } catch (error) {
    // Report failure.
    return error
  }
}
