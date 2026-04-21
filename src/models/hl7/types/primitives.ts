/**
 * Shared HL7 v2 primitive and structural types.
 * Parsing/serialization logic should live next to the segment or message that uses it.
 */

/** HL7 field repetition separator (often `~`). */
export type RepetitionSeparator = string;

/** HL7 component separator (often `^`). */
export type ComponentSeparator = string;

/** HL7 subcomponent separator (often `&`). */
export type SubcomponentSeparator = string;

/** A single logical field (may contain components/repetitions as raw text). */
export type Hl7Field = string;

/** A segment ID such as MSH, PID, PV1. */
export type SegmentId = string;
