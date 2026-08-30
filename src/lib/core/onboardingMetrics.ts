import { PathPhase } from './prerequisiteSort';
import { Resource } from '@/types';

export interface PathwayMetrics {
  totalHours: number;
  estimatedWeeks: number;
  readinessBefore: number;
  readinessAfter: number;
  readinessImprovement: number;
  modulesCount: number;
  phasesCount: number;
}

export function calculatePathwayMetrics(
  phases: PathPhase[],
  readinessBefore: number,
  weeklyHours: number,
  resourceMap: Map<string, Resource>
): PathwayMetrics {
  let totalHours = 0;
  let modulesCount = 0;

  for (const phase of phases) {
    for (const item of phase.items) {
      const resource = resourceMap.get(item.resourceId);
      if (resource && resource.durationHours) {
        totalHours += resource.durationHours;
      }
      modulesCount++;
    }
  }

  const estimatedWeeks = weeklyHours > 0 ? Math.ceil(totalHours / weeklyHours) : 0;
  const readinessAfter = 1.0; // By definition, completing the path meets all required skills
  const readinessImprovement = Number(((readinessAfter - readinessBefore) * 100).toFixed(1));

  return {
    totalHours: Number(totalHours.toFixed(1)),
    estimatedWeeks,
    readinessBefore: Number(readinessBefore.toFixed(2)),
    readinessAfter,
    readinessImprovement,
    modulesCount,
    phasesCount: phases.length
  };
}
