/*
 * IMPORTS
 */
import _ from 'underscore' // Npm: utility module.


/*
 * EXPORTS
 */
export default async (__, { workflowId, workflowStepId, position, style, data }, Context) => {
  // Error handling.
  try {
    /*
     * Only proceed if context is
     * defined else report failure.
     */
    if (Context && Context.isContext) {
      // Const assignment.
      const _functionName = 'Routes -> WorkflowStep -> Create'

      // Search for given workflow.
      const _WorkflowFindUnique = await Context.DataBase.workflow.findUnique({ 'where': { 'id': workflowId } })

      // If workflow is not found, report failure.
      if (_.isEmpty(_WorkflowFindUnique)) return new Error('WORKFLOW_NOT_FOUND')

      // Create workflow steps.
      const _WorkflowStepCreate = await Context.DataBase.workflowStep.create({
        'data': {
          'id': workflowStepId,
          'position': position,
          'style': style,
          'data': data,
          'Workflow': {
            'connect': { 'id': workflowId }
          }
        }
      })

      // Report failure if workflow steps creation fails.
      if (_.isEmpty(_WorkflowStepCreate)) return new Error('WORKFLOW_STEPS_CREATE_FAILED')

      // Style guide.
      await Context.Debug({ 'message': `Successfully created the workflow steps.` }, _functionName)

      // Return success.
      return {
        ..._WorkflowStepCreate,
        'message': 'Successfully added the node to workflow.',
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
