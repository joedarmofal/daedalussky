import type { Hl7Field, SegmentId } from "../types";

export const MSH_SEGMENT_ID: SegmentId = "MSH";

/**
 * Minimal MSH (Message Header) shape for type-safe construction/parsing.
 * Fields are intentionally generic strings until message-specific profiles are added.
 */
export type MshSegment = {
  segmentId: typeof MSH_SEGMENT_ID;
  /** MSH-3 Sending Application */
  sendingApplication: Hl7Field;
  /** MSH-4 Sending Facility */
  sendingFacility: Hl7Field;
  /** MSH-9 Message Type (e.g. ADT^A01) */
  messageType: Hl7Field;
  /** MSH-10 Message Control ID */
  messageControlId: Hl7Field;
};
