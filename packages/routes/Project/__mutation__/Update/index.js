/*
 * IMPORTS
 */
import _ from 'underscore' // NPM: Utility module.


/*
 * EXPORTS
 */
export default async (__, {
  projectId,
  displayName,
  description,
  account
}, Context) => {
  // Error handling.
  try {
    /*
     * Only proceed if context is
     * defined else report failure.
     */
    if (Context && Context.isContext) {
      // Const assignment.
      const _whatToQuery = {}
      const _functionName = 'Routes -> Project -> Update'

      // Style guide.
      await Context.Debug({ 'message': `Updating project with id: ${projectId}` }, _functionName)

      // Get project details of given project id.
      const _ProjectFindUnique = await Context.DataBase.project.findUnique({ 'where': { 'id': projectId } })

      // If retrieving project details encounters an exception, report failure.
      if (_.isEmpty(_ProjectFindUnique) || _ProjectFindUnique instanceof Error) {
        // Style guide.
        await Context.Debug({ 'message': `Failed to find project with id: ${projectId}`, 'error': _ProjectFindUnique }, _functionName)

        // Report failure.
        return _ProjectFindUnique instanceof Error ? _ProjectFindUnique : new Error('EXPECTED_PROJECT_DETAILS')
      }

      // Style guide.
      await Context.Debug({ 'message': `Updating project with id: ${projectId}` }, _functionName)

      // Update displayName and description.
      if (!_.isEmpty(displayName)) Object.assign(_whatToQuery, { displayName })
      if (!_.isEmpty(description)) Object.assign(_whatToQuery, { description })
      if (!_.isEmpty(account)) Object.assign(_whatToQuery, { account })

      // Update project details.
      const _ProjectUpdate = await Context.DataBase.project.update({
        'where': {
          'id': _ProjectFindUnique?.id
        },
        'data': _whatToQuery
      })

      /*
       * If creating project caught exception
       * then report failure.
       */
      if (_ProjectUpdate instanceof Error) {
        // Style guide.
        await Context.Debug({ 'message': `Failed to update project with id: ${projectId}`, 'error': _ProjectUpdate }, _functionName)

        // Report failure.
        return _ProjectUpdate
      }

      // Check for account with given accountId.
      const _AccountFindMany = await Context.DataBase.account.findMany({
        'where': {
          'id': {
            'in': _.compact(_.pluck(account, 'value'))
          }
        }
      })

      // Local variable.
      let _ProjectEmployeeFindMany

      // Connect given user with this.
      _ProjectEmployeeFindMany = await Context.DataBase.projectEmployee.findMany({
        'where': {
          'Project__fk__': _ProjectFindUnique.id
        }
      })
      _ProjectEmployeeFindMany = !_.isEmpty(_ProjectEmployeeFindMany) && _.isArray(_ProjectEmployeeFindMany) ? _.first(_ProjectEmployeeFindMany) : _ProjectEmployeeFindMany

      // If error is caught then report failure.
      if (_ProjectEmployeeFindMany instanceof Error) {
        // Style guide.
        Context.Debug({ 'message': 'Project employee not found', 'error': _ProjectEmployeeFindMany }, _functionName)

        // Report failure.
        return _ProjectEmployeeFindMany
      }

      /*
       * If already entry is found related to this project
       * then update assigned account else create new entry.
       */
      if (_.isEmpty(_ProjectEmployeeFindMany)) {
        // Create new entry.
        const _ProjectEmployeeCreate = await Context.DataBase.projectEmployee.create({
          'data': {
            'Project': {
              'connect': {
                'id': _ProjectFindUnique.id
              }
            },
            'Account': {
              'connect': _AccountFindMany.map(ac => ({ 'id': ac.id }))
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

        // Report success.
        return {
          ..._ProjectEmployeeCreate,
          'status': 'CREATE_SUCCESSFUL',
          'message': 'Project employee created successfully'
        }
      }

      // Remove all previous connections.
      await Context.DataBase.projectEmployee.update({
        'where': {
          'id': _ProjectEmployeeFindMany.id
        },
        'data': {
          'Account': {
            'set': []
          }
        }
      })

      // Update existing entry.
      const _ProjectEmployeeUpdate = await Context.DataBase.projectEmployee.update({
        'where': {
          'id': _ProjectEmployeeFindMany.id
        },
        'data': {
          'Account': {
            'connect': _AccountFindMany.map(ac => ({ 'id': ac.id }))
          }
        }
      })

      // If error is caught then report failure.
      if (_ProjectEmployeeUpdate instanceof Error) {
        // Style guide.
        Context.Debug({ 'message': 'Project employee not found', 'error': _ProjectEmployeeUpdate }, _functionName)

        // Report failure.
        return _ProjectEmployeeUpdate
      }

      // Style guide.
      await Context.Debug({ 'message': `Successfully updated project with id: ${projectId}` }, _functionName)

      // Return success.
      return {
        ..._ProjectUpdate,
        'message': 'Successfully updated the project.',
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
