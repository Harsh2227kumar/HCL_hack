export interface LearningResource {
  id: string;
  skills_taught?: string[];
  skillsTaught?: string[]; // Fallback support
  prerequisite_skills?: string[];
  prerequisiteSkills?: string[]; // Fallback support
  difficulty: "beginner" | "intermediate" | "advanced" | number;
  duration_hours?: number;
  durationHours?: number; // Fallback support
  format?: string;
}

export interface LearnerContext {
  skillEstimates: {
    skill_name: string;
    final_estimate: number;
    target_level?: number;
    confidence_score?: number;
  }[];
  weeklyHours: number;
  learningStyle: string;
  pastFeedback: { resource_id: string; event_type: string }[];
}

export interface ScoreResult {
  score: number;
  score_breakdown: {
    skill_gap_match: number;
    prerequisite_fit: number;
    retrievalSimilarity: number;
    difficulty_fit: number;
    time_fit: number;
    learning_style_fit: number;
  };
  recommendation_status: "recommended" | "not_recommended_yet";
}

/**
 * Computes the hybrid score for a learning resource against a learner's context.
 * 
 * Weights (sum to 1.0):
 * - skill_gap_match (0.35)
 * - prerequisite_fit (0.25)
 * - retrievalSimilarity (0.15)
 * - difficulty_fit (0.10)
 * - time_fit (0.10)
 * - learning_style_fit (0.05) [incorporates feedback penalties]
 * 
 * @param resource The learning resource to score
 * @param learner The learner's profile context
 * @param retrievalSimilarity Semantic similarity from pgvector search
 */
