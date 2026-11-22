/*
 * IMPORTS
 */
import _ from 'underscore' // Npm: utility module.


/*
 * EXPORTS
 */
export default async (__, { workflowId }, Context) => {
  // Error handling.
  try {
    /*
     * Only proceed if context is
     * defined else report failure.
     */
    if (Context && Context.isContext) {
      // Const assignment.
      const _functionName = 'Routes -> Workflow -> Delete'

      // Style guide.
      await Context.Debug({ 'message': `Deleting workflow with id: ${workflowId}.` }, _functionName)

      // Get workflow details of given workflow id.
      const _WorkflowFindUnique = await Context.DataBase.workflow.findUnique({
        'where': {
          'id': workflowId
        }
      })

      // If retrieving workflow details encounters an exception, report failure.
      if (_.isEmpty(_WorkflowFindUnique) || _WorkflowFindUnique instanceof Error) {
        // Style guide.
        await Context.Debug({ 'message': `Failed to find workflow with id: ${workflowId}`, 'error': _WorkflowFindUnique }, _functionName)

        // Report failure.
        return _WorkflowFindUnique instanceof Error ? _WorkflowFindUnique : new Error('EXPECTED_WORK_FLOW_DETAILS')
      }

      // Style guide.
      await Context.Debug({ 'message': `Deleting workflow with id: ${workflowId}.` }, _functionName)

      // Delete workflow details of given workflow id.
      await Context.DataBase.workflow.update({ 'where': { 'id': workflowId }, 'data': { 'isDeleted': true, 'WorkflowStep': { 'deleteMany': { 'Workflow__fk__': workflowId } } } })

      // Return success.
      return {
        'id': _WorkflowFindUnique.id,
        'message': 'Successfully removed the workflow.',
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
