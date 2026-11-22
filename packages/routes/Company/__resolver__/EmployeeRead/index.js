/*
 * IMPORTS
 */
import _ from 'underscore' // Npm: Utility module.


/*
 * SIBLINGS
 */
import CompanyOfAccount from '../../../Company/__resolver__/OfAccount'


/*
 * EXPORTS
 */
export default async (__, { employeeToSearch, take = 10, skip = 0 }, Context) => {
  // Error handling.
  try {
    /*
     * Only proceed if context is
     * defined else report failure.
     */
    if (Context && Context.isContext) {
      // Const assignment.
      const _whatToQuery = { 'isDeleted': false }
      const _functionName = 'Routes -> Account -> Employee'

      // Variable assignment.
      take = take ?? 10
      skip = skip ?? 0

      // Style guide.
      await Context.Debug({ 'message': 'Searching account details..' }, _functionName)

      // Get company of logged in user if user is not admin.
      if (!['ADMIN', 'COMPANY']?.includes(Context.Session.user.accountType)) {
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
        if (_.isEmpty(_CompanyOfAccount)) {
          // Style guide.
          await Context.Debug({ 'message': 'Company not found.' }, _functionName)

          // Report failure.
          return new Error('COMPANY_NOT_FOUND')
        }

        // Get owner of this company.
        const _CompanyOwner = await Context.DataBase.Company.findUnique({ 'where': { 'id': _CompanyOfAccount?.[0].id }, 'select': { 'Account': { 'where': { 'isDeleted': false }, 'select': { 'id': true } } } })

        // Report failure if error is caught.
        if (_CompanyOwner instanceof Error) {
          // Style guide.
          await Context.Debug({ 'message': 'Failed to get owner of company.', 'error': _CompanyOwner }, _functionName)

          // Report failure.
          return _CompanyOwner
        }

        // Update query.
        Object.assign(_whatToQuery, { 'ParentAccount': { 'id': _CompanyOwner.Account.id } })
      } else if (['COMPANY']?.includes(Context.Session.user.accountType)) {
        // Update query.
        Object.assign(_whatToQuery, { 'ParentAccount': { 'id': Context.Session.user.id } })
      }

      // Update query.
      if (!_.isEmpty(employeeToSearch)) Object.assign(_whatToQuery, { 'OR': [{ 'displayName': { 'startsWith': employeeToSearch, 'mode': 'insensitive' } }, { 'email': { 'startsWith': employeeToSearch, 'mode': 'insensitive' } }] })

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
      const _AccountFindMany = await Context.DataBase.account.findMany({
        'where': _whatToQuery,
        'select': {
          'id': true,
          'createdAt': true,
          'updatedAt': true,
          'displayName': true,
          'email': true
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
