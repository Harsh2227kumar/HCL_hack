import { SkillDependency } from '@/types';
import { SkillGap } from './skillGap';

export interface BottleneckResult {
  skillName: string;
  gap: number;
  downstreamBlocked: number;
  bottleneckScore: number;
  blockedSkills: string[];
}

export function detectBottlenecks(
  gaps: SkillGap[],
  dependencies: SkillDependency[]
): BottleneckResult[] {
  // Build adjacency list: skill -> skills that depend on it
  const blocks = new Map<string, string[]>();
  for (const dep of dependencies) {
    const blockedSkill = dep.dependsOnSkillName;
    const dependentSkill = dep.skillName;
    if (!blocks.has(blockedSkill)) {
      blocks.set(blockedSkill, []);
    }
    blocks.get(blockedSkill)!.push(dependentSkill);
  }

  const results: BottleneckResult[] = [];

  for (const gapObj of gaps) {
    const skill = gapObj.skillName;
    const visited = new Set<string>();
    const queue = [skill];
    const blockedSkills = new Set<string>();

    while (queue.length > 0) {
      const current = queue.shift()!;
      if (!visited.has(current)) {
        visited.add(current);
        const dependentSkills = blocks.get(current) || [];
        for (const dep of dependentSkills) {
          if (!visited.has(dep)) {
            blockedSkills.add(dep);
            queue.push(dep);
          }
        }
      }
    }

    const downstreamBlocked = blockedSkills.size;
    const bottleneckScore = gapObj.gap * downstreamBlocked;

    results.push({
      skillName: skill,
      gap: gapObj.gap,
      downstreamBlocked,
      bottleneckScore: bottleneckScore,
      blockedSkills: Array.from(blockedSkills)
    });
  }

  results.sort((a, b) => b.bottleneckScore - a.bottleneckScore);
  return results;
}
