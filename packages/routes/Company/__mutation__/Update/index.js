/*
 * IMPORTS
 */
import _ from 'underscore' // NPM: Utility module.


/*
 * EXPORTS
 */
export default async (__, {
  companyId,
  displayName,
  address,
  phoneNumber
}, Context) => {
  // Error handling.
  try {
    /*
     * Only proceed if context is
     * defined else report failure.
     */
    if (Context && Context.isContext) {
      // Const assignment.
      const _functionName = 'Routes -> Company -> Update'

      // Style guide.
      await Context.Debug({ 'message': `Updating company with id: ${companyId}` }, _functionName)

      // Get company details of given company id.
      const _CompanyFindUnique = await Context.DataBase.company.findUnique({ 'where': { 'id': companyId }, 'select': { 'Account': { 'where': { 'isDeleted': false }, 'select': { 'id': true } } } })

      // If retrieving company details encounters an exception, report failure.
      if (_.isEmpty(_CompanyFindUnique) || _CompanyFindUnique instanceof Error) {
        // Style guide.
        await Context.Debug({ 'message': `Failed to find company with id: ${companyId}`, 'error': _CompanyFindUnique }, _functionName)

        // Report failure.
        return _CompanyFindUnique instanceof Error ? _CompanyFindUnique : new Error('EXPECTED_COMPANY_DETAILS')
      }

      // Style guide.
      await Context.Debug({ 'message': `Updating company with id: ${companyId}` }, _functionName)

      // Const assignment.
      const _whatToQuery = {}

      // Conditional update of args.
      if (!_.isEmpty(displayName)) Object.assign(_whatToQuery, { displayName })
      if (!_.isEmpty(address)) Object.assign(_whatToQuery, { address })
      if (!_.isEmpty(phoneNumber)) Object.assign(_whatToQuery, { phoneNumber })

      // Update customer account with updates.
      const _CompanyUpdate = await Context.DataBase.company.update({
        'where': {
          'id': _CompanyFindUnique?.id
        },
        'data': _whatToQuery
      })

      /*
       * If creating company caught exception
       * then report failure.
       */
      if (_CompanyUpdate instanceof Error) {
        // Style guide.
        await Context.Debug({ 'message': `Failed to update company with id: ${companyId}`, 'error': _CompanyUpdate }, _functionName)

        // Report failure.
        return _CompanyUpdate
      }

      // Style guide.
      await Context.Debug({ 'message': `Successfully updated company with id: ${companyId}` }, _functionName)

      // Return success.
      return {
        ..._CompanyUpdate,
        'message': 'Successfully updated the company.',
        'status': 'UPDATE_SUCCESSFUL'
      }
    }

    // Report failure.
    return new Error('MISSING__CONTEXT')
  } catch (error) {
    // Report failure.
    return error
  }
}
