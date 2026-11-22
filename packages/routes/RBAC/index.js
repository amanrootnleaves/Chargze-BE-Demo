/*
 * IMPORTS
 */
import { mergeTypeDefs } from '@graphql-tools/merge' // Npm: graphql typeDefs merger.

 
/*
 * HANDLERS
 */
import * as IndexMutation from './__mutation__'
import * as IndexResolver from './__resolver__'



/*
 * GRAPH
 */
import IndexGraph from './index.graphql'
import IndexEnumGraph from './index.enum.graphql'


/*
 * GLOBALS
 */
const typeDefs = mergeTypeDefs([IndexGraph,IndexEnumGraph])
const resolvers = IndexResolver
const Mutation = IndexMutation



/*
 * EXPORTS
 */
export default { resolvers, Mutation, typeDefs }
