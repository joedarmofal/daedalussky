import type { Hl7Field, SegmentId } from "../types";

export const PID_SEGMENT_ID: SegmentId = "PID";

/**
 * Minimal PID (Patient Identification) shape.
 * Do not log instances of this type; it may contain PHI.
 */
export type PidSegment = {
  segmentId: typeof PID_SEGMENT_ID;
  /** PID-3 Patient Identifier List (raw field; profile-specific parsing later) */
  patientIdentifierList: Hl7Field;
  /** PID-5 Patient Name (raw field; profile-specific parsing later) */
  patientName: Hl7Field;
};
