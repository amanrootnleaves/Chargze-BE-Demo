/*
 * EXPORTS
 */
import _ from 'underscore' // NPM: Utility module.


/*
 * EXPORTS
 */
export default async (__, { idsToLookup = [] }, Context) => {
  // Error handling.
  try {
    /*
     * Only proceed if context is
     * defined else report failure.
     */
    if (Context && Context.isContext) {
      // Const assignment.
      const _functionName = 'Routes -> Account -> ReadIds'
      const _userRolePromise = []
      const _usersIdToUpdate = []

      // Object assignment.
      const _GetAccountId = async __r => {
        // Local variable.
        let _accountFolderEntry

        // Check if given entry is accountId.
        const _accountEntry = await Context.DataBase.Account.findFirst({ 'where': { 'OR': [{ 'id': __r }, { 'id': __r }] } })

        // Report failure if error is caught.
        if (_accountEntry instanceof Error) {
          // Style guide.
          await Context.Debug({ 'message': `Failed to find account with email or displayName: ${__r}`, 'error': _accountEntry }, _functionName)

          // Report failure.
          return _accountEntry
        }
        if (_.isEmpty(_accountEntry)) {
          // Search account folder with this name.
          _accountFolderEntry = await Context.DataBase.folderAccount.findFirst({ 'where': { 'id': __r }, 'select': { 'Account': { 'where': { 'isDeleted': false }, 'select': { 'id': true } } } })

          // Report failure if error is caught.
          if (_accountFolderEntry instanceof Error) {
            // Style guide.
            await Context.Debug({ 'message': `Failed to find account folder with name: ${__r}`, 'error': _accountFolderEntry }, _functionName)

            // Report failure.
            return _accountFolderEntry
          }
          if (_.isEmpty(_accountFolderEntry)) {
            // Report failure.
            return new Error(`Failed to find account folder with name: ${__r}`)
          }

          // Update accountId.
          _usersIdToUpdate.push(_.compact(_.flatten(_.pluck(_accountFolderEntry.Account, 'id'))))
        } else {
          // Accounts to update.
          _usersIdToUpdate.push(_accountEntry.id)
        }

        // Return void.
        return void 0
      }

      // Get account id of users.
      for (const entry of idsToLookup) _userRolePromise.push(_GetAccountId(entry))

      // Update user.
      await Promise.all(_userRolePromise)

      // Report failure.
      return _.isEmpty(_usersIdToUpdate) ? new Error('FAILED_TO_FIND_ACCOUNT') : _.compact(_.flatten(_usersIdToUpdate))
    }

    // Report failure.
    return new Error('MISSING__CONTEXT')
  } catch (error) {
    // Report failure.
    return error
  }
}
