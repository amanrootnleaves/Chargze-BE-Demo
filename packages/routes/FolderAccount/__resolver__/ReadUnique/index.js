/*
 * IMPORTS
 */
import _ from 'underscore' // Npm: Utility module.


/*
 * EXPORTS
 */
export default async (__, { folderAccountId }, Context) => {
  // Error handling.
  try {
    /*
     * Only proceed if context is
     * defined else report failure.
     */
    if (Context && Context.isContext) {
      // Const assignment.
      const _functionName = 'Routes -> FolderAccount -> ReadUnique'

      // Style guide.
      await Context.Debug({ 'message': 'Searching account directory..' }, _functionName)

      // Get all accounts with given id.
      const _FolderAccountFindUnique = await Context.DataBase.folderAccount.findUnique({ 'where': { 'id': folderAccountId } })

      /*
       * If searching folderAccount caught exception
       * then report failure.
       */
      if (_FolderAccountFindUnique instanceof Error) {
        // Style guide.
        await Context.Debug({ 'message': 'Failed to find account directory.', 'error': _FolderAccountFindUnique }, _functionName)

        // Report failure.
        return _FolderAccountFindUnique
      }
      if (_.isEmpty(_FolderAccountFindUnique)) {
        // Const assignment.
        const _error = new Error('FOLDER_NOT_FOUND')

        // Style guide.
        await Context.Debug({ 'message': 'Failed to find account directory.', 'error': _error }, _functionName)

        // Report failure.
        return _error
      }

      // Style guide.
      await Context.Debug({ 'message': 'Successfully found account directory.' }, _functionName)

      // Return success.
      return {
        ..._FolderAccountFindUnique,
        'message': 'Account directory found successfully.',
        'status': 'READ_SUCCESSFUL'
      }
    }

    // Report failure.
    return new Error('MISSING__CONTEXT')
  } catch (error) {
    // Report failure.
    return error
  }
}
