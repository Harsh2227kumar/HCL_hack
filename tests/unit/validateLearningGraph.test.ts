import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { validateLearningGraph } from '../../scripts/validateLearningGraph';

describe('Learning Graph Validator (validateLearningGraph)', () => {
  let tempDir: string;

  const validSkills = [
    { canonical: 'Python', aliases: ['Py'] },
    { canonical: 'Machine Learning', aliases: ['ML'] },
  ];
  const validGoals = [
    {
      id: 'g1',
      goal_name: 'AI Engineering',
      required_skills: [{ skill: 'Python' }],
    },
  ];
  const validResources = [
    {
      id: 'r1',
      title: 'Python Course',
      type: 'course',
      provider: 'Test Provider',
      url: 'https://example.org/python',
      difficulty: 'beginner',
      format: 'text',
      skills_taught: ['Python'],
      prerequisite_skills: [],
    },
    {
      id: 'res_assess_01',
      title: 'Python Certification Test',
      type: 'assessment',
      provider: 'HackerRank',
      url: 'https://www.hackerrank.com/skills-verification/python_basic',
      difficulty: 'beginner',
      format: 'interactive',
      skills_taught: ['Python'],
      prerequisite_skills: [],
    },
  ];
  const validDeps = [
    {
      id: 'd1',
      skill_name: 'Machine Learning',
      depends_on_skill_name: 'Python',
    },
  ];

  beforeAll(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'graph-val-test-'));
  });

  afterAll(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  function createTestFixtures(overrides: {
    skills?: unknown[];
    goals?: unknown[];
    resources?: unknown[];
    deps?: unknown[];
  }) {
    const sPath = path.join(tempDir, `skills_${Date.now()}_${Math.random()}.json`);
    const gPath = path.join(tempDir, `goals_${Date.now()}_${Math.random()}.json`);
    const rPath = path.join(tempDir, `resources_${Date.now()}_${Math.random()}.json`);
    const dPath = path.join(tempDir, `deps_${Date.now()}_${Math.random()}.json`);

    fs.writeFileSync(sPath, JSON.stringify(overrides.skills || validSkills));
    fs.writeFileSync(gPath, JSON.stringify(overrides.goals || validGoals));
    fs.writeFileSync(rPath, JSON.stringify(overrides.resources || validResources));
    fs.writeFileSync(dPath, JSON.stringify(overrides.deps || validDeps));

    return {
      skillsPath: sPath,
      goalTemplatesPath: gPath,
      learningResourcesPath: rPath,
      skillDependenciesPath: dPath,
      silent: true,
    };
  }

  it('Case 1: Valid graph returns PASS', () => {
    const config = createTestFixtures({});
    const report = validateLearningGraph(config);
    expect(report.success).toBe(true);
    expect(report.errors).toHaveLength(0);
  });

  it('Case 2: Unknown skill in resource causes FAIL', () => {
    const config = createTestFixtures({
      resources: [
        {
          id: 'r1',
          title: 'Unknown Tech',
          skills_taught: ['Quantum Supercomputing'],
        },
      ],
    });
    const report = validateLearningGraph(config);
    expect(report.success).toBe(false);
    expect(report.unknownResourceSkillsCount).toBeGreaterThan(0);
  });

  it('Case 3: Duplicate canonical skill causes FAIL', () => {
    const config = createTestFixtures({
      skills: [
        { canonical: 'Python', aliases: ['Py'] },
        { canonical: 'Python', aliases: ['Py3'] },
      ],
    });
    const report = validateLearningGraph(config);
    expect(report.success).toBe(false);
    expect(report.duplicateCanonicalCount).toBe(1);
  });

  it('Case 4: Alias collision causes FAIL', () => {
    const config = createTestFixtures({
      skills: [
        { canonical: 'Machine Learning', aliases: ['ML'] },
        { canonical: 'Markup Language', aliases: ['ML'] },
      ],
    });
    const report = validateLearningGraph(config);
    expect(report.success).toBe(false);
    expect(report.aliasCollisionCount).toBe(1);
  });

  it('Case 5: Missing resource provider for goal skill causes FAIL', () => {
    const config = createTestFixtures({
      resources: [
        {
          id: 'r1',
          title: 'Machine Learning Course',
          skills_taught: ['Machine Learning'],
        },
      ],
      goals: [
        {
          id: 'g1',
          goal_name: 'Python Developer',
          required_skills: [{ skill: 'Python' }],
        },
      ],
    });
    const report = validateLearningGraph(config);
    expect(report.success).toBe(false);
    expect(report.missingResourceProvidersCount).toBeGreaterThan(0);
  });

  it('Case 6: Dependency cycle (A -> B -> A) causes FAIL', () => {
    const config = createTestFixtures({
      skills: [
        { canonical: 'Skill A', aliases: [] },
        { canonical: 'Skill B', aliases: [] },
      ],
      resources: [
        { id: 'r1', title: 'A', skills_taught: ['Skill A'] },
        { id: 'r2', title: 'B', skills_taught: ['Skill B'] },
      ],
      deps: [
        { skill_name: 'Skill A', depends_on_skill_name: 'Skill B' },
        { skill_name: 'Skill B', depends_on_skill_name: 'Skill A' },
      ],
    });
    const report = validateLearningGraph(config);
    expect(report.success).toBe(false);
    expect(report.cyclesCount).toBeGreaterThan(0);
  });

  it('Case 7: Self-dependency (Python -> Python) causes FAIL', () => {
    const config = createTestFixtures({
      deps: [
        { skill_name: 'Python', depends_on_skill_name: 'Python' },
      ],
    });
    const report = validateLearningGraph(config);
    expect(report.success).toBe(false);
    expect(report.selfDependenciesCount).toBe(1);
  });

  it('Case 8: Duplicate resource ID causes FAIL', () => {
    const config = createTestFixtures({
      resources: [
        { id: 'res_dup', title: 'Course 1', skills_taught: ['Python'] },
        { id: 'res_dup', title: 'Course 2', skills_taught: ['Python'] },
      ],
    });
    const report = validateLearningGraph(config);
    expect(report.success).toBe(false);
    expect(report.invalidResourceIdsCount).toBe(1);
  });

  it('Assessment Check 1: Assessment missing title causes FAIL', () => {
    const config = createTestFixtures({
      resources: [
        {
          id: 'res_a1',
          type: 'assessment',
          provider: 'HackerRank',
          url: 'https://hackerrank.com/test',
          skills_taught: ['Python'],
          difficulty: 'beginner',
          format: 'interactive',
        },
      ],
    });
    const report = validateLearningGraph(config);
    expect(report.success).toBe(false);
    expect(report.missingAssessmentTitleCount).toBe(1);
  });

  it('Assessment Check 2: Assessment missing provider causes FAIL', () => {
    const config = createTestFixtures({
      resources: [
        {
          id: 'res_a1',
          title: 'Python Test',
          type: 'assessment',
          url: 'https://hackerrank.com/test',
          skills_taught: ['Python'],
          difficulty: 'beginner',
          format: 'interactive',
        },
      ],
    });
    const report = validateLearningGraph(config);
    expect(report.success).toBe(false);
    expect(report.missingAssessmentProviderCount).toBe(1);
  });

  it('Assessment Check 3: Assessment missing or placeholder URL causes FAIL', () => {
    const config = createTestFixtures({
      resources: [
        {
          id: 'res_a1',
          title: 'Python Test',
          type: 'assessment',
          provider: 'HackerRank',
          url: 'http://localhost/test',
          skills_taught: ['Python'],
          difficulty: 'beginner',
          format: 'interactive',
        },
      ],
    });
    const report = validateLearningGraph(config);
    expect(report.success).toBe(false);
    expect(report.missingAssessmentUrlCount).toBe(1);
  });

  it('Assessment Check 4: Assessment with unknown skill causes FAIL', () => {
    const config = createTestFixtures({
      resources: [
        {
          id: 'res_a1',
          title: 'Unknown Tech Assessment',
          type: 'assessment',
          provider: 'HackerRank',
          url: 'https://hackerrank.com/test',
          skills_taught: ['NonExistentSkillXYZ'],
          difficulty: 'beginner',
          format: 'interactive',
        },
      ],
    });
    const report = validateLearningGraph(config);
    expect(report.success).toBe(false);
    expect(report.unknownAssessmentSkillsCount).toBe(1);
  });

  it('Assessment Check 5: Assessment with empty skills_taught causes FAIL', () => {
    const config = createTestFixtures({
      resources: [
        {
          id: 'res_a1',
          title: 'Empty Skill Test',
          type: 'assessment',
          provider: 'HackerRank',
          url: 'https://hackerrank.com/test',
          skills_taught: [],
          difficulty: 'beginner',
          format: 'interactive',
        },
      ],
    });
    const report = validateLearningGraph(config);
    expect(report.success).toBe(false);
    expect(report.missingAssessmentSkillsCount).toBe(1);
  });

  it('Assessment Check 6: Goal skill with no assessment produces WARNING, not FAIL', () => {
    const config = createTestFixtures({
      resources: [
        {
          id: 'r1',
          title: 'Python Course',
          type: 'course',
          provider: 'Test',
          url: 'https://example.org/py',
          skills_taught: ['Python'],
        },
      ],
      goals: [
        {
          id: 'g1',
          goal_name: 'Python Goal',
          required_skills: [{ skill: 'Python' }],
        },
      ],
    });
    const report = validateLearningGraph(config);
    expect(report.success).toBe(true);
    expect(report.warnings.length).toBeGreaterThan(0);
    const item = report.skillAssessmentCoverage.find((s) => s.canonicalSkill === 'Python');
    expect(item?.status).toBe('WARNING');
  });
});
