/**
 * FHIR R4 primitive type aliases (JSON serialization).
 * @see https://hl7.org/fhir/R4/datatypes.html#primitive
 */

/** Logical id of this artifact */
export type FhirId = string;

/** String of Unicode characters */
export type FhirString = string;

/** URI / OID / UUID (serialized as string in JSON) */
export type FhirUri = string;

/** RFC 3339 date-time */
export type FhirDateTime = string;

/** YYYY-MM-DD */
export type FhirDate = string;

/** Instant (timestamp with timezone) */
export type FhirInstant = string;

/** Whole number */
export type FhirInteger = number;

/** 0 or positive integer */
export type FhirPositiveInt = number;

/** true | false */
export type FhirBoolean = boolean;

/** Code (no whitespace, limited charset) */
export type FhirCode = string;

/** Markdown */
export type FhirMarkdown = string;
