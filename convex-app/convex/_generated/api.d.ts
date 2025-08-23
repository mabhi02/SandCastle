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
import type * as auth from "../auth.js";
import type * as collection from "../collection.js";
import type * as dashboard from "../dashboard.js";
import type * as http from "../http.js";
import type * as myFunctions from "../myFunctions.js";
import type * as payments from "../payments.js";
import type * as transcripts from "../transcripts.js";
import type * as users from "../users.js";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  auth: typeof auth;
  collection: typeof collection;
  dashboard: typeof dashboard;
  http: typeof http;
  myFunctions: typeof myFunctions;
  payments: typeof payments;
  transcripts: typeof transcripts;
  users: typeof users;
}>;
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;
