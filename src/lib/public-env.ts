/**
 * Safe public env reads for the browser and App Hosting bundles where `process`
 * may be undefined at runtime even when `NEXT_PUBLIC_*` vars exist at build time.
 */
export function getPublicEnv(name: string): string {
  try {
    if (typeof process !== "undefined" && process.env && typeof process.env[name] === "string") {
      return process.env[name] ?? "";
    }
  } catch {
    // ignore
  }
  return "";
}

export function getNodeEnv(): "development" | "production" | "test" | string {
  try {
    if (typeof process !== "undefined" && process.env?.NODE_ENV) {
      return process.env.NODE_ENV;
    }
  } catch {
    // ignore
  }
  return "production";
}
