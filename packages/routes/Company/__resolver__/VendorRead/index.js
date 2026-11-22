/*
 * IMPORTS
 */
import _ from 'underscore' // NPM: Utility module.


/*
 * SIBLINGS
 */
import CompanyOfAccount from '../../../Company/__resolver__/OfAccount'


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
      // Local variable.
      let _AccountFindMany

      // Const assignment.
      const _whatToQuery = { 'isDeleted': false }
      const _functionName = 'Routes -> Company -> VendorRead'

      // Variable assignment.
      take = take ?? 10
      skip = skip ?? 0


      // Style guide.
      await Context.Debug({ 'message': 'Searching account details..' }, _functionName)

      // Get Company details.
      const _CompanyOfAccount = await CompanyOfAccount(__, { 'accountId': Context.Session.user.id }, Context)

      // Report failure if error is caught.
      if (_CompanyOfAccount instanceof Error) {
        // Style guide.
        await Context.Debug({ 'message': 'Failed to get company details.' }, _functionName)

        // Report failure.
        return _CompanyOfAccount
      }

      // Report failure if company is not found.
      if (Context.Session.user.accountType !== ACCOUNT_TYPE.ADMIN.value && _.isEmpty(_CompanyOfAccount)) {
        // Style guide.
        await Context.Debug({ 'message': 'Company not found.' }, _functionName)

        // Report failure.
        return new Error('COMPANY_NOT_FOUND')
      }

      // Get account belonging to given companyId.
      _AccountFindMany = await Context.DataBase.account.findMany({ 'where': { 'Company': { 'some': { 'id': _.pluck(_CompanyOfAccount, 'id')?.[0] } } }, 'take': take, 'skip': skip })
      _AccountFindMany = _AccountFindMany?.[0]

      // Report failure if error is caught.
      if (_AccountFindMany instanceof Error) {
        // Report failure if error is caught.
        await Context.Debug({ 'message': 'Failed to get account details.', 'error': _AccountFindMany }, _functionName)

        // Report failure.
        return _AccountFindMany
      }
      if (_.isEmpty(_AccountFindMany)) return new Error('PARENT_ACCOUNT_NOT_FOUND')

      // Conditional query based on args.
      Object.assign(_whatToQuery, ({ 'ParentAccount': { 'id': { 'equals': _AccountFindMany?.id } } }))
      Object.assign(_whatToQuery, ({ 'accountType': ACCOUNT_TYPE?.VENDOR?.value }))

      // If displayNameToSearch is provided, add it to the query.
      if (displayNameToSearch) {
        Object.assign(_whatToQuery, ({ 'displayName': { 'contains': displayNameToSearch } }))
      }

      // Fetch count of account table.
      const _totalCount = await Context.DataBase.account.count({ 'where': _whatToQuery })

      // If query caught exception then report failure.
      if (_totalCount instanceof Error) {
        // Style guide.
        await Context.Debug({ 'message': 'Failed to get count of account details.', 'error': _totalCount }, _functionName)

        // Report failure.
        return _totalCount
      }

      // Fetch all account details from database.
      _AccountFindMany = await Context.DataBase.account.findMany({
        'where': _whatToQuery,
        'select': {
          'id': true,
          'createdAt': true,
          'updatedAt': true,
          'isBlocked': true,
          'displayName': true,
          'thumbnailStoredAt': true,
          'accountType': true,
          'email': true,
          'fullName': true,
          'phoneNumber': true,
          'Company': {
            'where': {
              'isDeleted': false
            },
            'select': {
              'id': true
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
      if (0 < _AccountFindMany?.length && !(_AccountFindMany instanceof Error)) {
        // Style guide.
        await Context.Debug({ 'message': 'Successfully got given account details.' }, _functionName)

        // Return account details.
        return _AccountFindMany?.map(j => ({ ...j, _totalCount, 'message': 'Successfully read the accounts', 'status': 'READ_SUCCESSFUL' }))
      }

      // Style guide.
      await Context.Debug({ 'message': `Failed to get account details.`, 'error': _AccountFindMany }, _functionName)

      // Report failure.
      return _AccountFindMany instanceof Error ? _AccountFindMany : new Error('FAILED_TO_FIND_ACCOUNT')
    }

    // Report failure.
    return new Error('MISSING__CONTEXT')
  } catch (error) {
    // Report failure.
    return error
  }
}
