import { assignPhase, Phase } from './phaseAssignment';

export interface RankedResource {
  resourceId: string;
  score: number;
  scoreBreakdown?: object;
  skillsTaught: string[];
  prerequisiteSkills: string[];
  durationHours: number;
  difficulty: number;
  type?: string;
}

export type PhaseName = Phase;

export interface SortedPathItem {
  resourceId: string;
  phase: PhaseName;
  position: number;
}

export interface SortedPath {
  items: SortedPathItem[];
  estimatedWeeksToGoal: number;
}

/**
 * Pure deterministic topological sort of ranked candidates into phased milestones.
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
  const candidateIndexMap = new Map<string, number>();
  candidates.forEach((c, idx) => {
    resourceMap.set(c.resourceId, c);
    candidateIndexMap.set(c.resourceId, idx);
  });

  // Build skill provider mapping: skill -> list of RankedResource candidates teaching it
  const skillProviders = new Map<string, RankedResource[]>();
  candidates.forEach((c) => {
    (c.skillsTaught || []).forEach((skill) => {
      if (!skillProviders.has(skill)) {
        skillProviders.set(skill, []);
      }
      skillProviders.get(skill)!.push(c);
    });
  });

  // Helper: compute providerScore for candidate selection
  function getProviderScore(cand: RankedResource): number {
    const candIndex = candidateIndexMap.get(cand.resourceId) ?? 0;
    const prereqs = cand.prerequisiteSkills || [];
    let bonus = 0;
    if (prereqs.length === 0) {
      bonus = 0.05;
    } else {
      const earlierSkills = new Set<string>();
      for (let i = 0; i < candIndex; i++) {
        (candidates[i].skillsTaught || []).forEach((s) => earlierSkills.add(s));
      }
      if (prereqs.every((p) => earlierSkills.has(p))) {
        bonus = 0.05;
      }
    }
    return cand.score + bonus;
  }

  // Graph adjacency list (A -> B means A is a prerequisite for B) and in-degree counter
  const adj = new Map<string, Set<string>>();
  const reverseAdj = new Map<string, Set<string>>();
  const inDegree = new Map<string, number>();

  candidates.forEach((c) => {
    adj.set(c.resourceId, new Set<string>());
    reverseAdj.set(c.resourceId, new Set<string>());
    inDegree.set(c.resourceId, 0);
  });

  // For each resource b and each prerequisite skill it needs, select only the SINGLE BEST provider
  candidates.forEach((b) => {
    (b.prerequisiteSkills || []).forEach((prereqSkill) => {
      const providers = (skillProviders.get(prereqSkill) || []).filter(
        (a) => a.resourceId !== b.resourceId
      );

      if (providers.length > 0) {
        // Pick best provider by highest providerScore, tie-broken by lower difficulty
        let bestProvider = providers[0];
        let bestScore = getProviderScore(bestProvider);

        for (let i = 1; i < providers.length; i++) {
          const cand = providers[i];
          const candScore = getProviderScore(cand);

          if (
            candScore > bestScore ||
            (Math.abs(candScore - bestScore) < 1e-6 && cand.difficulty < bestProvider.difficulty)
          ) {
            bestProvider = cand;
            bestScore = candScore;
          }
        }

        const aId = bestProvider.resourceId;
        const targets = adj.get(aId)!;
        if (!targets.has(b.resourceId)) {
          targets.add(b.resourceId);
          reverseAdj.get(b.resourceId)!.add(aId);
          inDegree.set(b.resourceId, (inDegree.get(b.resourceId) || 0) + 1);
        }
      }
    });
  });

  // Kahn's algorithm with cycle detection & lowest-score edge removal
  const sortedResult: string[] = [];
  const processed = new Set<string>();

  const readyNodes = candidates
    .filter((c) => (inDegree.get(c.resourceId) || 0) === 0)
    .map((c) => c.resourceId);

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
      // Cycle detected
      const remaining = candidates
        .map((c) => c.resourceId)
        .filter((id) => !processed.has(id));

      if (remaining.length === 0) break;

      console.warn(
        `[prerequisiteSort] Cycle detected among remaining ${remaining.length} resources. Removing lowest-score edge.`
      );

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
            activeEdges.push({
              from: fromId,
              to: toId,
              score: Math.min(scoreFrom, scoreTo),
            });
          }
        });
      });

      if (activeEdges.length > 0) {
        activeEdges.sort((e1, e2) => e1.score - e2.score);
        const lowestEdge = activeEdges[0];

        adj.get(lowestEdge.from)?.delete(lowestEdge.to);
        reverseAdj.get(lowestEdge.to)?.delete(lowestEdge.from);
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

  // Calculate prerequisiteDepth for each node in sorted order
  const depthMap = new Map<string, number>();
  for (const id of sortedResult) {
    const preds = reverseAdj.get(id);
    if (!preds || preds.size === 0) {
      depthMap.set(id, 0);
    } else {
      let maxPredDepth = 0;
      for (const pId of preds) {
        const pDepth = depthMap.get(pId) ?? 0;
        if (pDepth > maxPredDepth) {
          maxPredDepth = pDepth;
        }
      }
      depthMap.set(id, maxPredDepth + 1);
    }
  }

  // Assign semantic phases using assignPhase module
  const items: SortedPathItem[] = sortedResult.map((resourceId, index) => {
    const cand = resourceMap.get(resourceId)!;
    const depth = depthMap.get(resourceId) ?? 0;
    const phase = assignPhase({
      resourceId: cand.resourceId,
      type: cand.type || 'course',
      difficulty: cand.difficulty,
      prerequisiteDepth: depth,
    });
    return {
      resourceId,
      phase,
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
