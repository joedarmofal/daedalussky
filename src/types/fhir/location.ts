import type {
  FhirAddress,
  FhirCodeableConcept,
  FhirCoding,
  FhirContactPoint,
  FhirExtension,
  FhirIdentifier,
  FhirMeta,
  FhirNarrative,
  FhirReference,
} from "./datatypes";
import type { FhirCode, FhirId, FhirString, FhirUri } from "./primitives";

/**
 * FHIR R4 Location — use for departure/arrival sites, helipads, or operational bases tied to a mission Encounter.
 * @see https://hl7.org/fhir/R4/location.html
 */
export type FhirLocation = {
  resourceType: "Location";
  id?: FhirId;
  meta?: FhirMeta;
  implicitRules?: FhirUri;
  language?: FhirCode;
  text?: FhirNarrative;
  extension?: FhirExtension[];
  modifierExtension?: FhirExtension[];
  identifier?: FhirIdentifier[];
  status?: "active" | "suspended" | "inactive";
  operationalStatus?: FhirCoding;
  name?: FhirString;
  alias?: FhirString[];
  description?: FhirString;
  mode?: "instance" | "kind";
  type?: FhirCodeableConcept[];
  telecom?: FhirContactPoint[];
  address?: FhirAddress;
  physicalType?: FhirCodeableConcept;
  position?: FhirLocationPosition;
  managingOrganization?: FhirReference;
  partOf?: FhirReference;
  hoursOfOperation?: FhirLocationHoursOfOperation[];
};

export type FhirLocationPosition = {
  longitude: number;
  latitude: number;
  altitude?: number;
};

export type FhirLocationHoursOfOperation = {
  daysOfWeek?: (
    | "mon"
    | "tue"
    | "wed"
    | "thu"
    | "fri"
    | "sat"
    | "sun"
  )[];
  allDay?: boolean;
  openingTime?: FhirString;
  closingTime?: FhirString;
};
