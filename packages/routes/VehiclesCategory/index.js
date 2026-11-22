import { mergeTypeDefs } from "@graphql-tools/merge";
import * as IndexResolver from "./__resolver__";
import * as IndexMutation from "./__mutation__";
import IndexGraph from "./index.graphql";

const typeDefs = mergeTypeDefs([IndexGraph]);
const resolvers = IndexResolver;
const Mutation = IndexMutation;
const Subscription = {};

export default { resolvers, Mutation, typeDefs, Subscription };
