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
export default async (__, { folderAccountId, accountIds }, Context) => {
  // Error handling.
  try {
    /*
     * Only proceed if context is
     * defined else report failure.
     */
    if (Context && Context.isContext) {
      // Const assignment.
      const _functionName = 'Routes -> FolderAccount -> Connect'

      // Style guide.
      await Context.Debug({ 'message': 'Creating account directory..' }, _functionName)

      // Get Company Id.
      const _CompanyOfAccount = await CompanyOfAccount(__, { 'accountId': Context.Session.user.id }, Context)

      // Report failure if error is caught.
      if (_CompanyOfAccount instanceof Error) return _CompanyOfAccount
      if (Context.Session.user.accountType !== ACCOUNT_TYPE.ADMIN.value && _.isEmpty(_CompanyOfAccount)) return new Error('COMPANY_NOT_FOUND')

      // FindUnique account directory based on query.
      const _FolderAccountFindUnique = await Context.DataBase.folderAccount.findUnique({ 'where': { 'id': folderAccountId } })

      /*
       * If upsert account directory caught exception
       * then report failure.
       */
      if (_FolderAccountFindUnique instanceof Error) {
        // Style guide.
        await Context.Debug({ 'message': 'Failed to upsert account directory.', 'error': _FolderAccountFindUnique }, _functionName)

        // Report failure.
        return _FolderAccountFindUnique
      }
      if (_.isEmpty(_FolderAccountFindUnique)) {
        // Const assignment.
        const _error = new Error('FAILED_TO_UPSERT_ACCOUNT_DIRECTORY')

        // Style guide.
        await Context.Debug({ 'message': 'Failed to upsert account directory.', 'error': _error }, _functionName)

        // Report failure.
        return _error
      }

      // Check for all accounts.
      const _AccountFindMany = await Context.DataBase.account.findMany({
        'where': { 'isDeleted': false, 'id': { 'in': accountIds } },
        'select': {
          'id': true
        }
      })

      // Report failure if error is caught.
      if (_AccountFindMany instanceof Error) {
        // Style guide.
        await Context.Debug({ 'message': 'Failed to upsert account directory.', 'error': _AccountFindMany }, _functionName)

        // Report failure.
        return _AccountFindMany
      }
      if (_.isEmpty(_AccountFindMany)) {
        // Const assignment.
        const _error = new Error('FAILED_TO_FIND_ACCOUNT')

        // Style guide.
        await Context.Debug({ 'message': 'Failed to upsert account directory.', 'error': _error }, _functionName)

        // Report failure.
        return _error
      }

      // Const assignment.
      const _employeePromise = []

      // Loop over findings and connect.
      for (const most of _AccountFindMany) {
        // Push promise to array.
        _employeePromise.push(Context.DataBase.folderAccount.update({
          'where': { 'id': folderAccountId, 'Company__fk__': _CompanyOfAccount?.[0]?.id },
          'data': { 'Account': { 'connect': { 'id': most.id } } }
        }))
      }

      // Connect both accounts.
      const _FolderAccountConnect = await Promise.all(_employeePromise)

      // Report failure if error is caught.
      if (_.some(_FolderAccountConnect, r => r instanceof Error)) {
        // Style guide.
        await Context.Debug({ 'message': 'Failed to upsert account directory.', 'error': _FolderAccountConnect }, _functionName)

        // Report failure.
        return _FolderAccountConnect
      }
      if (_.isEmpty(_FolderAccountConnect)) {
        // Const assignment.
        const _error = new Error('FAILED_TO_UPSERT_ACCOUNT_DIRECTORY')

        // Style guide.
        await Context.Debug({ 'message': 'Failed to upsert account directory.', 'error': _error }, _functionName)

        // Report failure.
        return _error
      }

      // Style guide.
      await Context.Debug({ 'message': 'Successfully upsert the account directory.' }, _functionName)

      // Return success.
      return _FolderAccountConnect?.map(r => ({
        ...r,
        'message': 'Account directory connected successfully.',
        'status': 'UPSERT_SUCCESSFUL'
      }))
    }

    // Report failure.
    return new Error('MISSING__CONTEXT')
  } catch (error) {
    // Report failure.
    return error
  }
}
