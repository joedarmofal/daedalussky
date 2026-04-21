import type { FhirCoding } from "./datatypes";
import type { FhirEncounter } from "./encounter";

/**
 * Canonical FHIR resource for an aeromedical / transport flight mission.
 * Use `Encounter` with `subject` → Patient, `period` for wheels-up/down, `location` for route segments,
 * and StructureDefinition-backed extensions for mission-specific identifiers not covered by core fields.
 */
export type FhirFlightMissionEncounter = FhirEncounter;

/**
 * Base URI for Daedalussky-specific StructureDefinitions / extensions.
 * Replace with an IG-published canonical URL when your implementation guide is registered.
 */
export const DAEDALUSSKY_STRUCTURE_DEFINITION_BASE =
  "https://daedalussky.com/fhir/StructureDefinition" as const;

/**
 * Extension `url` values aligned with custom StructureDefinitions (string payloads unless noted).
 */
export const FlightMissionFhirExtensionUrls = {
  missionNumber: `${DAEDALUSSKY_STRUCTURE_DEFINITION_BASE}/flight-mission-number`,
  missionCallsign: `${DAEDALUSSKY_STRUCTURE_DEFINITION_BASE}/flight-mission-callsign`,
  aircraftRegistration: `${DAEDALUSSKY_STRUCTURE_DEFINITION_BASE}/aircraft-registration`,
  /** ISO 8601 interval or paired valuePeriod extensions at integration boundaries */
  missionBriefingNotes: `${DAEDALUSSKY_STRUCTURE_DEFINITION_BASE}/mission-briefing-notes`,
} as const;

export type FlightMissionFhirExtensionUrl =
  (typeof FlightMissionFhirExtensionUrls)[keyof typeof FlightMissionFhirExtensionUrls];

/** HL7 v3 ActCode — common `Encounter.class` system for transport-focused encounters. */
export const V3_ACT_CODE_SYSTEM =
  "http://terminology.hl7.org/CodeSystem/v3-ActCode" as const;

/**
 * Example `Encounter.class` coding for emergency ambulance / mobile care (verify against your compliance profile).
 * Aeromedical-specific class codes often use SNOMED CT in `Encounter.type` instead of or in addition to ActCode.
 */
export const V3_ACT_CODE_AMBULANCE: FhirCoding = {
  system: V3_ACT_CODE_SYSTEM,
  code: "AMB",
  display: "ambulance",
};

/** SNOMED CT URI for `Encounter.type` / `reasonCode` when your IG binds aeromedical concepts. */
export const SNOMED_CT_SYSTEM = "http://snomed.info/sct" as const;
