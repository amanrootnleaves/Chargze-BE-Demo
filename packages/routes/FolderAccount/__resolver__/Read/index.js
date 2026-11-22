/*
 * IMPORTS
 */
import _ from 'underscore' // Npm: Utility module.


/*
 * SIBLINGS.
 */
import CompanyOfAccount from '../../../Company/__resolver__/OfAccount'


/*
 * EXPORTS
 */
export default async (__, { folderAccountToSearch, filter, sort, take, skip }, Context) => {
  // Error handling.
  try {
    /*
     * Only proceed if context is
     * defined else report failure.
     */
    if (Context && Context.isContext) {
      // Const assignment.
      const _whatToQuery = { 'isDeleted': false }
      const _functionName = 'Routes -> FolderAccount -> Read'

      // Variable assignment.
      take = take ?? 10
      skip = skip ?? 0

      // Style guide.
      await Context.Debug({ 'message': 'Searching account directory..' }, _functionName)

      // Get Company Id.
      const _CompanyOfAccount = await CompanyOfAccount(__, { 'accountId': Context.Session.user.id }, Context)

      // Report failure if error is caught.
      if (_CompanyOfAccount instanceof Error) return _CompanyOfAccount
      if (Context.Session.user.accountType !== ACCOUNT_TYPE.ADMIN.value && _.isEmpty(_CompanyOfAccount)) return new Error('COMPANY_NOT_FOUND')

      // Conditional updates.
      if (!_.isEmpty(folderAccountToSearch)) Object.assign(folderAccountToSearch, { 'displayName': folderAccountToSearch })

      // Add company information.
      Object.assign(_whatToQuery, {
        'Company': {
          'is': {
            'id': _CompanyOfAccount?.[0]?.id
          }
        }
      })

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
      const _totalCount = await Context.DataBase.folderAccount.count({
        'where': _whatToQuery
      })

      // If query caught exception then report failure.
      if (_totalCount instanceof Error) {
        // Style guide.
        await Context.Debug({ 'message': 'Failed to get count of account directory.', 'error': _totalCount }, _functionName)

        // Report failure.
        return _totalCount
      }

      // Get all accounts bounded to given accountId.
      const _FolderAccountFindMany = await Context.DataBase.folderAccount.findMany({
        'orderBy': _orderBy,
        'select': {
          'id': true,
          'displayName': true,
          'createdAt': true,
          'updatedAt': true,
          '_count': {
            'select': {
              'Account': {
                'where': {
                  'isDeleted': false
                }
              }
            }
          }
        },
        'where': _whatToQuery,
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
        return _FolderAccountFindMany.map(e => ({ ...e, _totalCount, 'message': 'Successfully found account directory.', 'status': 'READ_SUCCESSFUL' }))
      }

      // Style guide.
      await Context.Debug({ 'message': 'Failed to found account directory.' }, _functionName)

      // Return success.
      return new Error('ACCOUNT_FOLDER_NOT_FOUND')
    }

    // Report failure.
    return new Error('MISSING__CONTEXT')
  } catch (error) {
    // Report failure.
    return error
  }
}
