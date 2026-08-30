import { SkillModel, GoalTemplate } from '@/types';

export interface SkillGap {
  skillName: string;
  currentLevel: number;
  targetLevel: number;
  gap: number;
  percentage: number;
}

export function calculateSkillGaps(
  skills: SkillModel[],
  goalTemplate: GoalTemplate
): SkillGap[] {
  const requiredSkills: { skill: string, min_level: number }[] = 
    (goalTemplate.requiredSkills as any) || [];
  
  const skillMap = new Map(skills.map(s => [s.skillName, s.finalEstimate]));

  const gaps: SkillGap[] = [];

  for (const req of requiredSkills) {
    const currentLevel = skillMap.get(req.skill) || 0;
    const targetLevel = req.min_level;
    const gap = Math.max(0, targetLevel - currentLevel);
    
    if (gap > 0) {
      gaps.push({
        skillName: req.skill,
        currentLevel,
        targetLevel,
        gap,
        percentage: targetLevel > 0 ? (gap / targetLevel) * 100 : 0
      });
    }
  }

  gaps.sort((a, b) => b.gap - a.gap);
  return gaps;
}
