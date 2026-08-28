import { describe, it, expect } from 'vitest';
import {
  detectBottleneck,
  SkillMastery,
  SkillDependency,
} from '../../src/lib/core/bottleneckDetection';

describe('detectBottleneck', () => {
  // Shared dependency graph:
  // Linear Algebra → Machine Learning → Deep Learning
  //                                   → Computer Vision
  // Calculus       → Machine Learning
  // Python         → Pandas → Data Visualization
  //                         → Data Cleaning
  const dependencies: SkillDependency[] = [
    { skill_name: 'Machine Learning', depends_on_skill_name: 'Linear Algebra' },
    { skill_name: 'Deep Learning', depends_on_skill_name: 'Machine Learning' },
    { skill_name: 'Computer Vision', depends_on_skill_name: 'Machine Learning' },
    { skill_name: 'Machine Learning', depends_on_skill_name: 'Calculus' },
    { skill_name: 'Pandas', depends_on_skill_name: 'Python' },
    { skill_name: 'Data Visualization', depends_on_skill_name: 'Pandas' },
    { skill_name: 'Data Cleaning', depends_on_skill_name: 'Pandas' },
  ];

  it('Scenario 1 — clear bottleneck: Linear Algebra blocks 3 downstream skills', () => {
    // Linear Algebra (low) blocks: ML → DL, CV (3 total)
    // Python (low) blocks: Pandas → DataVis, DataClean (3 total)
    // Calculus (low) blocks: ML → DL, CV (3 total, same as LA)
    // But LA has lowest pKnown → wins the tie-break
    const masteries: SkillMastery[] = [
      { skillName: 'Linear Algebra', pKnown: 0.15 },
      { skillName: 'Calculus', pKnown: 0.25 },
      { skillName: 'Python', pKnown: 0.45 },
      { skillName: 'Machine Learning', pKnown: 0.8 },  // above threshold
      { skillName: 'Deep Learning', pKnown: 0.7 },      // above threshold
    ];

    const result = detectBottleneck(masteries, dependencies);

    expect(result.skill_name).toBe('Linear Algebra');
    expect(result.downstream_count).toBe(3); // ML, DL, CV
    expect(result.pKnown).toBe(0.15);
    expect(result.allCandidates.length).toBe(3); // LA, Calculus, Python
  });

  it('Scenario 2 — tie-breaking: same downstream count, lowest P(known) wins', () => {
    // Both Linear Algebra and Calculus block ML → DL, CV (3 downstream each)
    // Calculus has lower pKnown → should be the bottleneck
    const masteries: SkillMastery[] = [
      { skillName: 'Linear Algebra', pKnown: 0.35 },
      { skillName: 'Calculus', pKnown: 0.10 },
    ];

    const result = detectBottleneck(masteries, dependencies);

    expect(result.skill_name).toBe('Calculus');
    expect(result.downstream_count).toBe(3);
    expect(result.pKnown).toBe(0.10);
  });

  it('Scenario 3 — no bottleneck: all skills above mastery threshold', () => {
    const masteries: SkillMastery[] = [
      { skillName: 'Linear Algebra', pKnown: 0.85 },
      { skillName: 'Calculus', pKnown: 0.75 },
      { skillName: 'Python', pKnown: 0.90 },
      { skillName: 'Machine Learning', pKnown: 0.60 },
    ];

    const result = detectBottleneck(masteries, dependencies);

    expect(result.skill_name).toBeNull();
    expect(result.downstream_count).toBe(0);
    expect(result.allCandidates.length).toBe(0);
  });

  it('should handle empty skill masteries', () => {
    const result = detectBottleneck([], dependencies);
    expect(result.skill_name).toBeNull();
    expect(result.allCandidates.length).toBe(0);
  });

  it('should handle a skill with no downstream dependents', () => {
    // Only Deep Learning is low, and nothing depends on it → downstream = 0
    const masteries: SkillMastery[] = [
      { skillName: 'Deep Learning', pKnown: 0.2 },
    ];

    const result = detectBottleneck(masteries, dependencies);
    expect(result.skill_name).toBe('Deep Learning');
    expect(result.downstream_count).toBe(0);
  });

  it('should support custom mastery threshold', () => {
    const masteries: SkillMastery[] = [
      { skillName: 'Linear Algebra', pKnown: 0.6 },  // above 0.5, below 0.7
      { skillName: 'Calculus', pKnown: 0.55 },         // above 0.5, below 0.7
    ];

    // With default threshold (0.5), both are above → no bottleneck
    const defaultResult = detectBottleneck(masteries, dependencies);
    expect(defaultResult.skill_name).toBeNull();

    // With higher threshold (0.7), both are below → LA or Calculus is bottleneck
    const strictResult = detectBottleneck(masteries, dependencies, 0.7);
    expect(strictResult.skill_name).not.toBeNull();
    expect(strictResult.allCandidates.length).toBe(2);
  });
});
