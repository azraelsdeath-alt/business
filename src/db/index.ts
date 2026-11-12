/**
 * CreatorOS — Database barrel export
 *
 * Usage:
 *   import { sql, type User } from "~/db";
 *   import { sql } from "~/db"; // for the query helper
 *   import type { User } from "~/db"; // for types only
 */
export { sql } from "./db";
export type * from "./types";