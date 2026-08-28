/**
 * Bayesian Knowledge Tracing (BKT) — Skill Reconciliation Module
 *
 * Replaces the previous exponential-decay weighted average with a proper
 * probabilistic learner model. Each skill's mastery is tracked as P(known),
 * the probability that the learner has acquired the skill, updated via
 * Bayes' rule after each observed evidence event.
 *
 * Reference: Corbett & Anderson (1995), "Knowledge Tracing: Modeling the
 * Acquisition of Procedural Knowledge."
 */

/**
 * BKT parameters use literature-standard cold-start priors rather than
 * fitted values, since we don't have historical response data to calibrate
 * against — this is standard practice for new BKT deployments.
 */
export const BKT_PARAMS = {
  /** Prior probability the learner already knows the skill (before any evidence). */
  P_L0: 0.3,

  /** Probability of transitioning from unknown → known per evidence event (learning rate). */
  P_T: 0.2,

  /** Probability of an incorrect response despite knowing the skill (slip). */
  P_slip: 0.1,

  /** Probability of a correct response despite NOT knowing the skill (guess). */
  P_guess: 0.25,
} as const;

/**
 * A single evidence observation for a skill.
 */
export interface SkillEvidenceEvent {
  /** Whether the learner's response was correct for this evidence event. */
  correct: boolean;
}

/**
 * The legacy interface kept for backward compatibility with the existing
 * codebase (e.g., seed scripts, other modules that reference SkillEvidence).
 */
export interface SkillEvidence {
  score: number; // 0 to 5
  reliability?: number; // 0 to 1
  source: 'self_report' | 'diagnostic' | 'project_completion' | string;
  timestamp: Date;
}

/**
 * Performs a single BKT update step.
 *
 * Given:
 *   - priorKnown: the current P(known) before observing this event
 *   - correct: whether the learner's response was correct
 *
 * Returns:
 *   - The updated P(known) after incorporating this observation
 *
 * The math (standard BKT):
 *
 *   If correct:
 *     P(known | correct) = P(correct | known) * P(known)
 *                        / P(correct)
 *     where P(correct | known) = 1 - P_slip
 *           P(correct | ¬known) = P_guess
 *           P(correct) = P(correct | known)*P(known) + P(correct | ¬known)*P(¬known)
 *
 *   If incorrect:
 *     P(known | incorrect) = P(incorrect | known) * P(known)
 *                          / P(incorrect)
 *     where P(incorrect | known) = P_slip
 *           P(incorrect | ¬known) = 1 - P_guess
 *           P(incorrect) = P_slip*P(known) + (1-P_guess)*P(¬known)
 *
 *   Then apply the learning transition:
 *     P(known)_new = P(known | obs) + (1 - P(known | obs)) * P_T
 *
 *   This captures: even if the posterior says the learner probably doesn't know it,
 *   there's still a chance they *learned* it during the interaction.
 */
export function bktUpdate(priorKnown: number, correct: boolean): number {
  const { P_T, P_slip, P_guess } = BKT_PARAMS;

  let posteriorKnown: number;

  if (correct) {
    // P(correct | known) = 1 - P_slip
    // P(correct | ¬known) = P_guess
    const pCorrect =
      (1 - P_slip) * priorKnown + P_guess * (1 - priorKnown);
    posteriorKnown = ((1 - P_slip) * priorKnown) / pCorrect;
  } else {
    // P(incorrect | known) = P_slip
    // P(incorrect | ¬known) = 1 - P_guess
    const pIncorrect =
      P_slip * priorKnown + (1 - P_guess) * (1 - priorKnown);
    posteriorKnown = (P_slip * priorKnown) / pIncorrect;
  }

  // Apply learning transition: even after observation, learner may have
  // transitioned from unknown → known with probability P_T
  const updatedKnown = posteriorKnown + (1 - posteriorKnown) * P_T;

  return updatedKnown;
}

/**
 * Processes a sequence of evidence events for a single skill and returns
 * the final P(known) and a confidence score.
 *
 * The confidence score reflects how much evidence we have — it increases
 * with each observation, saturating toward 1.0 via an exponential formula:
 *   confidence = 1 - exp(-0.5 * numEvents)
 *
 * @param events  Ordered array of evidence events (oldest first)
 * @param initialPKnown  Starting P(known), defaults to BKT_PARAMS.P_L0
 * @returns { finalEstimate: P(known) in [0,1], confidenceScore in [0,1] }
 */
export function reconcileSkillFromEvidence(
  events: SkillEvidenceEvent[],
  initialPKnown: number = BKT_PARAMS.P_L0
): { finalEstimate: number; confidenceScore: number } {
  if (!events || events.length === 0) {
    return { finalEstimate: initialPKnown, confidenceScore: 0 };
  }

  let pKnown = initialPKnown;

  for (const event of events) {
    pKnown = bktUpdate(pKnown, event.correct);
  }

  // Confidence: how many observations we have (saturating exponential)
  const confidenceScore = 1 - Math.exp(-0.5 * events.length);

  return {
    finalEstimate: Number(pKnown.toFixed(6)),
    confidenceScore: Number(confidenceScore.toFixed(4)),
  };
}

/**
 * Legacy adapter: converts old-style SkillEvidence records into BKT events
 * and runs reconciliation. A score >= 2.5 (out of 5) is treated as "correct",
 * below 2.5 as "incorrect". This lets old callers migrate without rewriting.
 */
export function reconcileSkillEstimate(
  evidenceRecords: SkillEvidence[],
  _now: Date = new Date()
): { final_estimate: number | null; confidence_score: number } {
  if (!evidenceRecords || evidenceRecords.length === 0) {
    return { final_estimate: null, confidence_score: 0 };
  }

  // Sort oldest-first so BKT processes evidence in chronological order
  const sorted = [...evidenceRecords].sort(
    (a, b) => a.timestamp.getTime() - b.timestamp.getTime()
  );

  const events: SkillEvidenceEvent[] = sorted.map((r) => ({
    correct: r.score >= 2.5,
  }));

  const { finalEstimate, confidenceScore } = reconcileSkillFromEvidence(events);

  // Scale P(known) from [0,1] back to the 0–5 range the rest of the system expects
  return {
    final_estimate: Number((finalEstimate * 5).toFixed(4)),
    confidence_score: confidenceScore,
  };
}
