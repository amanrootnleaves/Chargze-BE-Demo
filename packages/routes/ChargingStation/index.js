import { mergeTypeDefs } from "@graphql-tools/merge";
import * as IndexResolver from "./__resolver__";
import * as IndexMutation from "./__mutation__";
import IndexGraph from "./index.graphql";
import IndexEnumGraph from './index.enum.graphql'


const typeDefs = mergeTypeDefs([IndexGraph,IndexEnumGraph]);
const resolvers = IndexResolver;
const Mutation = IndexMutation;
const Subscription = {};
const Type = {
  ChargingStation: {
    isFavorite: async (parent, __, Context) => {
      if (!Context.Session?.user?.id) return false;
      const accountId = Context.Session.user.id;

      const customerProfile = await Context.DataBase.customerProfile.findUnique(
        {
          where: { Account__fk__: accountId },
        },
      );
      if (!customerProfile || !parent?.id) return false;

      const favorite = await Context.DataBase.favoriteStation.findUnique({
        where: {
          CustomerProfile__fk___ChargingStation__fk__: {
            CustomerProfile__fk__: customerProfile.id,
            ChargingStation__fk__: parent.id,
          },
        },
      });
      return !!favorite && !favorite.isDeleted;
    },
    chargers: (parent) => parent.Chargers,

    company: (parent) => parent.Company,
    stationOwner: (parent) => parent.StationOwner || parent.stationOwner,
    ownerId: (parent) => parent.StationOwner__fk__ ?? parent.ownerId ?? null,

    
    stationReviews: async (parent, __, Context) => {
      return await Context.DataBase.stationReview.findMany({
        where: { ChargingStation__fk__: parent.id },
        include: {
          CustomerProfile: true,
        },
      });
    },
    weeklyHours: (parent) => parent.WeeklyHours,
    StationHours: async (parent, __, Context) => {
      if (!parent?.id) return [];
      return await Context.DataBase.stationHours.findMany({
        where: { ChargingStation__fk__: parent.id, isDeleted: false },
        orderBy: { dayOfWeek: "asc" }
      });
    }
  },
  Charger: {
    chargingStation: (parent) => parent.ChargingStation,
    connectors: (parent) => parent.Connectors,
  },

    
  }


export default { resolvers, Mutation, typeDefs, Subscription, Type };
