export type ProgressEventType =
  | 'started'
  | 'completed'
  | 'too_easy'
  | 'too_hard'
  | 'skipped'
  | 'diagnostic_taken';

export interface ProgressEvent {
  eventType: ProgressEventType;
  resourceId: string;
  score?: number | null;
}

export interface LearnerContext {
  hasPrereqGap: boolean;
  recentDiagnosticNormalizedScore: number | null;
  resourceDifficulty: number;
  learnerExperienceLevel: string;
  formatMismatch: boolean;
}

export interface ImpactResult {
  replan: boolean;
  cause?: string;
  action?: string;
}

/**
 * Pure deterministic impact evaluation engine.
 * Checks whether learner progress events cross the replan threshold and diagnoses the root cause.
 *
 * @param event Progress event emitted by the learner
 * @param context Current learner state context
 * @returns ImpactResult indicating if replan is triggered and recommended action
 */
export function evaluateImpact(
  event: ProgressEvent,
  context: LearnerContext
): ImpactResult {
  // Gate check: only trigger replan evaluation for 'too_hard' or 'too_easy' events
  if (event.eventType !== 'too_hard' && event.eventType !== 'too_easy') {
    return { replan: false };
  }

  // Cause Diagnosis Chain — checked in exact prioritized order:
  // 1. Prerequisite gap check
  if (context.hasPrereqGap) {
    return {
      replan: true,
      cause: 'prereq_gap',
      action: 'insert_prerequisite',
    };
  }

  // 2. Low diagnostic score check
  if (
    context.recentDiagnosticNormalizedScore !== null &&
    context.recentDiagnosticNormalizedScore < 0.5
  ) {
    return {
      replan: true,
      cause: 'diagnostic_low_score',
      action: 'swap_resource',
    };
  }

  // 3. Difficulty mismatch check (High difficulty for a Beginner)
  if (
    context.resourceDifficulty >= 4 &&
    context.learnerExperienceLevel === 'Beginner'
  ) {
    return {
      replan: true,
      cause: 'difficulty_mismatch',
      action: 'swap_resource',
    };
  }

  // 4. Format mismatch check
  if (context.formatMismatch) {
    return {
      replan: true,
      cause: 'format_mismatch',
      action: 'swap_resource',
    };
  }

  // 5. Default: no cause matched threshold
  return { replan: false };
}
