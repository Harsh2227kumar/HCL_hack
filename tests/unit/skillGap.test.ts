import { describe, it, expect } from "vitest";
import { computeSkillGaps, LearnerSkill } from "../../src/lib/core/skillGap";

describe("computeSkillGaps", () => {
  it("should handle empty claimed skills list", () => {
    expect(computeSkillGaps([])).toEqual([]);
  });

  it("should calculate target_level - final_estimate and clamp negative values to 0", () => {
    const learnerSkills: LearnerSkill[] = [
      { skill_name: "Python", final_estimate: 2.5, target_level: 4 }, // gap = 1.5
      { skill_name: "SQL", final_estimate: 4.5, target_level: 4 },    // gap = 0 (estimate exceeds target)
      { skill_name: "Excel", final_estimate: 3.0, target_level: 3 },  // gap = 0 (estimate equals target)
    ];

    const result = computeSkillGaps(learnerSkills);

    expect(result).toEqual([
      { skill_name: "Python", gap: 1.5 },
      { skill_name: "SQL", gap: 0 },
      { skill_name: "Excel", gap: 0 },
    ]);
  });
});
