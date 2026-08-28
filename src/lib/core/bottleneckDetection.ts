/**
 * Bottleneck Detection — finds the skill that blocks the most downstream
 * progress for a learner.
 *
 * Algorithm:
 * 1. Take the learner's per-skill P(known) values from BKT reconciliation
 * 2. Filter to skills with P(known) below a mastery threshold (default 0.5)
 * 3. For each low-mastery skill, walk the dependency graph to count how many
 *    other skills in the learner's goal transitively depend on it
 * 4. The bottleneck is the low-mastery skill that is a prerequisite for the
 *    MOST other skills still needed — not simply the lowest-mastery skill
 * 5. Ties broken by lowest P(known)
 */

export interface SkillMastery {
  /** Skill identifier */
  skillName: string;
  /** P(known) from BKT, in [0, 1] */
  pKnown: number;
}

export interface SkillDependency {
  skill_name: string;
  depends_on_skill_name: string;
}

export interface BottleneckResult {
  /** The identified bottleneck skill (null if none found below threshold) */
  skill_name: string | null;
  /** Number of downstream skills blocked by this bottleneck */
  downstream_count: number;
  /** The P(known) of the bottleneck skill */
  pKnown: number;
  /** Full ranked list of all low-mastery skills with their downstream counts */
  allCandidates: BottleneckCandidate[];
}

export interface BottleneckCandidate {
  skill_name: string;
  pKnown: number;
  downstream_count: number;
}

/** Default threshold: skills with P(known) < 0.5 are considered "not mastered" */
const DEFAULT_MASTERY_THRESHOLD = 0.5;

/**
 * Given a skill, counts how many OTHER skills in the graph transitively
 * depend on it (BFS forward traversal through the dependency graph).
 *
 * The dependency graph is parent → child, where "child depends_on parent".
 * We walk from parent → all transitive children.
 */
function getTransitiveDownstreamCount(
  skill: string,
  dependentsMap: Map<string, Set<string>>
): number {
  const visited = new Set<string>();
  visited.add(skill); // exclude self from count

  const queue: string[] = [skill];

  while (queue.length > 0) {
    const current = queue.shift()!;
    const directDependents = dependentsMap.get(current);
    if (directDependents) {
      for (const dep of directDependents) {
        if (!visited.has(dep)) {
          visited.add(dep);
          queue.push(dep);
        }
      }
    }
  }

  return visited.size - 1; // subtract self
}

/**
 * Detects the current bottleneck skill for a learner.
 *
 * @param skillMasteries  Per-skill P(known) values from BKT reconciliation
 * @param dependencies    Skill dependency edges (from data/skill_dependencies.json)
 * @param masteryThreshold  Skills below this P(known) are considered unmastered (default: 0.5)
 * @returns BottleneckResult with the top bottleneck and the full ranked candidate list
 */
export function detectBottleneck(
  skillMasteries: SkillMastery[],
  dependencies: SkillDependency[],
  masteryThreshold: number = DEFAULT_MASTERY_THRESHOLD
): BottleneckResult {
  // Edge case: no skills at all
  if (!skillMasteries || skillMasteries.length === 0) {
    return {
      skill_name: null,
      downstream_count: 0,
      pKnown: 0,
      allCandidates: [],
    };
  }

  // 1. Build dependents map: parent → set of direct children
  //    "child depends_on parent" means parent → child in the forward graph
  const dependentsMap = new Map<string, Set<string>>();
  for (const dep of dependencies) {
    const parent = dep.depends_on_skill_name;
    const child = dep.skill_name;
    if (!dependentsMap.has(parent)) {
      dependentsMap.set(parent, new Set<string>());
    }
    dependentsMap.get(parent)!.add(child);
  }

  // 2. Filter to low-mastery skills
  const lowMasterySkills = skillMasteries.filter(
    (s) => s.pKnown < masteryThreshold
  );

  // No bottleneck if all skills are above threshold
  if (lowMasterySkills.length === 0) {
    return {
      skill_name: null,
      downstream_count: 0,
      pKnown: 0,
      allCandidates: [],
    };
  }

  // 3. For each low-mastery skill, count transitive downstream dependents
  const candidates: BottleneckCandidate[] = lowMasterySkills.map((s) => ({
    skill_name: s.skillName,
    pKnown: s.pKnown,
    downstream_count: getTransitiveDownstreamCount(s.skillName, dependentsMap),
  }));

  // 4. Sort: highest downstream_count first; tie-break by lowest P(known)
  candidates.sort((a, b) => {
    if (b.downstream_count !== a.downstream_count) {
      return b.downstream_count - a.downstream_count;
    }
    return a.pKnown - b.pKnown; // lower mastery = more urgent bottleneck
  });

  const top = candidates[0];

  return {
    skill_name: top.skill_name,
    downstream_count: top.downstream_count,
    pKnown: top.pKnown,
    allCandidates: candidates,
  };
}
