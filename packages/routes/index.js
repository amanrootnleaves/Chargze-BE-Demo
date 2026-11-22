
import { resolvers } from "graphql-scalars"; 
import { mergeTypeDefs } from "@graphql-tools/merge"; 
import { makeExecutableSchema } from "@graphql-tools/schema"; 
import { createSchema } from "graphql-yoga";
import { defaultFieldResolver } from "graphql"; 
import { GraphQLLiveDirective } from "@n1ru4l/graphql-live-query"; 
import {
  astFromDirective,
  getDirective,
  MapperKind,
  mapSchema,
} from "@graphql-tools/utils"; 


import Account from "./Account";
import SystemInformation from "./SystemInformation";
import Company from "./Company";
import Gst from "./Gst";
import DynamicColumn from "./DynamicColumn";
import Scope from "./Scope";
import Role from "./Role";
import Feature from "./Feature";
import Workflow from "./Workflow";
import WorkflowStep from "./WorkflowStep";
import CompanyFeatureEntry from "./CompanyFeatureEntry";
import Project from "./Project";
import FolderAccount from "./FolderAccount";
import Order from "./Order";
import Transaction from "./Transaction";
import Customer from "./Customer";
import Product from "./Product";
import Cart from "./Cart";
import Category from "./Category";
import VehiclesCategory from "./VehiclesCategory";
import ElectricVehicle from "./ElectricVehicle";
import ChargingStation from "./ChargingStation";
import ChargingSession from "./ChargingSession";
import Invitation from "./Invitation";
import FAQ from "./FAQ";
import CustomerVehicle from "./CustomerVehicle";
import MobileStats from "./MobileStats";
import StationOwner from "./StationOwner";
import FleetOwner from "./FleetOwner";
import RFID from "./RFID"; 
import FleetHubInvoice from "./FleetHubInvoice";
import RBAC from "./RBAC";
import PromoCode from "./PromoCode";
import ChargzeSettings from "./ChargzeSettings"; 
import ReferEarn from "./ReferEarn";
import * as RootScalars from "./__scalar__";


import MainGraph from "./index.graphql";
import MainDirectiveGraph from "./index.directive.graphql";
import MainScalarGraph from "./index.scalar.graphql";


const GlobalMutation = {};
const GlobalSubscription = {};
const GlobalResolver = {};


const typeDefs = makeExecutableSchema({
  typeDefs: mergeTypeDefs([
    require("graphql-scalars").typeDefs,
    MainGraph,
    MainScalarGraph,
    MainDirectiveGraph,
    Account.typeDefs,
    Workflow.typeDefs,
    WorkflowStep.typeDefs,
    SystemInformation.typeDefs,
    Company.typeDefs,
    Scope.typeDefs,
    DynamicColumn.typeDefs,
    Role.typeDefs,
    Feature.typeDefs,
    FolderAccount.typeDefs,
    CompanyFeatureEntry.typeDefs,
    Project.typeDefs,
    Gst.typeDefs,
    Gst.typeDefs,
    Order.typeDefs,
    Transaction.typeDefs,
    Customer.typeDefs,
    Product.typeDefs,
    Cart.typeDefs,
    Category.typeDefs,
    VehiclesCategory.typeDefs,
    ElectricVehicle.typeDefs,
    ChargingStation.typeDefs,
    ChargingSession.typeDefs,
    Invitation.typeDefs,
    FAQ.typeDefs,
    CustomerVehicle.typeDefs,
    MobileStats.typeDefs,
    StationOwner.typeDefs,
    FleetOwner.typeDefs,
    RFID.typeDefs,
    FleetHubInvoice.typeDefs,
    RBAC.typeDefs,
    PromoCode.typeDefs,
    ChargzeSettings.typeDefs,
    ReferEarn.typeDefs,
    astFromDirective(GraphQLLiveDirective),
  ]),
});


