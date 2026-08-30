import { SkillEvidenceItem } from '@/types';

interface ReconciliationResult {
  finalEstimate: number;    // 0-5
  confidenceScore: number;  // 0.0-1.0
}

export function reconcileSkill(evidence: SkillEvidenceItem[]): ReconciliationResult {
  if (!evidence || evidence.length === 0) {
    return { finalEstimate: 0, confidenceScore: 0 };
  }

  let numerator = 0;
  let denominator = 0;
  let totalReliability = 0;

  for (const item of evidence) {
    const weight = item.reliability * item.recencyWeight;
    numerator += item.score * weight;
    denominator += weight;
    totalReliability += item.reliability;
  }

  const finalEstimate = denominator > 0 ? numerator / denominator : 0;
  
  // Confidence formula: 1 - (1 / (1 + total_reliability_mass))
  const confidenceScore = 1 - (1 / (1 + totalReliability));

  return {
    finalEstimate: Math.max(0, Math.min(5, finalEstimate)),
    confidenceScore: Math.max(0, Math.min(1, confidenceScore)),
  };
}
