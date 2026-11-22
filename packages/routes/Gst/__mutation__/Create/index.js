/*
 * IMPORTS
 */
import _ from 'underscore' // Npm: utility module.


/*
 * SIBLINGS
 */
import CompanyOfAccount from '../../../Company/__resolver__/OfAccount'


/*
 * EXPORTS
 */
export default async (__, { accountId, displayName, description, state, country }, Context) => {
  // Error handling.
  try {
    /*
     * Only proceed if context is
     * defined else report failure.
     */
    if (Context && Context.isContext) {
      // Const assignment.
      const _whatToQuery = {}
      const _functionName = 'Routes -> Gst -> Create'

      // Update displayName and description.
      if (!_.isEmpty(displayName)) Object.assign(_whatToQuery, { displayName })
      if (!_.isEmpty(description)) Object.assign(_whatToQuery, { description })
      if (!_.isEmpty(country) && _.isObject(country)) Object.assign(_whatToQuery, { 'country': JSON.stringify(country) })
      if (!_.isEmpty(state) && _.isObject(state)) Object.assign(_whatToQuery, { 'state': JSON.stringify(state) })

      // Get Company details.
      const _CompanyOfAccount = await CompanyOfAccount(__, { 'accountId': accountId || Context.Session.user.id }, Context)

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

      // Const assignment.
      Object.assign(_whatToQuery, { 'Company': { 'connect': { 'id': _CompanyOfAccount?.[0].id } } })
      Object.assign(_whatToQuery, { 'Account': { 'connect': { 'id': accountId || Context.Session.user.id } } })

      // Create subAccount under given main account.
      const _GstCreate = await Context.DataBase.gst.create({
        'data': _whatToQuery
      })

      // If creating gst caught exception then report failure.
      if (_GstCreate instanceof Error) {
        // Style guide.
        await Context.Debug({ 'message': 'Failed to create gst', 'error': _GstCreate }, _functionName)

        // Report failure.
        return _GstCreate
      }

      // Style guide.
      await Context.Debug({ 'message': `Successfully created the gst` }, _functionName)

      // Return success.
      return {
        ..._GstCreate,
        'message': 'Successfully created gst.',
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
