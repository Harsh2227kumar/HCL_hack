import { SkillModel, SkillDependency, GoalTemplate } from '@/types';

export function selectDiagnosticSkills(
  skills: SkillModel[],
  dependencies: SkillDependency[],
  goalTemplate: GoalTemplate,
  topN: number = 3
): string[] {
  // Parse required skills from goalTemplate
  const requiredSkillsObj: { skill: string, min_level: number }[] = 
    (goalTemplate.requiredSkills as any) || [];
  
  const targetMap = new Map<string, number>();
  for (const req of requiredSkillsObj) {
    targetMap.set(req.skill, req.min_level);
  }

  // Count downstream dependencies for each skill
  const downstreamCount = new Map<string, number>();
  for (const dep of dependencies) {
    // dep.skillName depends on dep.dependsOnSkillName
    const blockedSkill = dep.dependsOnSkillName;
    downstreamCount.set(blockedSkill, (downstreamCount.get(blockedSkill) || 0) + 1);
  }

  const priorities = skills.map(skill => {
    const targetLevel = targetMap.get(skill.skillName) || skill.targetLevel || 0;
    const targetImportance = targetLevel / 5;
    const currentUncertainty = 1 - skill.confidenceScore;
    const downstream = downstreamCount.get(skill.skillName) || 0;
    const prerequisiteCriticality = 1 + (downstream * 0.2);

    const priority = targetImportance * currentUncertainty * prerequisiteCriticality;
    
    return { skillName: skill.skillName, priority };
  });

  priorities.sort((a, b) => b.priority - a.priority);

  return priorities.slice(0, topN).map(p => p.skillName);
}
