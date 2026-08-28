export interface RankedResource {
  resourceId: string;
  score: number;
  scoreBreakdown?: object;
  skillsTaught: string[];
  prerequisiteSkills: string[];
  durationHours: number;
  difficulty: number;
}

export type PhaseName =
  | 'Foundations'
  | 'Core'
  | 'Applied Project'
  | 'Specialization'
  | 'Capstone';

export interface SortedPathItem {
  resourceId: string;
  phase: PhaseName;
  position: number;
}

export interface SortedPath {
  items: SortedPathItem[];
  estimatedWeeksToGoal: number;
}

const PHASES: PhaseName[] = [
  'Foundations',
  'Core',
  'Applied Project',
  'Specialization',
  'Capstone',
];

/**
 * Pure deterministic topological sort of ranked candidates into 5 phased milestones.
 *
 * @param candidates Array of ranked learning resources from recommendation engine
 * @param weeklyHours Learner's available weekly study hours
 * @returns SortedPath containing phased items and time-to-goal estimate
 */
export function prerequisiteSort(
  candidates: RankedResource[],
  weeklyHours: number
): SortedPath {
  if (!candidates || candidates.length === 0) {
    return {
      items: [],
      estimatedWeeksToGoal: 0,
    };
  }

  const n = candidates.length;
  const resourceMap = new Map<string, RankedResource>();
  candidates.forEach((c) => resourceMap.set(c.resourceId, c));

  // Build skill provider mapping: skill -> list of resourceIds teaching it
  const skillProviders = new Map<string, string[]>();
  candidates.forEach((c) => {
    (c.skillsTaught || []).forEach((skill) => {
      if (!skillProviders.has(skill)) {
        skillProviders.set(skill, []);
      }
      skillProviders.get(skill)!.push(c.resourceId);
    });
  });

  // Graph adjacency list (A -> B means A is a prerequisite for B) and in-degree counter
  const adj = new Map<string, Set<string>>();
  const inDegree = new Map<string, number>();

  candidates.forEach((c) => {
    adj.set(c.resourceId, new Set<string>());
    inDegree.set(c.resourceId, 0);
  });

  candidates.forEach((b) => {
    (b.prerequisiteSkills || []).forEach((prereqSkill) => {
      const providers = skillProviders.get(prereqSkill) || [];
      providers.forEach((aId) => {
        if (aId !== b.resourceId) {
          const targets = adj.get(aId)!;
          if (!targets.has(b.resourceId)) {
            targets.add(b.resourceId);
            inDegree.set(b.resourceId, (inDegree.get(b.resourceId) || 0) + 1);
          }
        }
      });
    });
  });

  // Kahn's algorithm with cycle detection & lowest-score edge removal
  const sortedResult: string[] = [];
  const processed = new Set<string>();

  // Queue of nodes with inDegree === 0, prioritized by resource score (descending)
  let readyNodes = candidates
    .filter((c) => (inDegree.get(c.resourceId) || 0) === 0)
    .map((c) => c.resourceId);

  // Helper to sort ready nodes by score descending for optimal ordering
  const sortReadyNodes = (nodes: string[]) => {
    nodes.sort((a, b) => {
      const scoreA = resourceMap.get(a)?.score ?? 0;
      const scoreB = resourceMap.get(b)?.score ?? 0;
      return scoreB - scoreA;
    });
  };

  sortReadyNodes(readyNodes);

  while (sortedResult.length < n) {
    if (readyNodes.length > 0) {
      const currentId = readyNodes.shift()!;
      sortedResult.push(currentId);
      processed.add(currentId);

      const neighbors = adj.get(currentId) || new Set();
      neighbors.forEach((neighborId) => {
        if (!processed.has(neighborId)) {
          const currentDeg = inDegree.get(neighborId) || 0;
          const newDeg = Math.max(0, currentDeg - 1);
          inDegree.set(neighborId, newDeg);
          if (newDeg === 0 && !readyNodes.includes(neighborId)) {
            readyNodes.push(neighborId);
          }
        }
      });
      sortReadyNodes(readyNodes);
    } else {
      // Cycle detected: remaining unprocessed nodes all have inDegree > 0
      const remaining = candidates
        .map((c) => c.resourceId)
        .filter((id) => !processed.has(id));

      if (remaining.length === 0) break;

      console.warn(
        `[prerequisiteSort] Cycle detected among remaining ${remaining.length} resources. Removing lowest-score edge.`
      );

      // Find all active edges between remaining unprocessed nodes
      interface Edge {
        from: string;
        to: string;
        score: number;
      }
      const activeEdges: Edge[] = [];

      remaining.forEach((fromId) => {
        const neighbors = adj.get(fromId) || new Set();
        neighbors.forEach((toId) => {
          if (!processed.has(toId)) {
            const scoreFrom = resourceMap.get(fromId)?.score ?? 0;
            const scoreTo = resourceMap.get(toId)?.score ?? 0;
            // Edge score can be combined score of target or provider
            activeEdges.push({
              from: fromId,
              to: toId,
              score: Math.min(scoreFrom, scoreTo),
            });
          }
        });
      });

      if (activeEdges.length > 0) {
        // Pick edge with lowest score to break cycle
        activeEdges.sort((e1, e2) => e1.score - e2.score);
        const lowestEdge = activeEdges[0];

        // Break edge lowestEdge.from -> lowestEdge.to
        adj.get(lowestEdge.from)?.delete(lowestEdge.to);
        const currentDeg = inDegree.get(lowestEdge.to) || 1;
        const newDeg = Math.max(0, currentDeg - 1);
        inDegree.set(lowestEdge.to, newDeg);

        console.warn(
          `[prerequisiteSort] Cycle broken by removing edge: ${lowestEdge.from} -> ${lowestEdge.to}`
        );

        if (newDeg === 0) {
          readyNodes.push(lowestEdge.to);
          sortReadyNodes(readyNodes);
        }
      } else {
        // Fallback if no edges found: force push remaining node with highest score
        remaining.sort((a, b) => {
          const scoreA = resourceMap.get(a)?.score ?? 0;
          const scoreB = resourceMap.get(b)?.score ?? 0;
          return scoreB - scoreA;
        });
        const forceNode = remaining[0];
        readyNodes.push(forceNode);
        inDegree.set(forceNode, 0);
      }
    }
  }

  // Bucket sorted items into 5 phases
  const totalItems = sortedResult.length;
  const items: SortedPathItem[] = sortedResult.map((resourceId, index) => {
    // Determine phase index 0..4 evenly
    const phaseIndex = Math.min(Math.floor((index / totalItems) * 5), 4);
    return {
      resourceId,
      phase: PHASES[phaseIndex],
      position: index + 1,
    };
  });

  // Calculate estimated weeks to goal
  const totalHours = candidates.reduce(
    (sum, c) => sum + (c.durationHours || 0),
    0
  );
  const safeWeeklyHours = weeklyHours > 0 ? weeklyHours : 10;
  const estimatedWeeksToGoal = Math.ceil(totalHours / safeWeeklyHours);

  return {
    items,
    estimatedWeeksToGoal,
  };
}
