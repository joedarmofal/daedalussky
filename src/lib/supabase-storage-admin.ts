import { createClient } from "@supabase/supabase-js";

console.log("Initializing Services...", { service: "supabase-storage-admin" });

function serverEnv(name: string): string {
  try {
    if (typeof process !== "undefined" && process.env && typeof process.env[name] === "string") {
      return process.env[name] ?? "";
    }
  } catch {
    // ignore
  }
  return "";
}

const supabaseUrl = serverEnv("NEXT_PUBLIC_SUPABASE_URL");
const serviceRoleKey = serverEnv("SUPABASE_SERVICE_ROLE_KEY");

/**
 * Server-only Supabase client for Storage (not used for end-user auth).
 * Never import this module in Client Components.
 */
export function createSupabaseStorageAdminClient() {
  if (!supabaseUrl.trim() || !serviceRoleKey.trim()) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL and/or SUPABASE_SERVICE_ROLE_KEY.",
    );
  }
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
