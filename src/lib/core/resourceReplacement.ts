import { prisma } from '../prisma';
import { scoreResource, LearnerContext as ScoringLearnerContext } from './hybridScoring';
import skillDependenciesData from '../../../data/skill_dependencies.json';

export type DbResource = Awaited<ReturnType<typeof prisma.learningResource.findFirst>>;

export interface PrerequisiteSearchResult {
  insertedResource: DbResource;
  weakestSkill: string | null;
}

export interface HarderAlternativeResult {
  replacementResource: DbResource;
  targetSkill: string | null;
}

/**
 * Searches LearningResource for an easier resource teaching the weakest prerequisite
 * or foundational skill for the learner, excluding items already present in the current path.
 */
export async function findRemedialPrerequisiteResource(
  currentResource: DbResource | { prerequisiteSkills?: unknown; skillsTaught?: unknown; difficulty?: unknown; title?: string } | null,
  userSkills: Array<{ skillName: string; finalEstimate: number; targetLevel: number; confidenceScore: number }>,
  existingResourceIds: Set<string>,
  learnerContext: ScoringLearnerContext
): Promise<PrerequisiteSearchResult> {
  const prereqSkills: string[] = (currentResource?.prerequisiteSkills as string[]) || [];
  const skillsTaught: string[] = (currentResource?.skillsTaught as string[]) || [];
  const currentDifficulty = typeof currentResource?.difficulty === 'number' ? currentResource.difficulty : 3;

  // 1. Identify weakest prerequisite skill
  let weakestSkill: string | null = null;
  let lowestScore = Infinity;

  // Check explicit prerequisite skills first
  if (prereqSkills.length > 0) {
    for (const p of prereqSkills) {
      const sk = userSkills.find((s) => s.skillName.toLowerCase() === p.toLowerCase());
      const est = sk ? sk.finalEstimate : 0;
      if (est < lowestScore) {
        lowestScore = est;
        weakestSkill = p;
      }
    }
  }

  // If no explicit prerequisite skills, look up graph dependencies of skills taught
  if (!weakestSkill && skillsTaught.length > 0) {
    const deps = (skillDependenciesData as Array<{ skill_name: string; depends_on_skill_name: string }>)
      .filter((d) => skillsTaught.some((st) => st.toLowerCase() === d.skill_name.toLowerCase()))
      .map((d) => d.depends_on_skill_name);

    for (const dep of deps) {
      const sk = userSkills.find((s) => s.skillName.toLowerCase() === dep.toLowerCase());
      const est = sk ? sk.finalEstimate : 0;
      if (est < lowestScore) {
        lowestScore = est;
        weakestSkill = dep;
      }
    }
  }

  // If still no weakestSkill, check foundational skills taught by current resource
  if (!weakestSkill && skillsTaught.length > 0) {
    for (const st of skillsTaught) {
      const sk = userSkills.find((s) => s.skillName.toLowerCase() === st.toLowerCase());
      const est = sk ? sk.finalEstimate : 0;
      if (est < lowestScore) {
        lowestScore = est;
        weakestSkill = st;
      }
    }
  }

  // 2. Query available resources not already in current path
  const candidates = await prisma.learningResource.findMany({
    where: {
      id: {
        notIn: Array.from(existingResourceIds),
      },
    },
  });

  if (!candidates.length) {
    return { insertedResource: null, weakestSkill };
  }

  // Skills we want to remediate
  const targetSkills = [weakestSkill, ...prereqSkills].filter(Boolean) as string[];

  // 3. Score and rank candidates
  const scoredCandidates = candidates.map((cand) => {
    const candSkillsTaught = (cand.skillsTaught as string[]) || [];
    const candDiff = typeof cand.difficulty === 'number' ? cand.difficulty : 3;

    // Check if candidate teaches any targeted skill
    const teachesTarget = targetSkills.some((ts) =>
      candSkillsTaught.some(
        (cs) =>
          cs.toLowerCase() === ts.toLowerCase() ||
          cs.toLowerCase().includes(ts.toLowerCase()) ||
          ts.toLowerCase().includes(cs.toLowerCase())
      )
    );

    // Check if candidate teaches exact weakest skill
    const teachesWeakest = weakestSkill
      ? candSkillsTaught.some(
          (cs) =>
            cs.toLowerCase() === weakestSkill!.toLowerCase() ||
            cs.toLowerCase().includes(weakestSkill!.toLowerCase()) ||
            weakestSkill!.toLowerCase().includes(cs.toLowerCase())
        )
      : false;

    // Is candidate easier?
    const isEasier = candDiff < currentDifficulty;
    const isSameDiffIfBeginner = currentDifficulty <= 2 && candDiff <= currentDifficulty;
    const diffBonus = isEasier ? 2.0 : isSameDiffIfBeginner ? 1.0 : -1.0;

    // Score using hybrid scoring
    const hybrid = scoreResource(
      {
        id: cand.id,
        skills_taught: candSkillsTaught,
        prerequisite_skills: (cand.prerequisiteSkills as string[]) || [],
        difficulty: candDiff,
        duration_hours: cand.durationHours ?? undefined,
        format: cand.format ?? undefined,
      },
      learnerContext,
      0.8
    );

    let priorityScore = hybrid.score;
    if (teachesWeakest) priorityScore += 4.0;
    else if (teachesTarget) priorityScore += 2.0;
    priorityScore += diffBonus;

    return {
      resource: cand,
      teachesTarget: teachesTarget || teachesWeakest,
      isEasier: isEasier || isSameDiffIfBeginner,
      priorityScore,
      hybridScore: hybrid.score,
    };
  });

  // Filter to candidates that teach target skills
  const validMatches = scoredCandidates.filter((c) => c.teachesTarget);

  if (validMatches.length > 0) {
    validMatches.sort((a, b) => b.priorityScore - a.priorityScore);
    return {
      insertedResource: validMatches[0].resource,
      weakestSkill,
    };
  }

  // If no direct target skill match, look for any easier foundational resource
  const foundationalMatches = scoredCandidates.filter((c) => c.isEasier && c.priorityScore > 0);
  if (foundationalMatches.length > 0) {
    foundationalMatches.sort((a, b) => b.priorityScore - a.priorityScore);
    return {
      insertedResource: foundationalMatches[0].resource,
      weakestSkill,
    };
  }

  return { insertedResource: null, weakestSkill };
}

