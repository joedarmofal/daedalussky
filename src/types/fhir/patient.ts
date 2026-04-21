import type {
  FhirAddress,
  FhirAttachment,
  FhirCodeableConcept,
  FhirContactPoint,
  FhirExtension,
  FhirHumanName,
  FhirIdentifier,
  FhirMeta,
  FhirNarrative,
  FhirPeriod,
  FhirReference,
} from "./datatypes";
import type {
  FhirBoolean,
  FhirCode,
  FhirDate,
  FhirDateTime,
  FhirId,
  FhirUri,
} from "./primitives";

/**
 * FHIR R4 Patient resource — canonical shape for Google Healthcare API FHIR stores.
 * @see https://hl7.org/fhir/R4/patient.html
 */
export type FhirPatient = {
  resourceType: "Patient";
  id?: FhirId;
  meta?: FhirMeta;
  implicitRules?: FhirUri;
  language?: FhirCode;
  text?: FhirNarrative;
  extension?: FhirExtension[];
  modifierExtension?: FhirExtension[];
  identifier?: FhirIdentifier[];
  active?: FhirBoolean;
  name?: FhirHumanName[];
  telecom?: FhirContactPoint[];
  gender?: "male" | "female" | "other" | "unknown";
  birthDate?: FhirDate;
  /** Choice: only one of deceasedBoolean or deceasedDateTime should be present per instance. */
  deceasedBoolean?: FhirBoolean;
  deceasedDateTime?: FhirDateTime;
  address?: FhirAddress[];
  maritalStatus?: FhirCodeableConcept;
  multipleBirthBoolean?: FhirBoolean;
  multipleBirthInteger?: number;
  photo?: FhirAttachment[];
  contact?: FhirPatientContact[];
  communication?: FhirPatientCommunication[];
  generalPractitioner?: FhirReference[];
  managingOrganization?: FhirReference;
  link?: FhirPatientLink[];
};

export type FhirPatientContact = {
  relationship?: FhirCodeableConcept[];
  name?: FhirHumanName;
  telecom?: FhirContactPoint[];
  address?: FhirAddress;
  gender?: "male" | "female" | "other" | "unknown";
  organization?: FhirReference;
  period?: FhirPeriod;
};

export type FhirPatientCommunication = {
  language: FhirCodeableConcept;
  preferred?: FhirBoolean;
};

export type FhirPatientLink = {
  other: FhirReference;
  type: "replaced-by" | "replaces" | "refer" | "seealso";
};

/**
 * Bundle entry or read result wrapper (common when syncing with Healthcare API).
 */
export type FhirPatientReadResponse = FhirPatient;