const _definition = {
  typeDefs,
  resolvers: {
    ...RootScalars,
    ...resolvers,
    ...ChargingStation.Type,
    ...ChargingSession.Type,
    ...Invitation.resolvers,
    Query: {
      ...GlobalResolver,
      ...Account.resolvers,
      ...SystemInformation.resolvers,
      ...Company.resolvers,
      ...Scope.resolvers,
      ...Workflow.resolvers,
      ...WorkflowStep.resolvers,
      ...DynamicColumn.resolvers,
      ...Feature.resolvers,
      ...Role.resolvers,
      ...FolderAccount.resolvers,
      ...CompanyFeatureEntry.resolvers,
      ...Project.resolvers,
      ...Gst.resolvers,
      ...Gst.resolvers,
      ...Order.resolvers,
      ...Transaction.resolvers,
      ...Customer.resolvers,
      ...Product.resolvers,
      ...Cart.resolvers,
      ...Category.resolvers,
      ...VehiclesCategory.resolvers,
      ...ElectricVehicle.resolvers,
      ...ChargingStation.resolvers,
      ...ChargingSession.resolvers,
      ...FAQ.resolvers,
      ...CustomerVehicle.resolvers,
      ...MobileStats.resolvers,
      ...StationOwner.resolvers,
      ...FleetOwner.resolvers,
      ...RFID.resolvers,
      ...FleetHubInvoice.resolvers,
      ...RBAC.resolvers,
      ...PromoCode.resolvers,
      ...ChargzeSettings.resolvers,
      ...ReferEarn.resolvers
    },
    Mutation: {
      ...GlobalMutation,
      ...Account.Mutation,
      ...SystemInformation.Mutation,
      ...Company.Mutation,
      ...Scope.Mutation,
      ...Workflow.Mutation,
      ...WorkflowStep.Mutation,
      ...DynamicColumn.Mutation,
      ...Feature.Mutation,
      ...FolderAccount.Mutation,
      ...Role.Mutation,
      ...CompanyFeatureEntry.Mutation,
      ...Project.Mutation,
      ...Gst.Mutation,
      ...Gst.Mutation,
      ...Order.Mutation,
      ...Transaction.Mutation,
      ...Customer.Mutation,
      ...Product.Mutation,
      ...Cart.Mutation,
      ...Category.Mutation,
      ...VehiclesCategory.Mutation,
      ...ElectricVehicle.Mutation,
      ...ChargingStation.Mutation,
      ...ChargingSession.Mutation,
      ...Invitation.Mutation,
      ...FAQ.Mutation,
      ...CustomerVehicle.Mutation,
      ...MobileStats.Mutation,
      ...StationOwner.Mutation,
      ...FleetOwner.Mutation,
      ...RFID.Mutation,
      ...FleetHubInvoice.Mutation,
      ...RBAC.Mutation,
      ...PromoCode.Mutation,
      ...ChargzeSettings.Mutation,
      ...ReferEarn.Mutation
    },
    Subscription: {
      ...GlobalSubscription,
      ...Account.Subscription,
      ...Workflow.Subscription,
      ...WorkflowStep.Subscription,
      ...SystemInformation.Subscription,
      ...Company.Subscription,
      ...Scope.Subscription,
      ...DynamicColumn.Subscription,
      ...Feature.Subscription,
      ...FolderAccount.Subscription,
      ...Role.Subscription,
      ...CompanyFeatureEntry.Subscription,
      ...Project.Subscription,
      ...Gst.Subscription,
      ...Gst.Subscription,
      ...Order.Subscription,
      ...Transaction.Subscription,
      ...Customer.Subscription,
      ...Product.Subscription,
      ...ElectricVehicle.Subscription,
      ...FAQ.Subscription,
      ...CustomerVehicle.Subscription,
      ...MobileStats.Subscription,
      ...StationOwner.Subscription,
      ...FleetOwner.Subscription,
      ...RFID.Subscription,
      ...PromoCode.Subscription,
      ...ReferEarn.Subscription
    },
  },
  schemaDirectives: {},
};

/*
 * TYPEDEF
 */
const Schema = createSchema({
  typeDefs: _definition.typeDefs,
  resolvers: _definition.resolvers,
  directives: _definition.schemaDirectives,
});

/*
 * DIRECTIVES
 */
const _directivesToRegister = { ...Account.Directive };

/*
 * REGISTER
 */
for (const _directiveToRegister of Object.entries(_directivesToRegister)) {
  // Register the directive.
  Object.assign(
    Schema,
    mapSchema(Schema, {
      [MapperKind.FIELD](fieldConfig) {
        // Const assignment.
        const _getDirective = getDirective(
          Schema,
          fieldConfig,
          _directiveToRegister[0],
        )?.[0];

        // Only continue if directive exists.
        if (_getDirective) {
          // Get Default resolver from config.
          const { resolve = defaultFieldResolver } = fieldConfig;

          // Return the resolved field.
          fieldConfig.resolve = (source, args, context, info) =>
            _directiveToRegister[1](
              resolve,
              _getDirective,
              source,
              args,
              context,
              info,
            );
        }

        // Return field.
        return fieldConfig;
      },
    }),
  );
}

/*
 * EXPORTS
 */
export default Schema;
