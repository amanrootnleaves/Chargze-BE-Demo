/*
 * IMPORTS
 */
import _ from 'underscore' // Npm: utility module.


/*
 * SIBLINGS
 */
import CompanyOfAccount from '../../../Company/__resolver__/OfAccount'
import RoleOfAccount from '../OfAccount'
import AccountReadIds from '../../../Account/__resolver__/ReadIds'


/*
 * EXPORTS
 */
export default async (__, { displayName, description, role = [] }, Context) => {
  // Error handling.
  try {
    /*
     * Only proceed if context is
     * defined else report failure.
     */
    if (Context && Context.isContext) {
      // Const assignment.
      const _whatToQuery = {}
      const _functionName = 'Routes -> Role -> Create'

      // Update displayName and description.
      if (!_.isEmpty(displayName)) Object.assign(_whatToQuery, { displayName })
      if (!_.isEmpty(description)) Object.assign(_whatToQuery, { description })
      if (!_.isEmpty(role)) Object.assign(_whatToQuery, { role })

      // Local variable
      const _CompanyOfAccount = await CompanyOfAccount(__, { 'accountId': Context.Session.user.id }, Context)

      // Report failure if error is caught.
      if (_CompanyOfAccount instanceof Error) return _CompanyOfAccount
      if (_.isEmpty(_CompanyOfAccount)) return new Error('COMPANY_NOT_FOUND')

      Object.assign(_whatToQuery, { 'Company': { 'connect': { 'id': _CompanyOfAccount?.[0]?.id } } })

      // Create subAccount under given main account.
      const _RoleCreate = await Context.DataBase.role.create({
        'data': _whatToQuery
      })

      // If creating role caught exception then report failure.
      if (_RoleCreate instanceof Error) {
        // Style guide.
        await Context.Debug({ 'message': 'Failed to create role', 'error': _RoleCreate }, _functionName)

        // Report failure.
        return _RoleCreate
      }

      // Style guide.
      await Context.Debug({ 'message': `Successfully created the role` }, _functionName)

      // Get ids of users.
      const _userIds = await AccountReadIds(__, { 'idsToLookup': _.compact(_.flatten(_.pluck(role, 'value'))) }, Context)

      // Report failure if error is caught.
      if (_userIds instanceof Error) {
        // Style guide.
        await Context.Debug({ 'message': `Failed to create role.`, 'error': _userIds }, _functionName)

        // Report failure.
        return _userIds
      }

      // Loop through each entry and create role.
      const _RoleOfAccount = await RoleOfAccount(__, { 'accountIds': _userIds, 'role': [displayName], 'dontRemoveOldRole': true }, Context)

      // If Checking scope caught exception.
      if (_RoleOfAccount instanceof Error) {
        // Style guide.
        await Context.Debug({ 'message': `Failed to create role.`, 'error': _RoleOfAccount }, _functionName)

        // Report failure.
        return _RoleOfAccount
      }
      if (_.isEmpty(_RoleOfAccount)) {
        // Const assignment.
        const _error = new Error('EXPECTED_ROLE_TO_EXIST')

        // Style guide.
        await Context.Debug({ 'message': `Failed to create role.`, 'error': _error }, _functionName)

        // Report failure.
        return _error
      }

      // Return success.
      return {
        ..._RoleCreate,
        'message': 'Successfully created role.',
        'status': 'CREATE_SUCCESSFUL'
      }
    }

    // Report failure.
    return new Error('MISSING__CONTEXT')
  } catch (error) {
    // Report failure.
    return error
  }
}
