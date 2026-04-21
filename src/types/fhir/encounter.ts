import type {
  FhirCodeableConcept,
  FhirCoding,
  FhirDuration,
  FhirExtension,
  FhirIdentifier,
  FhirMeta,
  FhirNarrative,
  FhirPeriod,
  FhirReference,
} from "./datatypes";
import type { FhirCode, FhirId, FhirUri } from "./primitives";

/**
 * FHIR R4 Encounter — canonical carrier for a flight / transport mission (timing, status, participants, locations).
 * @see https://hl7.org/fhir/R4/encounter.html
 */
export type FhirEncounterStatus =
  | "planned"
  | "arrived"
  | "triaged"
  | "in-progress"
  | "onleave"
  | "finished"
  | "cancelled"
  | "entered-in-error"
  | "unknown";

export type FhirEncounter = {
  resourceType: "Encounter";
  id?: FhirId;
  meta?: FhirMeta;
  implicitRules?: FhirUri;
  language?: FhirCode;
  text?: FhirNarrative;
  extension?: FhirExtension[];
  modifierExtension?: FhirExtension[];
  identifier?: FhirIdentifier[];
  status: FhirEncounterStatus;
  /** R4 required: classification of encounter (e.g. act code for ambulance / emergency). */
  class: FhirCoding;
  type?: FhirCodeableConcept[];
  serviceType?: FhirCodeableConcept;
  priority?: FhirCodeableConcept;
  /** Patient (or group) this encounter is for — primary link for mission ↔ patient. */
  subject?: FhirReference;
  episodeOfCare?: FhirReference[];
  basedOn?: FhirReference[];
  participant?: FhirEncounterParticipant[];
  appointment?: FhirReference[];
  period?: FhirPeriod;
  length?: FhirDuration;
  reasonCode?: FhirCodeableConcept[];
  reasonReference?: FhirReference[];
  diagnosis?: FhirEncounterDiagnosis[];
  account?: FhirReference[];
  hospitalization?: FhirEncounterHospitalization;
  location?: FhirEncounterLocation[];
  serviceProvider?: FhirReference;
  partOf?: FhirReference;
};

export type FhirEncounterParticipant = {
  type?: FhirCodeableConcept[];
  period?: FhirPeriod;
  individual?: FhirReference;
};

export type FhirEncounterDiagnosis = {
  condition?: FhirReference;
  use?: FhirCodeableConcept;
  rank?: number;
};

export type FhirEncounterHospitalization = {
  preAdmissionIdentifier?: FhirIdentifier;
  origin?: FhirReference;
  admitSource?: FhirCodeableConcept;
  reAdmission?: FhirCodeableConcept;
  dietPreference?: FhirCodeableConcept[];
  specialCourtesy?: FhirCodeableConcept[];
  specialArrangement?: FhirCodeableConcept[];
  destination?: FhirReference;
  dischargeDisposition?: FhirCodeableConcept;
};

export type FhirEncounterLocation = {
  location: FhirReference;
  status?: "planned" | "active" | "reserved" | "completed";
  physicalType?: FhirCodeableConcept;
  period?: FhirPeriod;
};
