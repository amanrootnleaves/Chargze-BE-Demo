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
export default async (__, { displayName, description, account }, Context) => {
  // Error handling.
  try {
    /*
     * Only proceed if context is
     * defined else report failure.
     */
    if (Context && Context.isContext) {
      // Const assignment.
      const _whatToQuery = {}
      const _functionName = 'Routes -> Project -> Create'

      // Update displayName and description.
      if (!_.isEmpty(displayName)) Object.assign(_whatToQuery, { displayName })
      if (!_.isEmpty(description)) Object.assign(_whatToQuery, { description })
      if (!_.isEmpty(account)) Object.assign(_whatToQuery, { account })

      // Connect owner to the project.
      Object.assign(_whatToQuery, { 'Account': { 'connect': { 'id': Context.Session.user.id } } })

      // Get Company details.
      const _CompanyOfAccount = await CompanyOfAccount(__, { 'accountId': Context.Session.user.id }, Context)

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

      // Update _whatToQuery with company id
      Object.assign(_whatToQuery, { 'Company': { 'connect': { 'id': _CompanyOfAccount?.[0]?.id } } })


      // Create subAccount under given main account.
      const _ProjectCreate = await Context.DataBase.project.create({
        'data': _whatToQuery
      })

      // If creating project caught exception then report failure.
      if (_ProjectCreate instanceof Error) {
        // Style guide.
        await Context.Debug({ 'message': 'Failed to create project', 'error': _ProjectCreate }, _functionName)

        // Report failure.
        return _ProjectCreate
      }

      /*
       * If account are defined then update query
       * with project account.
       */
      if (!_.isEmpty(account)) {
        // Check for account with given accountId.
        const _AccountFindMany = await Context.DataBase.account.findMany({
          'where': {
            'id': {
              'in': _.compact(_.pluck(account, 'value'))
            }
          }
        })

        // Create new entry.
        const _ProjectEmployeeCreate = await Context.DataBase.projectEmployee.create({
          'data': {
            'Project': {
              'connect': {
                'id': _ProjectCreate.id
              }
            },
            'Account': {
              'connect': _AccountFindMany.map(r => ({ 'id': r.id }))
            }
          }
        })

        // If error is caught then report failure.
        if (_ProjectEmployeeCreate instanceof Error) {
          // Style guide.
          Context.Debug({ 'message': 'Project employee not found', 'error': _ProjectEmployeeCreate }, _functionName)

          // Report failure.
          return _ProjectEmployeeCreate
        }
      }

      // Style guide.
      await Context.Debug({ 'message': `Successfully created the project` }, _functionName)

      // Return success.
      return {
        ..._ProjectCreate,
        'message': 'Successfully created project.',
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
