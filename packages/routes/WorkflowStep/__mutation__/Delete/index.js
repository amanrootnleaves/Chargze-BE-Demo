/*
 * IMPORTS
 */
import _ from 'underscore' // Npm: utility module.


/*
 * EXPORTS
 */
export default async (__, { workflowStepId }, Context) => {
  // Error handling.
  try {
    /*
     * Only proceed if context is
     * defined else report failure.
     */
    if (Context && Context.isContext) {
      // Const assignment.
      const _functionName = 'Routes -> WorkflowStep -> Delete'

      // Style guide.
      await Context.Debug({ 'message': `Deleting workflowStep with id: ${workflowStepId}.` }, _functionName)

      // Get workflowStep details of given workflowStep id.
      const _WorkflowStepFindUnique = await Context.DataBase.workflowStep.findUnique({
        'where': {
          'id': workflowStepId
        }
      })

      // If retrieving workflowStep details encounters an exception, report failure.
      if (_.isEmpty(_WorkflowStepFindUnique) || _WorkflowStepFindUnique instanceof Error) {
        // Style guide.
        await Context.Debug({ 'message': `Failed to find workflowStep with id: ${workflowStepId}`, 'error': _WorkflowStepFindUnique }, _functionName)

        // Report failure.
        return _WorkflowStepFindUnique instanceof Error ? _WorkflowStepFindUnique : new Error('EXPECTED_WORK_FLOW_STEP_DETAILS')
      }

      // Style guide.
      await Context.Debug({ 'message': `Deleting workflowStep with id: ${workflowStepId}.` }, _functionName)

      // Delete workflowStep details of given workflowStep id.
      await Context.DataBase.workflowStep.update({ 'where': { 'id': workflowStepId }, 'data': { 'isDeleted': true } })

      // Return success.
      return {
        'id': _WorkflowStepFindUnique.id,
        'message': 'Successfully removed the node from workflow.',
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