export function scoreResource(
  resource: LearningResource,
  learner: LearnerContext,
  retrievalSimilarity: number
): ScoreResult {
  // Normalize resource property names
  const skillsTaught = resource.skills_taught || resource.skillsTaught || [];
  const prerequisiteSkills = resource.prerequisite_skills || resource.prerequisiteSkills || [];
  const durationHours = resource.duration_hours !== undefined ? resource.duration_hours : resource.durationHours;

  const skillEstimatesMap = new Map<
    string,
    { final_estimate: number; target_level: number; confidence_score?: number }
  >();
  if (learner.skillEstimates) {
    for (const est of learner.skillEstimates) {
      skillEstimatesMap.set(est.skill_name, {
        final_estimate: est.final_estimate,
        target_level: est.target_level ?? 5.0,
        confidence_score: est.confidence_score,
      });
    }
  }

  // 1. Check prerequisites fit and unmet condition
  // Threshold: Learner must have at least 2.0 in a prerequisite skill.
  // If estimate < 2.0, the prerequisite gap is too high and is marked unmet.
  const PREREQ_MIN_THRESHOLD = 2.0;
  let hasUnmetPrerequisites = false;

  for (const prereq of prerequisiteSkills) {
    const est = skillEstimatesMap.get(prereq)?.final_estimate ?? 0.0;
    if (est < PREREQ_MIN_THRESHOLD) {
      hasUnmetPrerequisites = true;
    }
  }

  // 2. Skill Gap Match (weight 0.35)
  // Gap = Math.max(0, targetLevel - finalEstimate) / targetLevel, clamped to [0, 1]
  let skillGapMatch = 0.0;
  if (skillsTaught.length > 0) {
    let totalGapScore = 0.0;
    for (const skill of skillsTaught) {
      const estInfo = skillEstimatesMap.get(skill);
      const finalEstimate = estInfo?.final_estimate ?? 0.0;
      const targetLevel = estInfo?.target_level ?? 5.0;

      const divisor = targetLevel > 0 ? targetLevel : 5.0;
      const rawGap = Math.max(0.0, targetLevel - finalEstimate) / divisor;
      const gap = Math.min(1.0, Math.max(0.0, rawGap));
      totalGapScore += gap;
    }
    skillGapMatch = totalGapScore / skillsTaught.length;
  }

  // 3. Prerequisite Fit Score (weight 0.25)
  // Meets prereq => 1.0. Otherwise, receives partial credit relative to threshold: estimate / 2.0.
  let prerequisiteFit = 1.0;
  if (prerequisiteSkills.length > 0) {
    let totalPrereqScore = 0.0;
    for (const prereq of prerequisiteSkills) {
      const est = skillEstimatesMap.get(prereq)?.final_estimate ?? 0.0;
      if (est >= PREREQ_MIN_THRESHOLD) {
        totalPrereqScore += 1.0;
      } else {
        totalPrereqScore += est / PREREQ_MIN_THRESHOLD;
      }
    }
    prerequisiteFit = totalPrereqScore / prerequisiteSkills.length;
  }

  // 4. Retrieval Similarity (weight 0.15)
  const retrievalFit = Math.max(0.0, Math.min(1.0, retrievalSimilarity));

  // 5. Difficulty Fit (weight 0.10)
  // Map difficulty levels (beginner=1.5, intermediate=3.0, advanced=4.5, or raw number)
  let mappedDifficulty = 3.0;
  if (typeof resource.difficulty === "number") {
    mappedDifficulty = resource.difficulty;
  } else {
    const diffStr = String(resource.difficulty).toLowerCase();
    if (diffStr === "beginner") mappedDifficulty = 1.5;
    else if (diffStr === "intermediate") mappedDifficulty = 3.0;
    else if (diffStr === "advanced") mappedDifficulty = 4.5;
  }

  // Average learner skill estimate on skills taught by resource
  let learnerEstimateOnResourceSkills = 0.0;
  if (skillsTaught.length > 0) {
    let sumEst = 0.0;
    for (const skill of skillsTaught) {
      sumEst += skillEstimatesMap.get(skill)?.final_estimate ?? 0.0;
    }
    learnerEstimateOnResourceSkills = sumEst / skillsTaught.length;
  }
  const diffDiff = Math.abs(mappedDifficulty - learnerEstimateOnResourceSkills);
  const difficultyFit = Math.max(0.0, 1.0 - diffDiff / 5.0);

  // 6. Time Fit (weight 0.10)
  // If duration fits in learner's weeklyHours budget, score is 1.0.
  // If duration is higher, score decays proportionally (capped at 0.1 min penalty score)
  let timeFit = 1.0;
  if (durationHours !== undefined && learner.weeklyHours > 0) {
    if (durationHours > learner.weeklyHours) {
      timeFit = Math.max(0.1, learner.weeklyHours / durationHours);
    }
  }

  // 7. Learning Style Fit & Feedback Penalty (weight 0.05)
  let learningStyleFit = 0.5; // Neutral baseline
  if (resource.format && learner.learningStyle) {
    const format = resource.format.toLowerCase();
    const style = learner.learningStyle.toLowerCase();
    if (
      (format === "video" && (style === "visual" || style === "auditory")) ||
      (format === "text" && style === "reading") ||
      (format === "interactive" && style === "kinesthetic")
    ) {
      learningStyleFit = 1.0;
    }
  }

  // Deduct penalty for direct negative historical feedback on this resource
  let feedbackPenalty = 0.0;
  if (learner.pastFeedback) {
    for (const fb of learner.pastFeedback) {
      if (fb.resource_id === resource.id) {
        if (fb.event_type === "too_hard") {
          feedbackPenalty += 0.5;
        } else if (fb.event_type === "skipped") {
          feedbackPenalty += 0.3;
        }
      }
    }
  }
  const finalStyleFit = Math.max(0.0, learningStyleFit - feedbackPenalty);

  // 8. Weighted aggregation
  const wGap = 0.35;
  const wPrereq = 0.25;
  const wRetrieval = 0.15;
  const wDiff = 0.10;
  const wTime = 0.10;
  const wStyle = 0.05;

  let rawScore =
    skillGapMatch * wGap +
    prerequisiteFit * wPrereq +
    retrievalFit * wRetrieval +
    difficultyFit * wDiff +
    timeFit * wTime +
    finalStyleFit * wStyle;

  // 9. Prerequisite gate
  // If prerequisites are unmet (estimate < 2.0 on any prereq), we mark status as "not_recommended_yet"
  // and scale/cap the final score to a maximum of 0.2.
  let recommendationStatus: "recommended" | "not_recommended_yet" = "recommended";
  if (hasUnmetPrerequisites) {
    recommendationStatus = "not_recommended_yet";
    rawScore = Math.min(0.2, rawScore * 0.5); // Cap and scale down
  }

  return {
    score: Number(rawScore.toFixed(4)),
    score_breakdown: {
      skill_gap_match: Number(skillGapMatch.toFixed(4)),
      prerequisite_fit: Number(prerequisiteFit.toFixed(4)),
      retrievalSimilarity: Number(retrievalFit.toFixed(4)),
      difficulty_fit: Number(difficultyFit.toFixed(4)),
      time_fit: Number(timeFit.toFixed(4)),
      learning_style_fit: Number(finalStyleFit.toFixed(4)),
    },
    recommendation_status: recommendationStatus,
  };
}
