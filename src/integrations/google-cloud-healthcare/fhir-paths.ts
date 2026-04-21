import type { HealthcareApiConfig } from "./config";

/**
 * Builds a FHIR store resource name for REST clients (Healthcare API v1).
 * @see https://cloud.google.com/healthcare-api/docs/how-tos/fhir-resources
 */
export function buildFhirStoreName(config: HealthcareApiConfig): string {
  return `projects/${config.projectId}/locations/${config.location}/datasets/${config.datasetId}/fhirStores/${config.fhirStoreId}`;
}
