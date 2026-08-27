import { describe, it, expect } from "vitest";
import { selectSkillsForDiagnostic, ClaimedSkill, SkillDependency } from "../../src/lib/core/diagnosticSelection";

describe("selectSkillsForDiagnostic", () => {
  it("should handle empty claimed skills and negative topN", () => {
    expect(selectSkillsForDiagnostic([], [], 5)).toEqual([]);
    expect(selectSkillsForDiagnostic([{ skill_name: "Python", self_rated_level: 1, target_level: 3 }], [], -1)).toEqual([]);
  });

  it("should rank a lower-target skill with zero confidence above a high-target but confirmed (low uncertainty) skill", () => {
    const claimedSkills: ClaimedSkill[] = [
      {
        skill_name: "ConfirmedAdvancedSkill",
        self_rated_level: 4,
        target_level: 5, // target_importance = 5 / 5 = 1.0
        confidence_score: 0.9, // current_uncertainty = 1 - 0.9 = 0.1
      },
      {
        skill_name: "UnconfirmedBasicSkill",
        self_rated_level: 1,
        target_level: 3, // target_importance = 3 / 5 = 0.6
        confidence_score: 0.0, // current_uncertainty = 1 - 0.0 = 1.0
      },
    ];

    const dependencies: SkillDependency[] = [];

    // Since there are no dependencies, both raw criticalities are 0, normalized = 0.
    // Criticality falls back to the baseline of 0.1.
    // ConfirmedAdvancedSkill priority = 1.0 * 0.1 * 0.1 = 0.01
    // UnconfirmedBasicSkill priority = 0.6 * 1.0 * 0.1 = 0.06
    // Since 0.06 > 0.01, UnconfirmedBasicSkill should be ranked first.
    const result = selectSkillsForDiagnostic(claimedSkills, dependencies, 2);

    expect(result).toEqual(["UnconfirmedBasicSkill", "ConfirmedAdvancedSkill"]);
  });

  it("should calculate criticality correctly based on transitive dependencies and select critical prerequisites", () => {
    const claimedSkills: ClaimedSkill[] = [
      { skill_name: "Deep Learning", self_rated_level: 1, target_level: 4 }, // target_importance = 0.8, uncertainty = 1.0
      { skill_name: "Machine Learning", self_rated_level: 1, target_level: 4 }, // target_importance = 0.8, uncertainty = 1.0
      { skill_name: "Linear Algebra", self_rated_level: 1, target_level: 4 }, // target_importance = 0.8, uncertainty = 1.0
    ];

    // Deep Learning depends on Machine Learning, Machine Learning depends on Linear Algebra
    const dependencies: SkillDependency[] = [
      { skill_name: "Deep Learning", depends_on_skill_name: "Machine Learning" },
      { skill_name: "Machine Learning", depends_on_skill_name: "Linear Algebra" },
    ];

    // Transitive downstream counts:
    // Linear Algebra: ML and DL depend on it => count = 2
    // Machine Learning: DL depends on it => count = 1
    // Deep Learning: no downstream dependents => count = 0
    // Max raw count = 2
    //
    // Normalized criticalities:
    // Linear Algebra = 2/2 = 1.0
    // Machine Learning = 1/2 = 0.5
    // Deep Learning = 0 => baseline = 0.1
    //
    // Priorities:
    // Linear Algebra: 0.8 * 1.0 * 1.0 = 0.8
    // Machine Learning: 0.8 * 1.0 * 0.5 = 0.4
    // Deep Learning: 0.8 * 1.0 * 0.1 = 0.08
    //
    // Expected ranking: Linear Algebra, Machine Learning, Deep Learning
    const result = selectSkillsForDiagnostic(claimedSkills, dependencies, 3);
    expect(result).toEqual(["Linear Algebra", "Machine Learning", "Deep Learning"]);
  });

  it("should handle duplicate claimed skills by prioritizing the version with higher diagnostic priority", () => {
    const claimedSkills: ClaimedSkill[] = [
      { skill_name: "Python", self_rated_level: 1, target_level: 3, confidence_score: 0.8 },
      { skill_name: "Python", self_rated_level: 1, target_level: 5, confidence_score: 0.2 }, // Higher target, higher uncertainty
      { skill_name: "SQL", self_rated_level: 1, target_level: 4, confidence_score: 0.5 },
    ];

    const dependencies: SkillDependency[] = [];

    // Deduplication keeps Python with target 5 and confidence 0.2
    // Python priority: (5/5) * 0.8 * 0.1 = 0.08
    // SQL priority: (4/5) * 0.5 * 0.1 = 0.04
    // Expected order: Python, SQL
    const result = selectSkillsForDiagnostic(claimedSkills, dependencies, 2);
    expect(result).toEqual(["Python", "SQL"]);
  });

  it("should select a skill with no downstream dependents if target importance and uncertainty are high", () => {
    const claimedSkills: ClaimedSkill[] = [
      { skill_name: "IndependentSkill", self_rated_level: 1, target_level: 5, confidence_score: 0 }, // target = 1.0, uncertainty = 1.0, crit = 0.1 => priority = 0.1
      { skill_name: "DependencySkill", self_rated_level: 1, target_level: 2, confidence_score: 0.8 }, // target = 0.4, uncertainty = 0.2, crit = 1.0 => priority = 0.08
    ];

    const dependencies: SkillDependency[] = [
      { skill_name: "SomeOtherSkill", depends_on_skill_name: "DependencySkill" },
    ];

    // DependencySkill raw criticality = 1 (max = 1) => normalized = 1.0
    // IndependentSkill raw criticality = 0 => normalized = 0 => baseline = 0.1
    // IndependentSkill should rank first despite no dependents because of its high target and zero confidence
    const result = selectSkillsForDiagnostic(claimedSkills, dependencies, 2);
    expect(result).toEqual(["IndependentSkill", "DependencySkill"]);
  });
});
