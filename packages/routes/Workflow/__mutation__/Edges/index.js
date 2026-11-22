/*
 * IMPORTS
 */
import _ from 'underscore' // NPM: Utility module.


/*
 * EXPORTS
 */
export default async (__, {
  workflowId,
  edges
}, Context) => {
  // Error handling.
  try {
    /*
     * Only proceed if context is
     * defined else report failure.
     */
    if (Context && Context.isContext) {
      // Const assignment.
      const _functionName = 'Routes -> Workflow -> Update'

      // Style guide.
      await Context.Debug({ 'message': `Updating workflow with id: ${workflowId}` }, _functionName)

      // Get workflow details of given workflow id.
      const _WorkflowFindUnique = await Context.DataBase.workflow.findUnique({ 'where': { 'id': workflowId } })

      // If retrieving workflow details encounters an exception, report failure.
      if (_.isEmpty(_WorkflowFindUnique) || _WorkflowFindUnique instanceof Error) {
        // Const assignment.
        const _error = _WorkflowFindUnique instanceof Error ? _WorkflowFindUnique : new Error('EXPECTED_WORK_FLOW_DETAILS')

        // Style guide.
        await Context.Debug({ 'message': `Failed to find workflow with id: ${workflowId}`, 'error': _error }, _functionName)

        // Report failure.
        return _error
      }

      // Style guide.
      await Context.Debug({ 'message': `Updating workflow with id: ${workflowId}.` }, _functionName)

      // Update workflow details.
      const _WorkflowUpdate = await Context.DataBase.workflow.update({
        'where': {
          'id': _WorkflowFindUnique?.id
        },
        'data': {
          'edges': edges
        }
      })

      /*
       * If creating workflow caught exception
       * then report failure.
       */
      if (_WorkflowUpdate instanceof Error) {
        // Style guide.
        await Context.Debug({ 'message': `Failed to update workflow with id: ${workflowId}.`, 'error': _WorkflowUpdate }, _functionName)

        // Report failure.
        return _WorkflowUpdate
      }

      // Style guide.
      await Context.Debug({ 'message': `Successfully updated workflow with id: ${workflowId}.` }, _functionName)

      // Return success.
      return {
        ..._WorkflowUpdate,
        'message': 'Successfully updated the workflow.',
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
