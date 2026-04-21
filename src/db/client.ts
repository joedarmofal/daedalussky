import { drizzle } from "drizzle-orm/postgres-js";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import * as schema from "./schema";

export type Database = PostgresJsDatabase<typeof schema>;

let client: ReturnType<typeof postgres> | null = null;
let db: Database | null = null;

/**
 * Server-only Drizzle client. Use from Route Handlers, Server Actions, or jobs — not in Client Components.
 */
export function createDb(connectionString: string): Database {
  const sql = postgres(connectionString, { prepare: false, max: 10 });
  return drizzle(sql, { schema });
}

export function getDb(): Database {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL is not set");
  }
  if (!db) {
    client = postgres(url, { prepare: false, max: 10 });
    db = drizzle(client, { schema });
  }
  return db;
}
