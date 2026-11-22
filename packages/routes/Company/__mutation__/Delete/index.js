/*
 * IMPORTS
 */
import _ from 'underscore' // Npm: utility module.


/*
 * EXPORTS
 */
export default async (__, { companyId }, Context) => {
  // Error handling.
  try {
    /*
     * Only proceed if context is
     * defined else report failure.
     */
    if (Context && Context.isContext) {
      // Const assignment.
      const _functionName = 'Routes -> Company -> Delete'

      // Style guide.
      await Context.Debug({ 'message': `Deleting company with id: ${companyId}` }, _functionName)

      // Get company details of given company id.
      const _CompanyFindUnique = await Context.DataBase.company.findUnique({
        'where': {
          'id': companyId
        },
        'select': {
          'id': true,
          'Account': {
            'where': { 'isDeleted': false },
            'select': {
              'id': true
            }
          }
        }
      })

      // If retrieving company details encounters an exception, report failure.
      if (_.isEmpty(_CompanyFindUnique) || _CompanyFindUnique instanceof Error) {
        // Style guide.
        await Context.Debug({ 'message': `Failed to find company with id: ${companyId}`, 'error': _CompanyFindUnique }, _functionName)

        // Report failure.
        return _CompanyFindUnique instanceof Error ? _CompanyFindUnique : new Error('EXPECTED_COMPANY_DETAILS')
      }

      // Style guide.
      await Context.Debug({ 'message': `Deleting company with id: ${companyId}` }, _functionName)

      // Delete company details of given company id.
      await Context.DataBase.company.update({ 'where': { 'id': companyId }, 'data': { 'isDeleted': true } })

      // Remove associated Account Login.
      _CompanyFindUnique?.Account?.id && await Context.DataBase.Account.delete({ 'where': { 'id': _CompanyFindUnique?.Account?.id } })

      // Return success.
      return {
        'id': _CompanyFindUnique.id,
        'message': 'Successfully removed the company.',
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
