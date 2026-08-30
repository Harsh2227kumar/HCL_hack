import { SkillDependency } from '@/types';
import { ScoredResource } from './hybridScoring';

export interface PathPhase {
  phase: number;
  phaseName: string;
  items: { resourceId: string; position: number; score: number; reason: string }[];
}

export function generatePath(
  scoredResources: ScoredResource[],
  dependencies: SkillDependency[],
  weeklyHours: number,
  resourceMap: Map<string, any> // To get duration and prereqs
): { phases: PathPhase[]; estimatedWeeksToGoal: number } {
  
  const validResources = scoredResources.filter(sr => !sr.notRecommendedYet);
  
  // We need to build a DAG of resources based on the skills they teach and require
  
  const resourceDeps = new Map<string, string[]>();
  for (const sr of validResources) {
    const res = resourceMap.get(sr.resourceId);
    if (res) {
      const prereqs = (res.prerequisiteSkills as string[]) || [];
      // find which valid resources teach these prereqs
      const deps: string[] = [];
      for (const pr of prereqs) {
         const prereqProvider = validResources.find(v => {
           const vRes = resourceMap.get(v.resourceId);
           return vRes && (vRes.skillsTaught as string[] || []).includes(pr);
         });
         if (prereqProvider) {
           deps.push(prereqProvider.resourceId);
         }
      }
      resourceDeps.set(sr.resourceId, deps);
    } else {
      resourceDeps.set(sr.resourceId, []);
    }
  }

  // Topological Sort with phase assignment (Kahn's algorithm level-by-level)
  const inDegree = new Map<string, number>();
  const graph = new Map<string, string[]>();

  for (const sr of validResources) {
    inDegree.set(sr.resourceId, 0);
    graph.set(sr.resourceId, []);
  }

  for (const [resId, deps] of Array.from(resourceDeps.entries())) {
    for (const dep of deps) {
      if (graph.has(dep)) {
        graph.get(dep)!.push(resId);
        inDegree.set(resId, (inDegree.get(resId) || 0) + 1);
      }
    }
  }

  let queue: string[] = [];
  for (const [resId, degree] of Array.from(inDegree.entries())) {
    if (degree === 0) queue.push(resId);
  }

  const phases: PathPhase[] = [];
  const phaseNames = ["Foundations", "Core", "Applied Project", "Specialization", "Capstone"];
  let phaseIndex = 1;
  let totalDuration = 0;

  while (queue.length > 0) {
    const nextQueue: string[] = [];
    const items = [];
    let position = 1;

    for (const resId of queue) {
      const sr = validResources.find(r => r.resourceId === resId)!;
      items.push({
        resourceId: resId,
        position: position++,
        score: sr.totalScore,
        reason: sr.reason || ''
      });

      const res = resourceMap.get(resId);
      if (res && res.durationHours) {
        totalDuration += res.durationHours;
      }

      for (const neighbor of graph.get(resId) || []) {
        inDegree.set(neighbor, inDegree.get(neighbor)! - 1);
        if (inDegree.get(neighbor) === 0) {
          nextQueue.push(neighbor);
        }
      }
    }
    
    // Sort items within phase by score
    items.sort((a, b) => b.score - a.score);

    phases.push({
      phase: phaseIndex,
      phaseName: phaseNames[Math.min(phaseIndex - 1, 4)],
      items
    });

    queue = nextQueue;
    phaseIndex++;
  }

  // Handle cycles or unconnected components by just appending them
  for (const sr of validResources) {
    const found = phases.some(p => p.items.some(i => i.resourceId === sr.resourceId));
    if (!found) {
       // Just put them in a final phase
       if (phases.length === 0) {
         phases.push({ phase: 1, phaseName: phaseNames[0], items: [] });
       }
       phases[phases.length - 1].items.push({
         resourceId: sr.resourceId,
         position: phases[phases.length - 1].items.length + 1,
         score: sr.totalScore,
         reason: sr.reason || ''
       });
       const res = resourceMap.get(sr.resourceId);
       if (res && res.durationHours) totalDuration += res.durationHours;
    }
  }

  const estimatedWeeksToGoal = weeklyHours > 0 ? totalDuration / weeklyHours : 0;

  return { phases, estimatedWeeksToGoal };
}
