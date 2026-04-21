export type DebriefModule = "Clinical" | "Aviation" | "Communication Center";

export type DebriefQuestionType =
  | "yes_no"
  | "text"
  | "textarea"
  | "select"
  | "number";

export type DebriefCondition = {
  questionId: string;
  equals: string;
};

export type DebriefQuestion = {
  id: string;
  module: DebriefModule;
  prompt: string;
  type: DebriefQuestionType;
  options?: string[];
  required?: boolean;
  followUpWhen?: DebriefCondition;
  standardRef: string;
};

export type DebriefAnswerMap = Record<string, string>;
