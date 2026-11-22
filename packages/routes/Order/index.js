/*
 * IMPORTS
 */
import { mergeTypeDefs } from "@graphql-tools/merge"; // Npm: graphql typeDefs merger.

/*
 * HANDLERS
 */
import * as IndexResolver from "./__resolver__";
import * as IndexMutation from "./__mutation__";

/*
 * GRAPH
 */
import IndexGraph from "./index.graphql";

/*
 * GLOBALS
 */
const typeDefs = mergeTypeDefs([IndexGraph]);
const resolvers = IndexResolver;
const Mutation = IndexMutation;
const Subscription = {};

/*
 * EXPORTS
 */
export default { resolvers, Mutation, typeDefs, Subscription };
