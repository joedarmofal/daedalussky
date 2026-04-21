import { DEBRIEF_QUESTIONS } from "./rules";
import type { DebriefAnswerMap, DebriefModule, DebriefQuestion } from "./types";

export function getVisibleQuestions(
  moduleName: DebriefModule,
  answers: DebriefAnswerMap,
): DebriefQuestion[] {
  return DEBRIEF_QUESTIONS.filter((q) => {
    if (q.module !== moduleName) {
      return false;
    }
    if (!q.followUpWhen) {
      return true;
    }
    return answers[q.followUpWhen.questionId] === q.followUpWhen.equals;
  });
}

export function getMissingRequiredQuestions(
  questions: DebriefQuestion[],
  answers: DebriefAnswerMap,
): string[] {
  return questions
    .filter((q) => q.required)
    .filter((q) => !(answers[q.id] ?? "").trim())
    .map((q) => q.prompt);
}
