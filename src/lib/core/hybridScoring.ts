import { Resource, SkillModel, UserProfile } from '@/types';
import { SkillGap } from './skillGap';

export interface ScoredResource {
  resourceId: string;
  totalScore: number;
  scoreBreakdown: {
    gapMatch: number;
    prerequisiteFit: number;
    difficultyFit: number;
    timeFit: number;
    formatFit: number;
  };
  notRecommendedYet: boolean;
  reason?: string;
}

export function scoreResources(
  resources: Resource[],
  learnerSkills: SkillModel[],
  gaps: SkillGap[],
  learnerProfile: UserProfile
): ScoredResource[] {
  const scored: ScoredResource[] = [];
  const skillMap = new Map(learnerSkills.map(s => [s.skillName, s.finalEstimate]));
  const topGaps = new Set(gaps.slice(0, 3).map(g => g.skillName));

  const weeklyHours = learnerProfile.weeklyHours || 10;

  for (const res of resources) {
    let notRecommendedYet = false;
    const unmetPrereqs: string[] = [];

    // Check prerequisites
    const prereqs: string[] = (res.prerequisiteSkills as any) || [];
    let prerequisiteFit = 1; // 1 means perfect fit, lower means unmet

    for (const prereq of prereqs) {
      const currentLevel = skillMap.get(prereq) || 0;
      // Assume level 3 is required to consider a prereq "met" for this demo
      if (currentLevel < 3) {
        unmetPrereqs.push(prereq);
        notRecommendedYet = true;
        prerequisiteFit = 0;
      }
    }

    // Gap Match
    let gapMatch = 0;
    const skillsTaught: string[] = (res.skillsTaught as any) || [];
    for (const st of skillsTaught) {
      if (topGaps.has(st)) {
        gapMatch = 1;
        break;
      } else if (gaps.find(g => g.skillName === st)) {
        gapMatch = 0.5;
      }
    }

    // Difficulty Fit (1-5 scale)
    // Assume we target resources slightly above current level
    let avgCurrentLevel = 0;
    if (skillsTaught.length > 0) {
      const levels = skillsTaught.map(st => skillMap.get(st) || 0);
      avgCurrentLevel = levels.reduce((a, b) => a + b, 0) / levels.length;
    }
    const difficultyDiff = Math.abs(res.difficulty - (avgCurrentLevel + 1));
    const difficultyFit = Math.max(0, 1 - (difficultyDiff * 0.25));

    // Time Fit
    const duration = res.durationHours || 1;
    let timeFit = 1;
    if (duration > weeklyHours * 2) {
      timeFit = 0.5; // Penalty for very long courses compared to weekly budget
    }

    // Format Fit
    let formatFit = 0.5; // neutral
    if (learnerProfile.learningStyle && res.format) {
      if (learnerProfile.learningStyle === 'visual' && res.format === 'video') formatFit = 1;
      if (learnerProfile.learningStyle === 'reading' && res.format === 'article') formatFit = 1;
      if (learnerProfile.learningStyle === 'kinesthetic' && res.format === 'interactive') formatFit = 1;
    }

    const gapMatchWeight = 0.30;
    const prereqWeight = 0.25;
    const diffWeight = 0.20;
    const timeWeight = 0.15;
    const formatWeight = 0.10;

    const totalScore = 
      (gapMatch * gapMatchWeight) +
      (prerequisiteFit * prereqWeight) +
      (difficultyFit * diffWeight) +
      (timeFit * timeWeight) +
      (formatFit * formatWeight);

    let reason = '';
    if (notRecommendedYet) {
      reason = `Prerequisites not met: ${unmetPrereqs.join(', ')}`;
    }

    scored.push({
      resourceId: res.id,
      totalScore,
      scoreBreakdown: {
        gapMatch,
        prerequisiteFit,
        difficultyFit,
        timeFit,
        formatFit
      },
      notRecommendedYet,
      reason
    });
  }

  // Sort by score desc, but put notRecommendedYet at the bottom
  scored.sort((a, b) => {
    if (a.notRecommendedYet && !b.notRecommendedYet) return 1;
    if (!a.notRecommendedYet && b.notRecommendedYet) return -1;
    return b.totalScore - a.totalScore;
  });

  return scored;
}
