export interface ClaimedSkill {
  skill_name: string;
  self_rated_level: number;
  target_level: number;
  confidence_score?: number | null;
}

export interface SkillDependency {
  skill_name: string;
  depends_on_skill_name: string;
}

/**
 * Selects the top N skills for diagnostic testing based on priority.
 * 
 * priority(skill) = target_importance × current_uncertainty × prerequisite_criticality
 * 
 * - target_importance = target_level / 5
 * - current_uncertainty = 1 - confidence_score (if confidence_score is null/undefined/missing, treat as 1)
 * - prerequisite_criticality = count of skills that directly or transitively depend on this skill,
 *                              normalized 0-1 against the max in this learner's skill set.
 *                              If a skill has 0 downstream dependents, we assign it a baseline of 0.1
 *                              so it remains selectable if target importance and uncertainty are high.
 * 
 * @param claimedSkills List of skills claimed by the user
 * @param skillDependencies The global list of skill dependencies
 * @param topN Number of skills to select
 */
export function selectSkillsForDiagnostic(
  claimedSkills: ClaimedSkill[],
  skillDependencies: SkillDependency[],
  topN: number
): string[] {
  if (!claimedSkills || claimedSkills.length === 0 || topN <= 0) {
    return [];
  }

  // 1. Deduplicate claimed skills
  // Keep the entry representing the higher diagnostic need (higher target or lower confidence/higher uncertainty)
  const uniqueSkillsMap = new Map<string, ClaimedSkill>();
  for (const skill of claimedSkills) {
    const name = skill.skill_name;
    if (!uniqueSkillsMap.has(name)) {
      uniqueSkillsMap.set(name, skill);
    } else {
      const existing = uniqueSkillsMap.get(name)!;
      const existingConf = existing.confidence_score ?? 0;
      const currentConf = skill.confidence_score ?? 0;

      if (
        skill.target_level > existing.target_level ||
        (skill.target_level === existing.target_level && currentConf < existingConf)
      ) {
        uniqueSkillsMap.set(name, skill);
      }
    }
  }
  const deduplicatedSkills = Array.from(uniqueSkillsMap.values());

  // 2. Build dependents adjacency map (parent/dependency -> Set of direct dependents)
  const dependentsMap = new Map<string, Set<string>>();
  for (const dep of skillDependencies) {
    const parent = dep.depends_on_skill_name;
    const child = dep.skill_name;
    if (!dependentsMap.has(parent)) {
      dependentsMap.set(parent, new Set<string>());
    }
    dependentsMap.get(parent)!.add(child);
  }

  // Helper to count transitive downstream dependents of a skill
  function getTransitiveDependentsCount(startSkill: string): number {
    const visited = new Set<string>();
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
    return visited.size;
  }

  // 3. Compute raw criticality count for all claimed skills
  const rawCriticalities = new Map<string, number>();
  let maxRawCriticality = 0;

  for (const skill of deduplicatedSkills) {
    const count = getTransitiveDependentsCount(skill.skill_name);
    rawCriticalities.set(skill.skill_name, count);
    if (count > maxRawCriticality) {
      maxRawCriticality = count;
    }
  }

  // 4. Calculate final priority scores
  const skillPriorities = deduplicatedSkills.map((skill) => {
    const targetImportance = skill.target_level / 5.0;

    const confidence = skill.confidence_score ?? 0;
    const currentUncertainty = 1.0 - confidence;

    const rawCrit = rawCriticalities.get(skill.skill_name) ?? 0;
    // Normalize raw criticality. If maxRawCriticality is 0, all normalized criticalities are 0.
    const normalizedCriticality = maxRawCriticality > 0 ? rawCrit / maxRawCriticality : 0;

    // Use a baseline of 0.1 if normalized criticality is 0 (e.g. no dependents)
    const prerequisiteCriticality = normalizedCriticality === 0 ? 0.1 : normalizedCriticality;

    const priority = targetImportance * currentUncertainty * prerequisiteCriticality;

    return {
      skill_name: skill.skill_name,
      priority,
    };
  });

  // 5. Sort descending by priority (fallback to alphabetical tie-breaking)
  skillPriorities.sort((a, b) => {
    if (Math.abs(b.priority - a.priority) > 1e-9) {
      return b.priority - a.priority;
    }
    return a.skill_name.localeCompare(b.skill_name);
  });

  return skillPriorities.slice(0, topN).map((sp) => sp.skill_name);
}
