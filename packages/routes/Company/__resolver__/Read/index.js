/*
 * EXPORTS
 */
import _ from 'underscore' // NPM: Utility module.


/*
 * SIBLINGS
 */
import CompanyOfAccount from '../OfAccount'


/*
 * EXPORTS
 */
export default async (__, { accountId, companyId, displayNameToSearch, take, skip }, Context) => {
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
      const _functionName = 'Routes -> Company -> Read'

      // Variable assignment.
      take = take ?? 10
      skip = skip ?? 0

      // Style guide.
      await Context.Debug({ 'message': 'Searching company details..' }, _functionName)

      // If given user is not admin then get company details.
      if (Context.Session.user.accountType !== ACCOUNT_TYPE.ADMIN.value && _.isEmpty(companyId)) {
        // Get company details.
        const _CompanyOfAccount = await CompanyOfAccount(__, { 'accountId': accountId || Context.Session.user.id }, Context)

        // If company details are not found then report failure.
        if (_CompanyOfAccount instanceof Error) return _CompanyOfAccount
        if (!_CompanyOfAccount) {
          // Const assignment.
          const _error = new Error('COMPANY_NOT_FOUND')

          // Style guide.
          await Context.Debug({ 'message': 'Failed to get company details.', 'error': _error }, _functionName)

          // Report failure.
          return _error
        }

        // Update company id.
        Object.assign(_whatToQuery, { 'id': { 'in': _.compact(_.pluck(_CompanyOfAccount, 'id')) } })
      }

      // Conditional query based on args.
      if (!_.isEmpty(companyId)) Object.assign(_whatToQuery, ({ 'id': companyId }))
      if (!_.isEmpty(displayNameToSearch)) Object.assign(_whatToQuery, ({ 'displayName': { 'startsWith': displayNameToSearch, 'mode': 'insensitive' } }))

      // If logged in user is admin then allow reading all users.
      if (Context.Session.user.accountType === ACCOUNT_TYPE.ADMIN.value) delete _whatToQuery.Account__fk__

      // Fetch count of account table.
      const _totalCount = await Context.DataBase.company.count({ 'where': _whatToQuery })

      // If query caught exception then report failure.
      if (_totalCount instanceof Error) {
        // Style guide.
        await Context.Debug({ 'message': 'Failed to get count of account details.', 'error': _totalCount }, _functionName)

        // Report failure.
        return _totalCount
      }

      // Fetch all company details from database.
      const _CompanyFindMany = await Context.DataBase.company.findMany({
        'where': _whatToQuery,
        'select': {
          'id': true,
          'displayName': true,
          'Gst': {
            'where': {
              'isDeleted': false
            },
            'select': {
              'id': true,
              'displayName': true,
              'description': true,
              'country': true,
              'state': true
            },
            'take': 10
          },
          'Account': {
            'where': {
              'isDeleted': false
            },
            'select': {
              'id': true,
              'createdAt': true,
              'updatedAt': true,
              'displayName': true,
              'accountType': true,
              'email': true
            }
          }
        },
        'orderBy': {
          'updatedAt': 'desc'
        },
        take,
        skip
      })

      /*
       * If getting account details contains error
       * than report failure
       */
      if (0 < _CompanyFindMany?.length && !(_CompanyFindMany instanceof Error)) {
        // Style guide.
        await Context.Debug({ 'message': 'Successfully got given account details.' }, _functionName)

        // Return account details.
        return _CompanyFindMany?.map(j => ({ ...j, _totalCount, 'message': 'Successfully read the accounts', 'status': 'READ_SUCCESSFUL' }))
      }

      // Style guide.
      await Context.Debug({ 'message': `Failed to get account details.`, 'error': _CompanyFindMany }, _functionName)

      // Report failure.
      return _CompanyFindMany instanceof Error ? _CompanyFindMany : new Error('FAILED_TO_FIND_COMPANY')
    }

    // Report failure.
    return new Error('MISSING__CONTEXT')
  } catch (error) {
    // Report failure.
    return error
  }
}
