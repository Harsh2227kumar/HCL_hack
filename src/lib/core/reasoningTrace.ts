import { SkillGap } from './skillGap';
import { PathPhase } from './prerequisiteSort';
import { Resource } from '@/types';

export interface TraceEntry {
  step: number;
  skillAddressed: string;
  gapScore: number;
  resourceSelected: string;
  reason: string;
  confidence: number;
}

export function generateReasoningTrace(
  gaps: SkillGap[],
  pathway: PathPhase[],
  resourceMap: Map<string, Resource>
): TraceEntry[] {
  const gapLookup = new Map<string, SkillGap>();
  for (const g of gaps) {
    gapLookup.set(g.skillName.toLowerCase(), g);
  }

  const trace: TraceEntry[] = [];
  const addressedSkills = new Set<string>();

  for (const phase of pathway) {
    for (const item of phase.items) {
      const resource = resourceMap.get(item.resourceId);
      if (!resource) continue;

      const courseSkills = resource.skillsTaught;
      const courseTitle = resource.title;

      let bestGap: SkillGap | null = null;

      // 1. Find the best matching UNADDRESSED skill gap for this course
      for (const skill of courseSkills) {
        const skillLower = skill.toLowerCase();
        if (gapLookup.has(skillLower) && !addressedSkills.has(skillLower)) {
          const candidate = gapLookup.get(skillLower)!;
          if (!bestGap || candidate.gapScore > bestGap.gapScore) {
            bestGap = candidate;
          }
        }
      }

      // 2. If no unaddressed gap found, try ANY gap this course covers
      if (!bestGap) {
        for (const skill of courseSkills) {
          const skillLower = skill.toLowerCase();
          if (gapLookup.has(skillLower)) {
            bestGap = gapLookup.get(skillLower)!;
            break;
          }
        }
      }

      // 3. Build trace entry
      let skillAddressed = '';
      let gapScore = 0;
      let reason = '';
      let confidence = 0;

      if (bestGap) {
        skillAddressed = bestGap.skillName;
        gapScore = bestGap.gapScore;
        const currentStr = bestGap.currentLevel > 0 ? bestGap.currentLevel.toString() : 'no';
        const requiredStr = bestGap.targetLevel.toString();
        
        addressedSkills.add(skillAddressed.toLowerCase());

        reason = `Your profile shows ${currentStr}/5 proficiency in ${skillAddressed}. The target role requires a ${requiredStr}/5 level, so "${courseTitle}" was selected to bridge this gap.`;
        confidence = Math.round(Math.max(0.7, Math.min(0.99, 1.0 - (gapScore * 0.3))) * 100) / 100;
      } else {
        // Prerequisite course - not directly tied to a gap
        skillAddressed = courseSkills[0] || 'general';
        gapScore = 0.0;
        reason = `"${courseTitle}" is included as a prerequisite foundation. It teaches ${courseSkills.slice(0, 3).join(', ')} which are required before advancing to later courses in the pathway.`;
        confidence = 0.95;
      }

      trace.push({
        step: item.position,
        skillAddressed,
        gapScore: Number(gapScore.toFixed(2)),
        resourceSelected: courseTitle,
        reason,
        confidence
      });
    }
  }

  // Ensure sorted by step
  trace.sort((a, b) => a.step - b.step);

  return trace;
}
