import { mergeTypeDefs } from "@graphql-tools/merge";
import * as CreateResolver from "./__resolver__/Create/index.js";
import * as ReadResolver from "./__resolver__/Read/index.js";
import IndexGraph from "./index.graphql";

const typeDefs = mergeTypeDefs([IndexGraph]);
const resolvers = {
  Invitation: {
    id: (parent) => parent.id,
    createdAt: (parent) => parent.createdAt.toISOString(),
    phoneNumber: (parent) => parent.phoneNumber,
    friendName: (parent) => parent.friendName,
    status: (parent) => parent.status,
    invitationLink: (parent) => `https://www.chargze.com/invite?ref=${parent.InvitedBy__fk__}`,
  },
};
const Query = {
  InvitationRead: ReadResolver.Read,
};
const Mutation = {
  InvitationCreate: CreateResolver.Create,
};
const Subscription = {};

export default { resolvers, Mutation, Query, typeDefs, Subscription };
