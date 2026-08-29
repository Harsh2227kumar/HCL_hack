import fs from 'fs';
import path from 'path';

export interface ValidationConfig {
  skillsPath?: string;
  goalTemplatesPath?: string;
  learningResourcesPath?: string;
  skillDependenciesPath?: string;
  silent?: boolean;
}

export interface GoalCoverageItem {
  goalId: string;
  goalName: string;
  requiredSkill: string;
  canonicalSkill: string;
  providersCount: number;
  dependentsCount: number;
  status: 'PASS' | 'FAIL';
}

export interface SkillAssessmentCoverageItem {
  canonicalSkill: string;
  goalUsageCount: number;
  learningProvidersCount: number;
  assessmentProvidersCount: number;
  status: 'PASS' | 'WARNING' | 'ERROR';
}

export interface ValidationReport {
  success: boolean;
  canonicalSkillsCount: number;
  aliasesCount: number;
  totalResourcesCount: number;
  totalAssessmentsCount: number;
  missingAssessmentTitleCount: number;
  missingAssessmentProviderCount: number;
  missingAssessmentUrlCount: number;
  missingAssessmentSkillsCount: number;
  unknownAssessmentSkillsCount: number;
  invalidAssessmentMetadataCount: number;
  invalidResourceIdsCount: number;
  unknownResourceSkillsCount: number;
  goalsCheckedCount: number;
  requiredSkillsCheckedCount: number;
  missingResourceProvidersCount: number;
  prereqSkillsMissingProvidersCount: number;
  dependenciesEdgesCount: number;
  unknownDependencySkillsCount: number;
  selfDependenciesCount: number;
  cyclesCount: number;
  duplicateCanonicalCount: number;
  aliasCollisionCount: number;
  errors: string[];
  warnings: string[];
  goalCoverage: GoalCoverageItem[];
  skillAssessmentCoverage: SkillAssessmentCoverageItem[];
}

interface SkillVocabEntry {
  canonical: string;
  aliases?: string[];
}

interface GoalRequiredSkill {
  skill: string;
  min_level?: number;
}

interface GoalTemplate {
  id: string;
  goal_name: string;
  required_skills?: GoalRequiredSkill[];
}

interface LearningResource {
  id: string;
  title?: string;
  type?: string;
  provider?: string;
  url?: string;
  difficulty?: string;
  format?: string;
  skills_taught?: string[];
  prerequisite_skills?: string[];
}

interface SkillDependency {
  id?: string;
  skill_name: string;
  depends_on_skill_name: string;
}

