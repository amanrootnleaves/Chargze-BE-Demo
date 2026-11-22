/*
 * IMPORTS
 */
import _ from 'underscore' // Npm: utility module.


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
      const _functionName = 'Routes -> FolderAccount -> Delete'

      // Style guide.
      await Context.Debug({ 'message': 'Deleting account directory.' }, _functionName)

      // Search account directory with given id.
      const _AccountFindUnique = await Context.DataBase.folderAccount.findUnique({ 'where': { 'id': folderAccountId } })

      /*
       * If searching account directory caught exception
       * then report failure.
       */
      if (_AccountFindUnique instanceof Error) {
        // Style guide.
        await Context.Debug({ 'message': 'Failed to find account directory.', 'error': _AccountFindUnique }, _functionName)

        // Report failure.
        return _AccountFindUnique
      }
      if (_.isEmpty(_AccountFindUnique)) {
        // Style guide.
        await Context.Debug({ 'message': 'Failed to find account directory.' }, _functionName)

        // Report failure.
        return new Error('EXPECTED_FOLDER_ACCOUNT_DETAILS')
      }

      // Style guide.
      await Context.Debug({ 'message': 'Successfully found the account directory.' }, _functionName)
      await Context.Debug({ 'message': `Deleting account directory with id: ${folderAccountId}` }, _functionName)

      // Delete given account directory if no account exists.
      await Context.DataBase.folderAccount.update({
        'where': {
          'id': folderAccountId
        },
        'data': {
          'isDeleted': true,
          'Account': {
            'updateMany': {
              'where': {
                'isDeleted': false
              },
              'data': {
                'isDeleted': true
              }
            }
          }
        }
      })

      // Return success.
      return {
        ..._AccountFindUnique,
        'message': 'Account directory deleted successfully.',
        'status': 'DELETE_SUCCESSFUL'
      }
    }

    // Report failure.
    return new Error('MISSING__CONTEXT')
  } catch (error) {
    // Report failure.
    return error
  }
}