/**
 * Searches LearningResource for a harder alternative resource teaching the same skills
 * with higher difficulty (>= currentDifficulty + 1) for learners who find content too easy.
 */
export async function findHarderAlternative(
  currentResource: DbResource | { prerequisiteSkills?: unknown; skillsTaught?: unknown; difficulty?: unknown; title?: string } | null,
  userSkills: Array<{ skillName: string; finalEstimate: number; targetLevel: number; confidenceScore: number }>,
  excludeResourceIds: Set<string>,
  learnerContext: ScoringLearnerContext
): Promise<HarderAlternativeResult> {
  const skillsTaught: string[] = (currentResource?.skillsTaught as string[]) || [];
  const currentDifficulty = typeof currentResource?.difficulty === 'number' ? currentResource.difficulty : 3;
  const targetSkill = skillsTaught.length > 0 ? skillsTaught[0] : null;

  const candidates = await prisma.learningResource.findMany({
    where: {
      id: {
        notIn: Array.from(excludeResourceIds),
      },
    },
  });

  if (!candidates.length || skillsTaught.length === 0) {
    return { replacementResource: null, targetSkill };
  }

  const validCandidates = candidates.filter((cand) => {
    const candSkillsTaught = (cand.skillsTaught as string[]) || [];
    const candDiff = typeof cand.difficulty === 'number' ? cand.difficulty : 3;

    // Must be at least 1 level harder
    if (candDiff < currentDifficulty + 1) {
      return false;
    }

    // Must teach at least one of the same skills
    const teachesSkill = skillsTaught.some((st) =>
      candSkillsTaught.some(
        (cs) =>
          cs.toLowerCase() === st.toLowerCase() ||
          cs.toLowerCase().includes(st.toLowerCase()) ||
          st.toLowerCase().includes(cs.toLowerCase())
      )
    );

    return teachesSkill;
  });

  if (!validCandidates.length) {
    return { replacementResource: null, targetSkill };
  }

  const scoredCandidates = validCandidates.map((cand) => {
    const candSkillsTaught = (cand.skillsTaught as string[]) || [];
    const candDiff = typeof cand.difficulty === 'number' ? cand.difficulty : 3;

    const hybrid = scoreResource(
      {
        id: cand.id,
        skills_taught: candSkillsTaught,
        prerequisite_skills: (cand.prerequisiteSkills as string[]) || [],
        difficulty: candDiff,
        duration_hours: cand.durationHours ?? undefined,
        format: cand.format ?? undefined,
      },
      learnerContext,
      0.8
    );

    const priorityScore = hybrid.score + (candDiff - currentDifficulty) * 0.5;

    return {
      resource: cand,
      priorityScore,
    };
  });

  scoredCandidates.sort((a, b) => b.priorityScore - a.priorityScore);

  return {
    replacementResource: scoredCandidates[0].resource,
    targetSkill,
  };
}
