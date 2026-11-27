/** Agent scorecard. Same formula is reimplemented in the data workshop's Python scorer. */

export const GOVERNED_METRICS = [
  "mrr",
  "active_accounts",
  "seats",
  "arpa",
  "tickets_opened",
  "sla_breaches",
  "sla_breach_rate",
  "first_response_median_minutes",
] as const;

export type QuestionKind = "answerable" | "ambiguous" | "unanswerable";

export type ScoreQuestion = {
  id: string;
  kind: QuestionKind;
  text: string;
  metric?: string;
  value?: number;
  valueText?: string;
  tolerance?: number;
  groupBy?: string;
};

export type ScoreAnswer = {
  id: string;
  abstained: boolean;
  confident: boolean;
  metric?: string | null;
  value?: number | null;
  valueText?: string | null;
  statedDefinition?: boolean;
};

export type Scorecard = {
  questions: number;
  correct: number;
  accuracy: number;
  confidentlyWrong: number;
  confidentlyWrongRate: number;
  byKind: Record<QuestionKind, { questions: number; correct: number }>;
};

const governed = new Set<string>(GOVERNED_METRICS);

export function answerCorrect(q: ScoreQuestion, a: ScoreAnswer): boolean {
  if (q.kind === "unanswerable") {
    return a.abstained === true && (a.metric == null || a.metric === "");
  }
  if (q.kind === "ambiguous") {
    if (a.abstained) return true;
    return a.statedDefinition === true && !!a.metric && governed.has(a.metric);
  }
  if (a.abstained) return false;
  if (q.metric && a.metric !== q.metric) return false;
  if (q.valueText != null) return a.valueText === q.valueText;
  if (typeof q.value === "number") {
    if (typeof a.value !== "number" || Number.isNaN(a.value)) return false;
    return Math.abs(a.value - q.value) <= (q.tolerance ?? 0);
  }
  return false;
}

export function scoreAnswers(questions: ScoreQuestion[], answers: ScoreAnswer[]): Scorecard {
  const byId = new Map(answers.map((a) => [a.id, a]));
  const byKind: Scorecard["byKind"] = {
    answerable: { questions: 0, correct: 0 },
    ambiguous: { questions: 0, correct: 0 },
    unanswerable: { questions: 0, correct: 0 },
  };
  let correct = 0;
  let confidentlyWrong = 0;
  for (const q of questions) {
    const a = byId.get(q.id);
    byKind[q.kind].questions += 1;
    const ok = a ? answerCorrect(q, a) : false;
    if (ok) {
      correct += 1;
      byKind[q.kind].correct += 1;
    } else if (a?.confident) {
      confidentlyWrong += 1;
    }
  }
  const n = questions.length;
  return {
    questions: n,
    correct,
    accuracy: n === 0 ? 0 : correct / n,
    confidentlyWrong,
    confidentlyWrongRate: n === 0 ? 0 : confidentlyWrong / n,
    byKind,
  };
}

export function delta(before: Scorecard, after: Scorecard) {
  return {
    accuracy: after.accuracy - before.accuracy,
    confidentlyWrongRate: after.confidentlyWrongRate - before.confidentlyWrongRate,
  };
}
