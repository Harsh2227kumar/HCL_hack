import { ProgressUpdate, SkillModel, LearningPath, Resource } from '@/types';

export type AdaptationCause = 
  | 'prerequisite_gap'
  | 'low_diagnostic_score'
  | 'difficulty_mismatch'
  | 'format_mismatch'
  | 'goal_change';

export type AdaptationAction =
  | { type: 'insert_prerequisite'; resourceId: string }
  | { type: 'swap_resource'; oldId: string; newId: string }
  | { type: 'adjust_pacing'; factor: number }
  | { type: 'full_replan' };

export function evaluateImpact(
  event: ProgressUpdate,
  learnerSkills: SkillModel[],
  currentPath: LearningPath,
  resources: Resource[]
): { shouldReplan: boolean; cause?: AdaptationCause; action?: AdaptationAction } {
  
  if (event.eventType === 'goal_change') {
    return { shouldReplan: true, cause: 'goal_change', action: { type: 'full_replan' } };
  }

  if (event.eventType === 'completed' || event.eventType === 'started' || event.eventType === 'skipped') {
    return { shouldReplan: false };
  }

  if (event.eventType === 'too_hard') {
    const res = resources.find(r => r.id === event.resourceId);
    if (!res) return { shouldReplan: false };

    // 1. Check prerequisite gap
    const prereqs: string[] = (res.prerequisiteSkills as any) || [];
    const skillMap = new Map(learnerSkills.map(s => [s.skillName, s.finalEstimate]));
    for (const pr of prereqs) {
      const level = skillMap.get(pr) || 0;
      if (level < 3) {
        // Recommend full replan to let path generator naturally include it
        return { 
          shouldReplan: true, 
          cause: 'prerequisite_gap', 
          action: { type: 'full_replan' } 
        };
      }
    }

    // 2. Check difficulty metadata
    const skillsTaught: string[] = (res.skillsTaught as any) || [];
    let avgLevel = 0;
    if (skillsTaught.length > 0) {
      avgLevel = skillsTaught.reduce((sum, st) => sum + (skillMap.get(st) || 0), 0) / skillsTaught.length;
    }
    
    if (res.difficulty > avgLevel + 2) {
      return {
        shouldReplan: true,
        cause: 'difficulty_mismatch',
        action: { type: 'full_replan' } 
      };
    }

    // Default to format mismatch if nothing else
    return {
      shouldReplan: true,
      cause: 'format_mismatch',
      action: { type: 'full_replan' }
    };
  }

  return { shouldReplan: false };
}
