/**
 * Drizzle ORM entry — same pattern as Supabase docs (`postgres` + `prepare: false` for pooler).
 * Schema: `src/db/schema/*` (organizations, members, certifications). Migrations: `drizzle/`.
 */
export { createDb, getDb, type Database } from "./client";
export * from "./schema";
