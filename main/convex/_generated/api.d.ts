/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";
import type * as agentmail from "../agentmail.js";
import type * as attempts from "../attempts.js";
import type * as auth from "../auth.js";
import type * as collection from "../collection.js";
import type * as dashboard from "../dashboard.js";
import type * as debug from "../debug.js";
import type * as email from "../email.js";
import type * as emailTestExample from "../emailTestExample.js";
import type * as http from "../http.js";
import type * as invoices from "../invoices.js";
import type * as myFunctions from "../myFunctions.js";
import type * as openai from "../openai.js";
import type * as payments from "../payments.js";
import type * as seed from "../seed.js";
import type * as testEmail from "../testEmail.js";
import type * as transcripts from "../transcripts.js";
import type * as users from "../users.js";
import type * as vapi from "../vapi.js";
import type * as vapiCalls from "../vapiCalls.js";
import type * as vapiTranscripts from "../vapiTranscripts.js";
import type * as vapi_actions from "../vapi_actions.js";
import type * as vendorState from "../vendorState.js";
import type * as vendors from "../vendors.js";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  agentmail: typeof agentmail;
  attempts: typeof attempts;
  auth: typeof auth;
  collection: typeof collection;
  dashboard: typeof dashboard;
  debug: typeof debug;
  email: typeof email;
  emailTestExample: typeof emailTestExample;
  http: typeof http;
  invoices: typeof invoices;
  myFunctions: typeof myFunctions;
  openai: typeof openai;
  payments: typeof payments;
  seed: typeof seed;
  testEmail: typeof testEmail;
  transcripts: typeof transcripts;
  users: typeof users;
  vapi: typeof vapi;
  vapiCalls: typeof vapiCalls;
  vapiTranscripts: typeof vapiTranscripts;
  vapi_actions: typeof vapi_actions;
  vendorState: typeof vendorState;
  vendors: typeof vendors;
}>;
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;
