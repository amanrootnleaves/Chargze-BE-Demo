
import { mergeTypeDefs } from "@graphql-tools/merge";


import * as IndexResolver from "./__resolver__";
import * as IndexMutation from "./__mutation__";


import IndexGraph from "./index.graphql";
import IndexEnumGraph from "./index.enum.graphql"


const typeDefs = mergeTypeDefs([IndexGraph,IndexEnumGraph]);
const resolvers = IndexResolver;

const Mutation = IndexMutation;
 

export default { resolvers, Mutation, typeDefs };
