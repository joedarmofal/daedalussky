/**
 * Server-only configuration for Google Cloud Healthcare API.
 * Wire these in Route Handlers / Server Actions; never import from Client Components.
 */

export type HealthcareApiConfig = {
  projectId: string;
  location: string;
  datasetId: string;
  fhirStoreId: string;
};

function readRequiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

/**
 * Returns validated config. Throws if required variables are absent.
 * Use lazy evaluation inside server handlers to avoid build-time failures when env is injected at runtime.
 */
export function getHealthcareApiConfig(): HealthcareApiConfig {
  return {
    projectId: readRequiredEnv("GCP_PROJECT_ID"),
    location: readRequiredEnv("GCP_HEALTHCARE_LOCATION"),
    datasetId: readRequiredEnv("GCP_HEALTHCARE_DATASET_ID"),
    fhirStoreId: readRequiredEnv("GCP_FHIR_STORE_ID"),
  };
}
