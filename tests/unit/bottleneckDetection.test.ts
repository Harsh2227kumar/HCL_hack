import { describe, it, expect } from "vitest";
import { detectBottleneck, SkillGap, SkillDependency } from "../../src/lib/core/bottleneckDetection";

describe("detectBottleneck", () => {
  it("should return empty list when gaps are empty", () => {
    expect(detectBottleneck([], [])).toEqual([]);
  });

  it("should prioritize a skill with a small gap but high downstream blockage over a skill with a large gap but no blockage", () => {
    const gaps: SkillGap[] = [
      { skill_name: "Linear Algebra", gap: 1.0 }, // Small gap
      { skill_name: "Excel", gap: 3.0 },           // Large gap
      { skill_name: "Machine Learning", gap: 0.0 }, // No gap, just in graph
      { skill_name: "Deep Learning", gap: 0.0 },
      { skill_name: "Computer Vision", gap: 0.0 },
      { skill_name: "NLP", gap: 0.0 },
    ];

    // Dependency structure where Linear Algebra blocks 4 downstream skills:
    // ML -> Linear Algebra
    // DL -> Linear Algebra
    // CV -> ML -> Linear Algebra
    // NLP -> DL -> Linear Algebra
    const dependencies: SkillDependency[] = [
      { skill_name: "Machine Learning", depends_on_skill_name: "Linear Algebra" },
      { skill_name: "Deep Learning", depends_on_skill_name: "Linear Algebra" },
      { skill_name: "Computer Vision", depends_on_skill_name: "Machine Learning" },
      { skill_name: "NLP", depends_on_skill_name: "Deep Learning" },
    ];

    // Downstream count verification:
    // Linear Algebra blocks: Machine Learning, Deep Learning, Computer Vision, NLP (4 downstream)
    // Excel blocks: 0 downstream
    //
    // Scores:
    // Linear Algebra: gap (1.0) * count (4) = 4.0
    // Excel: gap (3.0) * count (0) = 0.0
    const result = detectBottleneck(gaps, dependencies);

    expect(result.length).toBeGreaterThan(0);
    
    // Linear Algebra should rank #1
    expect(result[0].skill_name).toBe("Linear Algebra");
    expect(result[0].bottleneck_score).toBe(4.0);
    expect(result[0].downstream_count).toBe(4);

    // Excel should rank below Linear Algebra
    const excelResult = result.find((r) => r.skill_name === "Excel")!;
    expect(excelResult.bottleneck_score).toBe(0.0);
    expect(excelResult.downstream_count).toBe(0);

    // Linear Algebra ranks above Excel even though its gap (1.0) is smaller than Excel's gap (3.0)
    const laIndex = result.findIndex((r) => r.skill_name === "Linear Algebra");
    const excelIndex = result.findIndex((r) => r.skill_name === "Excel");
    expect(laIndex).toBeLessThan(excelIndex);
  });

  it("should not cause infinite recursion/loop when cyclic dependencies are present", () => {
    const gaps: SkillGap[] = [
      { skill_name: "SkillA", gap: 2.0 },
      { skill_name: "SkillB", gap: 2.0 },
      { skill_name: "SkillC", gap: 1.0 },
    ];

    // Cycle: SkillA -> SkillB -> SkillC -> SkillA
    const dependencies: SkillDependency[] = [
      { skill_name: "SkillA", depends_on_skill_name: "SkillB" },
      { skill_name: "SkillB", depends_on_skill_name: "SkillC" },
      { skill_name: "SkillC", depends_on_skill_name: "SkillA" },
    ];

    // The execution should complete successfully without throws or hangs
    const execute = () => detectBottleneck(gaps, dependencies);
    expect(execute).not.toThrow();

    const result = execute();
    expect(result.length).toBe(3);

    // Verify all nodes are processed and have valid numbers
    for (const res of result) {
      expect(res.downstream_count).toBeLessThan(3); // should at most block the other 2 skills, not itself
      expect(res.bottleneck_score).toBeGreaterThanOrEqual(0);
    }
  });
});
