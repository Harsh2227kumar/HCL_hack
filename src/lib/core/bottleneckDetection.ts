export interface SkillGap {
  skill_name: string;
  gap: number;
}

export interface SkillDependency {
  skill_name: string;
  depends_on_skill_name: string;
}

export interface BottleneckResult {
  skill_name: string;
  bottleneck_score: number;
  downstream_count: number;
}

/**
 * Detects skill bottlenecks by walking the dependency graph.
 * 
 * Formula:
 * bottleneck_score(skill) = gap(skill) × count(downstream_skills_blocked_in_graph)
 * 
 * downstream_skills_blocked = all skills that transitively depend on this skill
 * (BFS/DFS forward through the dependency graph), not just direct dependents.
 * 
 * Sorted descending by bottleneck_score.
 * 
 * @param gaps Gaps calculated for each skill
 * @param skillDependencies Adjacency edges in the dependency graph
 */
export function detectBottleneck(
  gaps: SkillGap[],
  skillDependencies: SkillDependency[]
): BottleneckResult[] {
  if (!gaps || gaps.length === 0) {
    return [];
  }

  // 1. Build a mapping of dependency -> direct dependents
  const dependentsMap = new Map<string, Set<string>>();
  for (const dep of skillDependencies) {
    const parent = dep.depends_on_skill_name;
    const child = dep.skill_name;
    if (!dependentsMap.has(parent)) {
      dependentsMap.set(parent, new Set<string>());
    }
    dependentsMap.get(parent)!.add(child);
  }

  // 2. Helper to traverse and find transitive dependents count with cycle protection
  function getDownstreamCount(startSkill: string): number {
    const visited = new Set<string>();
    // Pre-seed visited with the start node to prevent self-loop cycles and exclude itself from the final count
    visited.add(startSkill);

    const queue: string[] = [startSkill];

    while (queue.length > 0) {
      const current = queue.shift()!;
      const directDeps = dependentsMap.get(current);
      if (directDeps) {
        for (const dep of directDeps) {
          if (!visited.has(dep)) {
            visited.add(dep);
            queue.push(dep);
          }
        }
      }
    }

    return visited.size - 1; // Subtract 1 for the startSkill itself
  }

  // 3. Calculate scores for each skill gap
  const results: BottleneckResult[] = gaps.map((g) => {
    const downstreamCount = getDownstreamCount(g.skill_name);
    const bottleneckScore = g.gap * downstreamCount;
    return {
      skill_name: g.skill_name,
      bottleneck_score: bottleneckScore,
      downstream_count: downstreamCount,
    };
  });

  // 4. Sort descending by bottleneck_score (with tie breakers on count and name)
  results.sort((a, b) => {
    if (Math.abs(b.bottleneck_score - a.bottleneck_score) > 1e-9) {
      return b.bottleneck_score - a.bottleneck_score;
    }
    if (b.downstream_count !== a.downstream_count) {
      return b.downstream_count - a.downstream_count;
    }
    return a.skill_name.localeCompare(b.skill_name);
  });

  return results;
}