export function validateLearningGraph(config: ValidationConfig = {}): ValidationReport {
  const rootDir = process.cwd();
  const skillsPath = config.skillsPath || path.join(rootDir, 'data', 'skills.json');
  const goalTemplatesPath = config.goalTemplatesPath || path.join(rootDir, 'data', 'goal_templates.json');
  const learningResourcesPath = config.learningResourcesPath || path.join(rootDir, 'data', 'learning_resources.json');
  const skillDependenciesPath = config.skillDependenciesPath || path.join(rootDir, 'data', 'skill_dependencies.json');
  const silent = config.silent || false;

  const errors: string[] = [];
  const warnings: string[] = [];

  // 1. Read JSON Data Files
  const skillsVocab: SkillVocabEntry[] = JSON.parse(fs.readFileSync(skillsPath, 'utf8'));
  const goalTemplates: GoalTemplate[] = JSON.parse(fs.readFileSync(goalTemplatesPath, 'utf8'));
  const learningResources: LearningResource[] = JSON.parse(fs.readFileSync(learningResourcesPath, 'utf8'));
  const skillDependencies: SkillDependency[] = JSON.parse(fs.readFileSync(skillDependenciesPath, 'utf8'));

  // 2. Validate Vocabulary & Detect Duplicate Canonicals & Alias Collisions
  const canonicalSet = new Set<string>();
  const aliasToCanonicalMap = new Map<string, string>();
  let duplicateCanonicalCount = 0;
  let aliasCollisionCount = 0;
  let totalAliases = 0;

  for (const entry of skillsVocab) {
    const canonical = entry.canonical?.trim();
    if (!canonical) {
      errors.push('Vocabulary entry has missing or empty canonical skill name.');
      continue;
    }

    if (canonicalSet.has(canonical)) {
      duplicateCanonicalCount++;
      errors.push(`Duplicate canonical skill name detected in skills.json: "${canonical}"`);
    } else {
      canonicalSet.add(canonical);
    }

    const aliases = entry.aliases || [];
    for (const alias of aliases) {
      totalAliases++;
      const trimmedAlias = alias.trim();
      if (aliasToCanonicalMap.has(trimmedAlias)) {
        const existingCanonical = aliasToCanonicalMap.get(trimmedAlias)!;
        if (existingCanonical !== canonical) {
          aliasCollisionCount++;
          errors.push(
            `Alias collision detected: "${trimmedAlias}" maps to both "${existingCanonical}" and "${canonical}".`
          );
        }
      } else {
        aliasToCanonicalMap.set(trimmedAlias, canonical);
      }
    }
  }

  function resolveSkill(rawSkillName: string | undefined | null): string | null {
    if (!rawSkillName) return null;
    const trimmed = rawSkillName.trim();
    if (canonicalSet.has(trimmed)) return trimmed;
    const mapped = aliasToCanonicalMap.get(trimmed);
    if (mapped && canonicalSet.has(mapped)) return mapped;

    // Case-insensitive fallback lookup
    const lower = trimmed.toLowerCase();
    for (const c of canonicalSet) {
      if (c.toLowerCase() === lower) return c;
    }
    for (const [a, c] of aliasToCanonicalMap.entries()) {
      if (a.toLowerCase() === lower) return c;
    }
    return null;
  }

  // 3. Validate Resource IDs & Skill References in Resources
  const resourceIdSet = new Set<string>();
  let invalidResourceIdsCount = 0;
  let unknownResourceSkillsCount = 0;
  let totalAssessmentsCount = 0;

  // Assessment granular counters
  let missingAssessmentTitleCount = 0;
  let missingAssessmentProviderCount = 0;
  let missingAssessmentUrlCount = 0;
  let missingAssessmentSkillsCount = 0;
  let unknownAssessmentSkillsCount = 0;
  let invalidAssessmentMetadataCount = 0;

  // Map canonical skill -> count of non-assessment resources & assessment resources & required count
  const nonAssessmentTaughtCount = new Map<string, number>();
  const assessmentTaughtCount = new Map<string, number>();
  const requiredByResourceCount = new Map<string, number>();

  for (const resource of learningResources) {
    const isAssessment = resource.type === 'assessment';
    if (isAssessment) {
      totalAssessmentsCount++;

      if (!resource.title || typeof resource.title !== 'string' || resource.title.trim() === '') {
        missingAssessmentTitleCount++;
        errors.push(`Assessment resource "${resource.id || 'unknown'}" is missing title.`);
      }

      if (!resource.provider || typeof resource.provider !== 'string' || resource.provider.trim() === '') {
        missingAssessmentProviderCount++;
        errors.push(`Assessment resource "${resource.id || 'unknown'}" is missing provider.`);
      }

      const url = resource.url?.trim() || '';
      if (!url || url.includes('localhost') || url.includes('example.com') || url.includes('placeholder')) {
        missingAssessmentUrlCount++;
        errors.push(`Assessment resource "${resource.id || 'unknown'}" has missing or placeholder URL: "${resource.url}"`);
      }

      const skillsTaught = resource.skills_taught || [];
      if (!Array.isArray(skillsTaught) || skillsTaught.length === 0) {
        missingAssessmentSkillsCount++;
        errors.push(`Assessment resource "${resource.id || 'unknown'}" has empty or missing skills_taught.`);
      }

      if (!resource.difficulty || typeof resource.difficulty !== 'string' || resource.difficulty.trim() === '') {
        invalidAssessmentMetadataCount++;
        errors.push(`Assessment resource "${resource.id || 'unknown'}" is missing difficulty metadata.`);
      }

      if (!resource.format || typeof resource.format !== 'string' || resource.format.trim() === '') {
        invalidAssessmentMetadataCount++;
        errors.push(`Assessment resource "${resource.id || 'unknown'}" is missing format metadata.`);
      }
    }

    if (!resource.id || typeof resource.id !== 'string' || resource.id.trim() === '') {
      invalidResourceIdsCount++;
      errors.push(`Resource has missing, invalid, or non-string ID: ${JSON.stringify(resource)}`);
    } else if (resourceIdSet.has(resource.id.trim())) {
      invalidResourceIdsCount++;
      errors.push(`Duplicate resource ID detected: "${resource.id}"`);
    } else {
      resourceIdSet.add(resource.id.trim());
    }

    const skillsTaught = resource.skills_taught || [];
    let validTeachesCount = 0;

    for (const st of skillsTaught) {
      const canonical = resolveSkill(st);
      if (!canonical) {
        unknownResourceSkillsCount++;
        if (isAssessment) unknownAssessmentSkillsCount++;
        errors.push(`Resource "${resource.id}" references unknown skill in skills_taught: "${st}"`);
      } else {
        validTeachesCount++;
        if (isAssessment) {
          assessmentTaughtCount.set(canonical, (assessmentTaughtCount.get(canonical) || 0) + 1);
        } else {
          nonAssessmentTaughtCount.set(canonical, (nonAssessmentTaughtCount.get(canonical) || 0) + 1);
        }
      }
    }

    if (isAssessment && validTeachesCount === 0 && skillsTaught.length > 0) {
      errors.push(`Assessment resource "${resource.id}" teaches 0 valid canonical skills.`);
    }

    const prereqSkills = resource.prerequisite_skills || [];
    for (const ps of prereqSkills) {
      const canonical = resolveSkill(ps);
      if (!canonical) {
        unknownResourceSkillsCount++;
        if (isAssessment) unknownAssessmentSkillsCount++;
        errors.push(`Resource "${resource.id}" references unknown skill in prerequisite_skills: "${ps}"`);
      } else {
        requiredByResourceCount.set(canonical, (requiredByResourceCount.get(canonical) || 0) + 1);
      }
    }
  }

  // 4. Validate Dependencies (Unknown Skills, Self-Dependencies, Cycles)
  let unknownDependencySkillsCount = 0;
  let selfDependenciesCount = 0;
  let cyclesCount = 0;

  const adjList = new Map<string, Set<string>>();

  for (const dep of skillDependencies) {
    const fromCanonical = resolveSkill(dep.skill_name);
    const toCanonical = resolveSkill(dep.depends_on_skill_name);

    if (!fromCanonical) {
      unknownDependencySkillsCount++;
      errors.push(`Dependency record references unknown skill_name: "${dep.skill_name}"`);
    }
    if (!toCanonical) {
      unknownDependencySkillsCount++;
      errors.push(`Dependency record references unknown depends_on_skill_name: "${dep.depends_on_skill_name}"`);
    }

    if (fromCanonical && toCanonical) {
      if (fromCanonical === toCanonical) {
        selfDependenciesCount++;
        errors.push(`Self-dependency detected: "${fromCanonical}" -> "${toCanonical}".`);
      }

      if (!adjList.has(fromCanonical)) {
        adjList.set(fromCanonical, new Set());
      }
      adjList.get(fromCanonical)!.add(toCanonical);
    }
  }

  // Detect dependency cycles via DFS
  const visited = new Map<string, number>(); // 0: unvisited, 1: visiting, 2: visited
  const cyclePaths: string[] = [];

  function detectCycleDFS(node: string, currentPath: string[]) {
    visited.set(node, 1);
    currentPath.push(node);

    const neighbors = adjList.get(node) || new Set();
    for (const neighbor of neighbors) {
      if (visited.get(neighbor) === 1) {
        const cycleStartIndex = currentPath.indexOf(neighbor);
        const cycleSegment = currentPath.slice(cycleStartIndex);
        cycleSegment.push(neighbor);
        const cycleStr = cycleSegment.join(' -> ');
        cyclePaths.push(cycleStr);
        cyclesCount++;
        errors.push(`Dependency cycle detected: ${cycleStr}`);
      } else if (!visited.get(neighbor)) {
        detectCycleDFS(neighbor, currentPath);
      }
    }

    currentPath.pop();
    visited.set(node, 2);
  }

  for (const node of canonicalSet) {
    if (!visited.get(node)) {
      detectCycleDFS(node, []);
    }
  }

  // 5. Validate Goal Skill Coverage & Prerequisite Providers
  let requiredSkillsCheckedCount = 0;
  let missingResourceProvidersCount = 0;
  let prereqSkillsMissingProvidersCount = 0;
  const goalCoverage: GoalCoverageItem[] = [];
  const goalUsageMap = new Map<string, number>(); // canonical -> count of goals requiring it

  for (const goal of goalTemplates) {
    const requiredSkills = goal.required_skills || [];
    for (const rs of requiredSkills) {
      requiredSkillsCheckedCount++;
      const canonical = resolveSkill(rs.skill);
      if (!canonical) {
        missingResourceProvidersCount++;
        errors.push(`Goal "${goal.goal_name}" required skill "${rs.skill}" cannot be resolved in skills.json.`);
        goalCoverage.push({
          goalId: goal.id,
          goalName: goal.goal_name,
          requiredSkill: rs.skill,
          canonicalSkill: 'UNKNOWN',
          providersCount: 0,
          dependentsCount: 0,
          status: 'FAIL',
        });
      } else {
        goalUsageMap.set(canonical, (goalUsageMap.get(canonical) || 0) + 1);

        const learningProviders = (nonAssessmentTaughtCount.get(canonical) || 0) + (assessmentTaughtCount.get(canonical) || 0);
        const dependents = requiredByResourceCount.get(canonical) || 0;
        const isPass = learningProviders > 0;
        if (!isPass) {
          missingResourceProvidersCount++;
          errors.push(
            `Goal "${goal.goal_name}" skill "${rs.skill}" (Canonical: "${canonical}") has 0 learning resource providers.`
          );
        }
        goalCoverage.push({
          goalId: goal.id,
          goalName: goal.goal_name,
          requiredSkill: rs.skill,
          canonicalSkill: canonical,
          providersCount: learningProviders,
          dependentsCount: dependents,
          status: isPass ? 'PASS' : 'FAIL',
        });
      }
    }
  }

  // Check prerequisite skills in skill_dependencies.json for 0 providers
  for (const dep of skillDependencies) {
    const prereqCanonical = resolveSkill(dep.depends_on_skill_name);
    if (prereqCanonical) {
      const providers = (nonAssessmentTaughtCount.get(prereqCanonical) || 0) + (assessmentTaughtCount.get(prereqCanonical) || 0);
      if (providers === 0) {
        prereqSkillsMissingProvidersCount++;
        errors.push(
          `Prerequisite skill "${dep.depends_on_skill_name}" (Canonical: "${prereqCanonical}") has 0 resource providers.`
        );
      }
    }
  }

  // 6. Skill Assessment Coverage Breakdown
  const skillAssessmentCoverage: SkillAssessmentCoverageItem[] = [];
  for (const [canonical, goalUsageCount] of goalUsageMap.entries()) {
    const courseProviders = nonAssessmentTaughtCount.get(canonical) || 0;
    const assessmentProviders = assessmentTaughtCount.get(canonical) || 0;
    const totalProviders = courseProviders + assessmentProviders;

    let status: 'PASS' | 'WARNING' | 'ERROR' = 'PASS';
    if (totalProviders === 0) {
      status = 'ERROR';
    } else if (assessmentProviders === 0) {
      status = 'WARNING';
      warnings.push(`Goal skill "${canonical}" has 0 assessment providers.`);
    }

    skillAssessmentCoverage.push({
      canonicalSkill: canonical,
      goalUsageCount,
      learningProvidersCount: courseProviders,
      assessmentProvidersCount: assessmentProviders,
      status,
    });
  }

  const success = errors.length === 0;

  const report: ValidationReport = {
    success,
    canonicalSkillsCount: canonicalSet.size,
    aliasesCount: totalAliases,
    totalResourcesCount: learningResources.length,
    totalAssessmentsCount,
    missingAssessmentTitleCount,
    missingAssessmentProviderCount,
    missingAssessmentUrlCount,
    missingAssessmentSkillsCount,
    unknownAssessmentSkillsCount,
    invalidAssessmentMetadataCount,
    invalidResourceIdsCount,
    unknownResourceSkillsCount,
    goalsCheckedCount: goalTemplates.length,
    requiredSkillsCheckedCount,
    missingResourceProvidersCount,
    prereqSkillsMissingProvidersCount,
    dependenciesEdgesCount: skillDependencies.length,
    unknownDependencySkillsCount,
    selfDependenciesCount,
    cyclesCount,
    duplicateCanonicalCount,
    aliasCollisionCount,
    errors,
    warnings,
    goalCoverage,
    skillAssessmentCoverage,
  };

  if (!silent) {
    printReport(report);
  }

  return report;
}

