/*
 * IMPORTS
 */
import _ from 'underscore' // Npm: utility module.


/*
 * EXPORTS
 */
export default async (__, { projectId }, Context) => {
  // Error handling.
  try {
    /*
     * Only proceed if context is
     * defined else report failure.
     */
    if (Context && Context.isContext) {
      // Const assignment.
      const _functionName = 'Routes -> Project -> Delete'

      // Style guide.
      await Context.Debug({ 'message': `Deleting project with id: ${projectId}` }, _functionName)

      // Get project details of given project id.
      const _ProjectFindUnique = await Context.DataBase.project.findUnique({
        'where': {
          'id': projectId
        }
      })

      // If retrieving project details encounters an exception, report failure.
      if (_.isEmpty(_ProjectFindUnique) || _ProjectFindUnique instanceof Error) {
        // Style guide.
        await Context.Debug({ 'message': `Failed to find project with id: ${projectId}`, 'error': _ProjectFindUnique }, _functionName)

        // Report failure.
        return _ProjectFindUnique instanceof Error ? _ProjectFindUnique : new Error('EXPECTED_PROJECT_DETAILS')
      }

      // Style guide.
      await Context.Debug({ 'message': `Deleting project with id: ${projectId}` }, _functionName)

      // Delete project details of given project id.
      await Context.DataBase.project.update({ 'where': { 'id': projectId }, 'data': { 'isDeleted': true } })

      // Return success.
      return {
        'id': _ProjectFindUnique.id,
        'message': 'Successfully removed the project.',
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
