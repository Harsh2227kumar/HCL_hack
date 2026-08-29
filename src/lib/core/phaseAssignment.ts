export type Phase = "Foundations" | "Core" | "Applied Project" | "Specialization" | "Capstone";

export interface PhaseableResource {
  resourceId: string;
  type: string; // course, project, assessment, article
  difficulty: number; // 1-5
  prerequisiteDepth: number; // how many levels deep in the dependency graph (0 = no prereqs)
}

/**
 * Assigns a semantic phase to a learning resource based on its depth, difficulty, and type.
 */
export function assignPhase(resource: PhaseableResource): Phase {
  const { type, difficulty, prerequisiteDepth } = resource;
  const normalizedType = (type || 'course').toLowerCase();

  // Rule 1: prerequisiteDepth === 0 AND difficulty <= 2 -> Foundations
  if (prerequisiteDepth === 0 && difficulty <= 2) {
    return "Foundations";
  }

  // Rule 5: (type === "project" OR type === "assessment") AND prerequisiteDepth >= 4 -> Capstone
  if ((normalizedType === "project" || normalizedType === "assessment") && prerequisiteDepth >= 4) {
    return "Capstone";
  }

  // Rule 3: type === "project" AND prerequisiteDepth < 4 -> Applied Project
  if (normalizedType === "project" && prerequisiteDepth < 4) {
    return "Applied Project";
  }

  // Rule 4: difficulty >= 4 AND prerequisiteDepth >= 2 -> Specialization
  if (difficulty >= 4 && prerequisiteDepth >= 2) {
    return "Specialization";
  }

  // Rule 2: prerequisiteDepth <= 2 AND type !== "project" -> Core
  if (prerequisiteDepth <= 2 && normalizedType !== "project") {
    return "Core";
  }

  // Fallback: Core
  return "Core";
}
