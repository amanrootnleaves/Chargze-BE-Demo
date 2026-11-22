/*
 * EXPORTS
 */
import _ from 'underscore' // NPM: Utility module.


/*
 * EXPORTS
 */
export default async (__, { workflowId, accountId }, Context) => {
  // Error handling.
  try {
    /*
     * Only proceed if context is
     * defined else report failure.
     */
    if (Context && Context.isContext) {
      // Const assignment.
      const _functionName = 'Routes -> WorkflowStep -> Condition'

      // Style guide.
      await Context.Debug({ 'message': 'Searching workflows conditions.' }, _functionName)

      // Fetch workflow with steps and edges.
      const workflow = await Context.DataBase.workflow.findUnique({
        'where': { 'id': workflowId },
        'include': {
          'WorkflowStep': {
            'where': {
              'isDeleted': false
            }
          }
        }
      })

      // Report failure.
      if (_.isEmpty(workflow)) throw new Error('EXPECTED_WORKFLOW')

      // Extract edges and steps.
      const edges = workflow.edges || []
      const steps = workflow.WorkflowStep

      // Create a quick lookup by ID for steps
      const stepMap = new Map(steps.map(step => [step.id, step]))

      // Build adjacency list from edges.
      const graph = {}

      // Loop over edges and build adjacency list.
      for (const edge of edges) {
        // If edge source does not exist in graph, initialize it.
        if (!graph[edge.source]) graph[edge.source] = []

        // Push edge target to adjacency list.
        graph[edge.source].push(edge.target)
      }

      // Find start nodes (nodes that are never a target)
      const allTargets = new Set(
        edges
          .filter(e => 'start' !== e.target && 'start' !== e.source)
          .map(e => e.target)
      )
      const startNodes = steps.filter(s => !allTargets.has(s.id))
      const visited = new Set()
      const collectedData = []

      // Execute transaction.
      await Context.DataBase.$transaction(() => {
        // Check if a step has an account.
        const hasAccount = async __step => {
          // Local variable.
          let _UserMany

          // Check if user exists in given role of given step.
          _UserMany = await Context.DataBase.role.findMany({
            'where': {
              'id': __step.role.value,
              'Account': {
                'some': {
                  'id': accountId
                }
              }
            }
          })
          _UserMany = _.first(_UserMany)

          // Check if user exists.
          if (_UserMany) return true

          // Report failure.
          return false
        }

        // Dfs to traverse the graph.
        const dfs = async (nodeId, pathData = []) => {
          // If node has not been visited.
          if (visited.has(nodeId)) return

          // Add node to visited set.
          visited.add(nodeId)

          // Get step details.
          const step = stepMap.get(nodeId)

          // If step is not found, return.
          if (!step) return

          // Collect node data
          pathData.push(step.conditions)

          // If this node contains the account, stop traversal here
          if (await hasAccount(step)) {
            // Collect data for this path.
            collectedData.push(step.conditions)

            // Return early.
            return
          }

          // Traverse children.
          const nextNodes = graph[nodeId] || []

          // Loop through next nodes.
          for (const next of nextNodes) {
            // Execute dfs on next node.
            dfs(next, step.conditions)
          }
        }

        // Const assignment.
        const _dfsPromise = []

        // Start traversal from each root node
        for (const start of startNodes) {
          // Execute dfs on start node.
          _dfsPromise.push(dfs(start.id, []))
        }

        // Await all.
        return Promise.all(_dfsPromise)
      }, {
        'timeout': 10000,
        'maxWait': 10000
      })

      // Return collected data.
      return _.compact(_.flatten(collectedData))
    }

    // Report failure.
    return new Error('MISSING__CONTEXT')
  } catch (error) {
    // Report failure.
    return error
  }
}
