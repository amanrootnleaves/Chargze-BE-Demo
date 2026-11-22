/*
 * IMPORTS.
 */
import _ from 'underscore' // Npm: Utility module.


/*
 * SIBLINGS.
 */
import CompanyOfAccount from '../../../Company/__resolver__/OfAccount'


/*
 * EXPORTS
 */
export default async (__, { folderAccountId, displayName }, Context) => {
  // Error handling.
  try {
    /*
     * Only proceed if context is
     * defined else report failure.
     */
    if (Context && Context.isContext) {
      // Const assignment.
      const _functionName = 'Routes -> FolderAccount -> Upsert'

      // Style guide.
      await Context.Debug({ 'message': 'Creating account directory.' }, _functionName)

      // Get Company Id.
      const _CompanyOfAccount = await CompanyOfAccount(__, { 'accountId': Context.Session.user.id }, Context)

      // Report failure if error is caught.
      if (_CompanyOfAccount instanceof Error) return _CompanyOfAccount
      if (Context.Session.user.accountType !== ACCOUNT_TYPE.ADMIN.value && _.isEmpty(_CompanyOfAccount)) return new Error('COMPANY_NOT_FOUND')

      // Const assignment.
      const _query = folderAccountId ? { 'where': { 'id': folderAccountId }, 'data': { 'displayName': displayName, 'Company': { 'connect': { 'id': _CompanyOfAccount?.[0]?.id } } } } : { 'data': { 'displayName': displayName, 'Company': { 'connect': { 'id': _CompanyOfAccount?.[0]?.id } } } }

      // Upsert account directory based on query.
      const _FolderAccountUpsert = await Context.DataBase.folderAccount[folderAccountId ? 'update' : 'create'](_query)

      /*
       * If upsert account directory caught exception
       * then report failure.
       */
      if (_FolderAccountUpsert instanceof Error) {
        // Style guide.
        await Context.Debug({ 'message': 'Failed to upsert account directory.', 'error': _FolderAccountUpsert }, _functionName)

        // Report failure.
        return _FolderAccountUpsert
      }

      // Style guide.
      await Context.Debug({ 'message': 'Successfully upsert the account directory.' }, _functionName)

      // Return success.
      return {
        ..._FolderAccountUpsert,
        'message': 'Account directory upsert successfully.',
        'status': 'UPSERT_SUCCESSFUL'
      }
    }

    // Report failure.
    return new Error('MISSING__CONTEXT')
  } catch (error) {
    // Report failure.
    return error
  }
}
