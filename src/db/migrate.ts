import { config } from "dotenv";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";

config({ path: ".env.local" });
config({ path: ".env" });

const databaseUrl = process.env.DATABASE_URL;

async function run(): Promise<void> {
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is required to run migrations");
  }

  const migrationClient = postgres(databaseUrl, { max: 1, prepare: false });
  const db = drizzle(migrationClient);

  await migrate(db, { migrationsFolder: "./drizzle" });

  await migrationClient.end();
}

run().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
