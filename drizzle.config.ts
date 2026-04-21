import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";

config({ path: ".env.local" });
config({ path: ".env" });

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl && process.argv.some((a) => a.includes("drizzle-kit"))) {
  // drizzle-kit loads config without failing when URL missing (e.g. CI lint-only)
  console.warn(
    "[drizzle.config] DATABASE_URL is not set; generate/migrate require it.",
  );
}

export default defineConfig({
  schema: "./src/db/schema/index.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: databaseUrl ?? "postgresql://127.0.0.1:5432/postgres",
  },
  strict: true,
  verbose: true,
});
