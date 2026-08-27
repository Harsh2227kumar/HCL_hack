export interface SkillEvidence {
  score: number; // 0 to 5
  reliability?: number; // 0 to 1
  source: "self_report" | "diagnostic" | "project_completion" | string;
  timestamp: Date;
}

/**
 * Reconciles multiple skill evidence records into a single final estimate and confidence score.
 * 
 * Formula:
 * final_estimate = Σ(score × reliability × recency_weight) ÷ Σ(reliability × recency_weight)
 * 
 * recency_weight = exponential decay, half-life 30 days, based on (now - timestamp).
 * Baseline reliability defaults if not passed explicitly: diagnostic=0.7, self_report=0.3, project_completion=0.6.
 * 
 * Edge case: if evidenceRecords is empty, return { final_estimate: null, confidence_score: 0 }
 * 
 * @param evidenceRecords Array of SkillEvidence records
 * @param now Optional date representing the "current" time (defaults to new Date())
 */
export function reconcileSkillEstimate(
  evidenceRecords: SkillEvidence[],
  now: Date = new Date()
): { final_estimate: number | null; confidence_score: number } {
  if (!evidenceRecords || evidenceRecords.length === 0) {
    return { final_estimate: null, confidence_score: 0 };
  }

  const decayConstant = Math.LN2 / 30.0; // half-life of 30 days
  const msInDay = 1000 * 60 * 60 * 24;

  let totalWeightedScore = 0;
  let totalWeight = 0;

  for (const record of evidenceRecords) {
    // 1. Determine reliability
    let reliability = record.reliability;
    if (reliability === undefined || reliability === null) {
      if (record.source === "diagnostic") {
        reliability = 0.7;
      } else if (record.source === "self_report") {
        reliability = 0.3;
      } else if (record.source === "project_completion") {
        reliability = 0.6;
      } else {
        reliability = 0.5; // generic fallback
      }
    }

    // 2. Determine recency weight (exponential decay)
    const ageInMs = now.getTime() - record.timestamp.getTime();
    const ageInDays = Math.max(0, ageInMs / msInDay); // Cap age at 0 to avoid future dates inflating weight
    const recencyWeight = Math.exp(-decayConstant * ageInDays);

    const recordWeight = reliability * recencyWeight;

    totalWeightedScore += record.score * recordWeight;
    totalWeight += recordWeight;
  }

  // Handle case where totalWeight is 0 (all evidence is extremely decayed)
  const final_estimate = totalWeight > 0 ? totalWeightedScore / totalWeight : null;

  /*
   * Chosen Confidence Score Formula:
   * confidence_score = 1 - exp(-k * sum(reliability_i * recency_weight_i))
   * Where:
   * - Each evidence record's weight is computed as: weight_i = reliability_i * recency_weight_i
   * - S = sum(weight_i) captures the total volume, reliability, and freshness of evidence.
   * - We use an exponential saturation function: 1 - exp(-k * S) to map S to a [0, 1] range.
   * - We set the scaling factor k = 0.75.
   *   This ensures:
   *   - Empty evidence: S = 0 => confidence = 0
   *   - Single fresh self-report (reliability 0.3): S = 0.3 => confidence ≈ 0.2019 (Low confidence)
   *   - Single fresh diagnostic (reliability 0.7): S = 0.7 => confidence ≈ 0.4085 (Medium-low confidence)
   *   - Multiple robust sources (e.g., S = 2.0): confidence ≈ 0.7769
   *   - Many sources (e.g., S >= 4.0): confidence approaches 0.95+
   */
  const k = 0.75;
  const confidence_score = 1 - Math.exp(-k * totalWeight);

  return {
    final_estimate: final_estimate !== null ? Math.min(5, Math.max(0, final_estimate)) : null,
    confidence_score: Number(confidence_score.toFixed(4)), // clean, rounded float output
  };
}