function printReport(report: ValidationReport) {
  console.log('========================================');
  console.log('LEARNING GRAPH VALIDATION');
  console.log('=========================');
  console.log('');
  console.log('Skills:');
  console.log(`Canonical skills: ${report.canonicalSkillsCount}`);
  console.log(`Aliases: ${report.aliasesCount}`);
  console.log('');
  console.log('Resources:');
  console.log(`Total resources: ${report.totalResourcesCount}`);
  console.log(`Assessment resources: ${report.totalAssessmentsCount}`);
  console.log(`Invalid IDs: ${report.invalidResourceIdsCount}`);
  console.log(`Unknown skills: ${report.unknownResourceSkillsCount}`);
  console.log('');
  console.log('Assessment Validation:');
  console.log(`Total assessments: ${report.totalAssessmentsCount}`);
  console.log(`Missing title: ${report.missingAssessmentTitleCount}`);
  console.log(`Missing provider: ${report.missingAssessmentProviderCount}`);
  console.log(`Missing URL: ${report.missingAssessmentUrlCount}`);
  console.log(`Missing skills: ${report.missingAssessmentSkillsCount}`);
  console.log(`Unknown skills: ${report.unknownAssessmentSkillsCount}`);
  console.log(`Invalid metadata: ${report.invalidAssessmentMetadataCount}`);
  console.log('');
  console.log('Goals:');
  console.log(`Goals checked: ${report.goalsCheckedCount}`);
  console.log(`Skills checked: ${report.requiredSkillsCheckedCount}`);
  console.log(`Missing resource providers: ${report.missingResourceProvidersCount}`);
  console.log('');
  console.log('Skill Assessment Coverage:');
  report.skillAssessmentCoverage.forEach((item) => {
    console.log(
      ` ${item.canonicalSkill} | ${item.goalUsageCount} goals | Course/Project: ${item.learningProvidersCount} | Assessment: ${item.assessmentProvidersCount} | ${item.status}`
    );
  });
  console.log('');
  console.log('Dependencies:');
  console.log(`Edges: ${report.dependenciesEdgesCount}`);
  console.log(`Unknown skills: ${report.unknownDependencySkillsCount}`);
  console.log(`Self dependencies: ${report.selfDependenciesCount}`);
  console.log(`Cycles: ${report.cyclesCount}`);
  console.log('');
  console.log('========================================');
  if (report.errors.length > 0) {
    console.log('DETAILED ERRORS:');
    report.errors.forEach((err, idx) => console.log(` [Error ${idx + 1}] ${err}`));
    console.log('');
  }
  if (report.warnings.length > 0) {
    console.log('WARNINGS:');
    report.warnings.forEach((warn, idx) => console.log(` [Warning ${idx + 1}] ${warn}`));
    console.log('');
  }
  if (report.success) {
    console.log('RESULT: PASS');
    console.log('============');
  } else {
    console.log('RESULT: FAIL');
    console.log('============');
  }
}

if (require.main === module) {
  const report = validateLearningGraph();
  if (!report.success) {
    process.exit(1);
  }
}
