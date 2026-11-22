/*
 * IMPORTS
 */
import _ from 'underscore' // NPM: Utility module.


/*
 * EXPORTS
 */
export default async (__, { accountId, take, skip }, Context) => {
  // Error handling.
  try {
    /*
     * Only proceed if context is
     * defined else report failure.
     */
    if (Context && Context.isContext) {
      // Const assignment.
      const _functionName = 'Routes -> Account -> Scope'

      // Variable assignment.
      take = take ?? 10
      skip = skip ?? 0

      // Style guide.
      await Context.Debug({ 'message': 'Searching i am role details..' }, _functionName)

      // Fetch count of account table.
      const _totalCount = await Context.DataBase.account.count({ 'where': {
        'isDeleted': false,
        'id': accountId || Context.Session.user.id
      } })

      // If query caught exception then report failure.
      if (_totalCount instanceof Error) {
        // Style guide.
        await Context.Debug({ 'message': 'Failed to get count of account details.', 'error': _totalCount }, _functionName)

        // Report failure.
        return _totalCount
      }

      // Fetch all account details from database.
      const _AccountFindUnique = await Context.DataBase.account.findUnique({
        'where': {
          'isDeleted': false,
          'id': accountId || Context.Session.user.id
        },
        'select': {
          'id': true,
          'createdAt': true,
          'updatedAt': true,
          'fullName': true,
          'displayName': true,
          'email': true,
          'phoneNumber': true,
          'address': true,
          'dateOfBirth': true,
          'gender': true,
          'Scope': {
            'where': {
              'isDeleted': false
            },
            take,
            skip
          }
        }
      })

      /*
       * If getting account details contains error
       * than report failure
       */
      if (!_.isEmpty(_AccountFindUnique) && !(_AccountFindUnique instanceof Error)) {
        // Style guide.
        await Context.Debug({ 'message': 'Successfully got given account details.' }, _functionName)

        // Return account details.
        return { ..._AccountFindUnique, _totalCount, 'message': 'Successfully read the accounts', 'status': 'READ_SUCCESSFUL' }
      }

      // Style guide.
      await Context.Debug({ 'message': `Failed to get account details with id: ${Context.Session.user.id}`, 'error': _AccountFindUnique }, _functionName)

      // Report failure.
      return _AccountFindUnique instanceof Error ? _AccountFindUnique : new Error('FAILED_TO_FIND_ACCOUNT')
    }

    // Report failure.
    return new Error('MISSING__CONTEXT')
  } catch (error) {
    // Report failure.
    return error
  }
}
