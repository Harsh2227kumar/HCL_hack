export interface LearnerSkill {
  skill_name: string;
  final_estimate: number;
  target_level: number;
}

export interface SkillGap {
  skill_name: string;
  gap: number;
}

/**
 * Computes the skill gaps between target levels and current estimates.
 * Gaps are clamped to a minimum of 0 (if final estimate exceeds target).
 * 
 * @param learnerSkills Learner's current skill levels and targets
 */
export function computeSkillGaps(learnerSkills: LearnerSkill[]): SkillGap[] {
  if (!learnerSkills) return [];
  
  return learnerSkills.map((sk) => {
    const finalEstimate = sk.final_estimate ?? 0;
    const gap = Math.max(0, sk.target_level - finalEstimate);
    return {
      skill_name: sk.skill_name,
      gap,
    };
  });
}
