import { describe, it, expect } from "vitest";
import { reconcileSkillEstimate, SkillEvidence } from "../../src/lib/core/reconciliation";

describe("reconcileSkillEstimate", () => {
  const now = new Date("2026-08-28T00:00:00Z");

  it("should handle zero evidence records", () => {
    const result = reconcileSkillEstimate([]);
    expect(result).toEqual({ final_estimate: null, confidence_score: 0 });
  });

  it("should calculate correct estimate and confidence for normal case with 3 mixed-source evidence records", () => {
    const evidence: SkillEvidence[] = [
      {
        score: 4,
        source: "self_report", // reliability default = 0.3
        timestamp: new Date("2026-08-28T00:00:00Z"), // age = 0 days, recency_weight = 1
      },
      {
        score: 3,
        source: "diagnostic", // reliability default = 0.7
        timestamp: new Date("2026-08-13T00:00:00Z"), // age = 15 days, recency_weight = 0.7071
      },
      {
        score: 5,
        source: "project_completion", // reliability default = 0.6
        timestamp: new Date("2026-07-29T00:00:00Z"), // age = 30 days, recency_weight = 0.5
      },
    ];

    const result = reconcileSkillEstimate(evidence, now);

    // Manual Calculation Verification:
    // W1 = 0.3 * 1.0 = 0.3
    // W2 = 0.7 * Math.exp(-Math.LN2 * 15 / 30) = 0.7 * 0.70710678 = 0.49497474
    // W3 = 0.6 * Math.exp(-Math.LN2 * 30 / 30) = 0.6 * 0.5 = 0.3
    // Total Weight = 0.3 + 0.49497474 + 0.3 = 1.09497474
    // Weighted Score Sum = 4 * 0.3 + 3 * 0.49497474 + 5 * 0.3 = 1.2 + 1.48492422 + 1.5 = 4.18492422
    // Expected Estimate = 4.18492422 / 1.09497474 = 3.8219368
    expect(result.final_estimate).toBeCloseTo(3.8219, 4);

    // Confidence Verification:
    // S = 1.09497474
    // confidence_score = 1 - Math.exp(-0.75 * 1.09497474) = 1 - Math.exp(-0.821231) = 1 - 0.4398897 = 0.56011
    // Rounded to 4 decimal places: 0.5601
    expect(result.confidence_score).toBe(0.5601);
  });

  it("should return low confidence for a single self-report record", () => {
    const evidence: SkillEvidence[] = [
      {
        score: 4,
        source: "self_report",
        timestamp: now,
      },
    ];

    const result = reconcileSkillEstimate(evidence, now);

    // Final estimate is exactly the single score when only one source exists
    expect(result.final_estimate).toBe(4);

    // Confidence Verification:
    // S = 0.3 * 1.0 = 0.3
    // confidence_score = 1 - exp(-0.75 * 0.3) = 1 - exp(-0.225) = 1 - 0.798516 = 0.20148 => 0.2015
    expect(result.confidence_score).toBe(0.2015);
  });

  it("should have different confidence between fresh evidence and heavily decayed old evidence of the same score", () => {
    const freshEvidence: SkillEvidence[] = [
      {
        score: 4,
        source: "diagnostic",
        timestamp: now, // age = 0 days, recency_weight = 1
      },
    ];

    const oldEvidence: SkillEvidence[] = [
      {
        score: 4,
        source: "diagnostic",
        timestamp: new Date("2026-05-30T00:00:00Z"), // age = 90 days (3 half-lives), recency_weight = 0.125
      },
    ];

    const freshResult = reconcileSkillEstimate(freshEvidence, now);
    const oldResult = reconcileSkillEstimate(oldEvidence, now);

    expect(freshResult.final_estimate).toBe(4);
    expect(oldResult.final_estimate).toBe(4);

    // Fresh confidence: S = 0.7 => 1 - exp(-0.525) = 0.4084
    expect(freshResult.confidence_score).toBe(0.4084);

    // Old confidence: S = 0.7 * 0.125 = 0.0875 => 1 - exp(-0.065625) = 0.0635
    expect(oldResult.confidence_score).toBe(0.0635);

    expect(freshResult.confidence_score).toBeGreaterThan(oldResult.confidence_score);
  });
});
