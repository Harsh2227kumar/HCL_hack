import { SkillModel, GoalTemplate } from '@/types';

export interface SkillGap {
  skillName: string;
  currentLevel: number;
  targetLevel: number;
  gap: number;        // Raw gap
  gapScore: number;   // Normalized gap 0-1
  priority: 'critical' | 'recommended' | 'optional';
  percentage: number;
}

export function calculateSkillGaps(
  skills: SkillModel[],
  goalTemplate: GoalTemplate
): { gaps: SkillGap[], readinessScore: number, matchedSkills: string[], missingSkills: string[] } {
  const requiredSkills: { skill: string, min_level: number }[] = 
    (goalTemplate.requiredSkills as any) || [];
  
  const skillMap = new Map(skills.map(s => [s.skillName, s.finalEstimate]));

  const gaps: SkillGap[] = [];
  const matchedSkills: string[] = [];
  const missingSkills: string[] = [];
  const allGapScores: number[] = [];

  for (const req of requiredSkills) {
    const currentLevel = skillMap.has(req.skill) ? skillMap.get(req.skill)! : 0;
    const targetLevel = req.min_level;
    
    let gapScore = 0;
    let rawGap = 0;

    if (currentLevel === 0) {
      missingSkills.push(req.skill);
      gapScore = 1.0;
      rawGap = targetLevel;
    } else if (currentLevel < targetLevel) {
      matchedSkills.push(req.skill);
      rawGap = targetLevel - currentLevel;
      gapScore = rawGap / 5.0; // Normalized on a 5-point scale
    } else {
      matchedSkills.push(req.skill);
      gapScore = 0.0;
      rawGap = 0;
    }

    allGapScores.push(gapScore);

    if (gapScore > 0) {
      let priority: 'critical' | 'recommended' | 'optional' = 'optional';
      if (gapScore >= 0.6) priority = 'critical'; // Adjusted threshold for 5-point scale
      else if (gapScore >= 0.2) priority = 'recommended';

      gaps.push({
        skillName: req.skill,
        currentLevel,
        targetLevel,
        gap: rawGap,
        gapScore,
        priority,
        percentage: targetLevel > 0 ? (rawGap / targetLevel) * 100 : 0
      });
    }
  }

  gaps.sort((a, b) => b.gapScore - a.gapScore);

  let readinessScore = 1.0;
  if (allGapScores.length > 0) {
    readinessScore = 1.0 - (allGapScores.reduce((a, b) => a + b, 0) / allGapScores.length);
  }

  return { gaps, readinessScore: Math.max(0, Math.min(1, readinessScore)), matchedSkills, missingSkills };
}
