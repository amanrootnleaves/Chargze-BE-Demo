/*
 * IMPORTS
 */
import _ from 'underscore' // Npm: Utility module.


/*
 * EXPORTS
 */
export default async (__, { folderAccountId, filter, sort, accountNameToSearch, take, skip }, Context) => {
  // Error handling.
  try {
    /*
     * Only proceed if context is
     * defined else report failure.
     */
    if (Context && Context.isContext) {
      // Const assignment.
      const _whatToQuery = {
        'isDeleted': false,
        'FolderAccount': {
          'some': {
            'id': folderAccountId
          }
        }
      }
      const _functionName = 'Routes -> FolderAccount -> Read'

      // Variable assignment.
      take = take ?? 10
      skip = skip ?? 0

      // Check if folder exists.
      const _FolderAccountFindUnique = await Context.DataBase.folderAccount.findUnique({
        'where': { 'id': folderAccountId }
      })

      // Report failure if error is caught.
      if (_FolderAccountFindUnique instanceof Error) return _FolderAccountFindUnique
      if (_.isEmpty(_FolderAccountFindUnique)) return new Error('FOLDER_NOT_FOUND')

      // Style guide.
      await Context.Debug({ 'message': 'Searching account directory..' }, _functionName)

      // Object assignment of name to search.
      if (!_.isEmpty(accountNameToSearch)) Object.assign(_whatToQuery, { 'OR': [{ 'displayName': { 'startsWith': accountNameToSearch, 'mode': 'insensitive' } }, { 'email': { 'startsWith': accountNameToSearch, 'mode': 'insensitive' } }] })

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

      // Get count of total folderAccount in database.
      const _totalCount = await Context.DataBase.account.count({ 'where': _whatToQuery })

      // If query caught exception then report failure.
      if (_totalCount instanceof Error) {
        // Style guide.
        await Context.Debug({ 'message': 'Failed to get count of account directory.', 'error': _totalCount }, _functionName)

        // Report failure.
        return _totalCount
      }

      // Get all accounts bounded to given accountId.
      const _FolderAccountFindMany = await Context.DataBase.account.findMany({
        'where': _whatToQuery,
        'orderBy': _orderBy,
        'select': {
          'id': true,
          'displayName': true
        },
        skip,
        take
      })

      /*
       * If creating folderAccount caught exception
       * then report failure.
       */
      if (_FolderAccountFindMany instanceof Error) {
        // Style guide.
        await Context.Debug({ 'message': 'Failed to read account directory.', 'error': _FolderAccountFindMany }, _functionName)

        // Report failure.
        return _FolderAccountFindMany
      }

      /*
       * If getting folderAccount is not empty
       * then update them with message and status
       * flag.
       */
      if (0 < _FolderAccountFindMany.length) {
        // Style guide.
        await Context.Debug({ 'message': 'Successfully found account directory.' }, _functionName)

        // Return success.
        return {
          ..._FolderAccountFindUnique,
          'Account': _FolderAccountFindMany,
          _totalCount,
          'message': 'Successfully found account directory.',
          'status': 'READ_SUCCESSFUL'
        }
      }

      // Style guide.
      await Context.Debug({ 'message': 'Failed to found account directory.' }, _functionName)

      // Return success.
      return new Error('FOLDER_NOT_FOUND')
    }

    // Report failure.
    return new Error('MISSING__CONTEXT')
  } catch (error) {
    // Report failure.
    return error
  }
}
