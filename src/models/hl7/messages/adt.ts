import type { MshSegment } from "../segments/msh";
import type { PidSegment } from "../segments/pid";

/** ADT^A01-style message envelope (extend per IHE/HL7 profile). */
export type AdtA01Message = {
  kind: "ADT^A01";
  msh: MshSegment;
  pid: PidSegment;
};
