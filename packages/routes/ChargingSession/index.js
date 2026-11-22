import { mergeTypeDefs } from "@graphql-tools/merge";
import * as IndexResolver from "./__resolver__";
import * as IndexMutation from "./__mutation__";
import IndexGraph from "./index.graphql";

const typeDefs = mergeTypeDefs([IndexGraph]);
const resolvers = IndexResolver;
const Mutation = IndexMutation;
const Subscription = {};
const Type = {
  ChargingSession: {
    Charger: async (parent, __, Context) => {
      return await Context.DataBase.charger.findUnique({
        where: { id: parent.Charger__fk__ },
        include: {
          ChargingStation: true,
          Connectors: true,
        },
      });
    },
    CustomerProfile: async (parent, __, Context) => {
      return await Context.DataBase.customerProfile.findUnique({
        where: { id: parent.CustomerProfile__fk__ },
      });
    },
    Transaction: async (parent, __, Context) => {
      if (!parent.Transaction__fk__) return null;
      return await Context.DataBase.transaction.findUnique({
        where: { id: parent.Transaction__fk__ },
      });
    },
  },
};

export default { resolvers, Mutation, typeDefs, Subscription, Type };
