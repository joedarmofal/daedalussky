import type {
  FhirBoolean,
  FhirCode,
  FhirDateTime,
  FhirInstant,
  FhirInteger,
  FhirMarkdown,
  FhirPositiveInt,
  FhirString,
  FhirUri,
} from "./primitives";

/**
 * Shared FHIR R4 data types used by Patient, Encounter, and related resources.
 * @see https://hl7.org/fhir/R4/datatypes.html
 */

export type FhirMeta = {
  versionId?: FhirString;
  lastUpdated?: FhirInstant;
  source?: FhirUri;
  profile?: FhirUri[];
  security?: FhirCoding[];
  tag?: FhirCoding[];
};

export type FhirNarrative = {
  status: "generated" | "extensions" | "additional" | "empty";
  div: FhirString;
};

export type FhirCoding = {
  system?: FhirUri;
  version?: FhirString;
  code?: FhirCode;
  display?: FhirString;
  userSelected?: FhirBoolean;
};

export type FhirCodeableConcept = {
  coding?: FhirCoding[];
  text?: FhirString;
};

export type FhirPeriod = {
  start?: FhirDateTime;
  end?: FhirDateTime;
};

export type FhirIdentifier = {
  use?: "usual" | "official" | "temp" | "secondary" | "old";
  type?: FhirCodeableConcept;
  system?: FhirUri;
  value?: FhirString;
  period?: FhirPeriod;
  assigner?: FhirReference;
};

export type FhirHumanName = {
  use?: "usual" | "official" | "temp" | "nickname" | "anonymous" | "old" | "maiden";
  text?: FhirString;
  family?: FhirString;
  given?: FhirString[];
  prefix?: FhirString[];
  suffix?: FhirString[];
  period?: FhirPeriod;
};

export type FhirContactPoint = {
  system?: "phone" | "fax" | "email" | "pager" | "url" | "sms" | "other";
  value?: FhirString;
  use?: "home" | "work" | "temp" | "old" | "mobile";
  rank?: FhirPositiveInt;
  period?: FhirPeriod;
};

export type FhirAddress = {
  use?: "home" | "work" | "temp" | "old" | "billing";
  type?: "postal" | "physical" | "both";
  text?: FhirString;
  line?: FhirString[];
  city?: FhirString;
  district?: FhirString;
  state?: FhirString;
  postalCode?: FhirString;
  country?: FhirString;
  period?: FhirPeriod;
};

export type FhirAttachment = {
  contentType?: FhirCode;
  language?: FhirCode;
  data?: FhirString;
  url?: FhirUri;
  size?: FhirInteger;
  hash?: FhirString;
  title?: FhirString;
  creation?: FhirDateTime;
};

export type FhirReference = {
  reference?: FhirString;
  type?: FhirUri;
  identifier?: FhirIdentifier;
  display?: FhirString;
};

export type FhirAnnotation = {
  authorReference?: FhirReference;
  authorString?: FhirString;
  time?: FhirDateTime;
  text: FhirMarkdown;
};

export type FhirQuantity = {
  value?: number;
  comparator?: "<" | "<=" | ">=" | ">";
  unit?: FhirString;
  system?: FhirUri;
  code?: FhirCode;
};

export type FhirDuration = FhirQuantity;

/**
 * Extension entry (value[x] choice simplified to common JSON shapes).
 * Prefer defining mission-specific extensions as dedicated constants + narrow parsers at boundaries.
 */
export type FhirExtension = {
  url: FhirUri;
  valueString?: FhirString;
  valueInteger?: FhirInteger;
  valueBoolean?: FhirBoolean;
  valueDateTime?: FhirDateTime;
  valueCode?: FhirCode;
  valueReference?: FhirReference;
  valueCodeableConcept?: FhirCodeableConcept;
  valuePeriod?: FhirPeriod;
  extension?: FhirExtension[];
};
