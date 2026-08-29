import { describe, it, expect } from "vitest";
import { scoreResource, LearningResource, LearnerContext } from "../../src/lib/core/hybridScoring";

describe("scoreResource", () => {
  it("should return recommendation_status 'not_recommended_yet' and cap the score at 0.2 if prerequisites are unmet", () => {
    const resource: LearningResource = {
      id: "res_ml_01",
      skills_taught: ["Machine Learning"],
      prerequisite_skills: ["Linear Algebra", "Calculus"],
      difficulty: "intermediate",
      duration_hours: 10,
      format: "video",
    };

    const learner: LearnerContext = {
      skillEstimates: [
        { skill_name: "Linear Algebra", final_estimate: 3.0 }, // Met (>= 2.0)
        { skill_name: "Calculus", final_estimate: 1.0 },       // Unmet (< 2.0)
      ],
      weeklyHours: 15,
      learningStyle: "visual",
      pastFeedback: [],
    };

    const result = scoreResource(resource, learner, 0.8);

    expect(result.recommendation_status).toBe("not_recommended_yet");
    expect(result.score).toBeLessThanOrEqual(0.2);
    // Prerequisite fit should reflect partial completion: (1.0 + (1.0/2.0)) / 2 = 0.75
    expect(result.score_breakdown.prerequisite_fit).toBe(0.75);
  });

  it("should score lower on time_fit when a resource's duration exceeds the learner's weeklyHours budget", () => {
    const resourceShort: LearningResource = {
      id: "res_py_01",
      skills_taught: ["Python"],
      prerequisite_skills: [],
      difficulty: "beginner",
      duration_hours: 5, // Fits in 10hr budget
      format: "text",
    };

    const resourceLong: LearningResource = {
      id: "res_py_02",
      skills_taught: ["Python"],
      prerequisite_skills: [],
      difficulty: "beginner",
      duration_hours: 40, // Exceeds 10hr budget (ratio 10/40 = 0.25)
      format: "text",
    };

    const learner: LearnerContext = {
      skillEstimates: [{ skill_name: "Python", final_estimate: 1.0 }],
      weeklyHours: 10,
      learningStyle: "reading",
      pastFeedback: [],
    };

    const resultShort = scoreResource(resourceShort, learner, 0.9);
    const resultLong = scoreResource(resourceLong, learner, 0.9);

    // Verify time_fit is 1.0 for short resource
    expect(resultShort.score_breakdown.time_fit).toBe(1.0);
    // Verify time_fit is 0.25 for long resource
    expect(resultLong.score_breakdown.time_fit).toBe(0.25);
    // Short resource should have a higher final score due to better time fit
    expect(resultShort.score).toBeGreaterThan(resultLong.score);
  });

  it("should make all score_breakdown factors individually inspectable for decision tracing", () => {
    const resource: LearningResource = {
      id: "res_pandas_01",
      skills_taught: ["Pandas"],
      prerequisite_skills: ["Python"],
      difficulty: "intermediate",
      duration_hours: 8,
      format: "interactive",
    };

    const learner: LearnerContext = {
      skillEstimates: [
        { skill_name: "Python", final_estimate: 3.5 },
        { skill_name: "Pandas", final_estimate: 1.5 },
      ],
      weeklyHours: 10,
      learningStyle: "kinesthetic",
      pastFeedback: [{ resource_id: "res_pandas_01", event_type: "skipped" }], // -0.3 feedback penalty
    };

    const result = scoreResource(resource, learner, 0.7);

    // Check availability and types of all breakdown fields
    const breakdown = result.score_breakdown;
    expect(breakdown).toHaveProperty("skill_gap_match");
    expect(breakdown).toHaveProperty("prerequisite_fit");
    expect(breakdown).toHaveProperty("retrievalSimilarity");
    expect(breakdown).toHaveProperty("difficulty_fit");
    expect(breakdown).toHaveProperty("time_fit");
    expect(breakdown).toHaveProperty("learning_style_fit");

    // All should be numeric values
    expect(typeof breakdown.skill_gap_match).toBe("number");
    expect(typeof breakdown.prerequisite_fit).toBe("number");
    expect(typeof breakdown.retrievalSimilarity).toBe("number");
    expect(typeof breakdown.difficulty_fit).toBe("number");
    expect(typeof breakdown.time_fit).toBe("number");
    expect(typeof breakdown.learning_style_fit).toBe("number");

    // Check specific values
    // prerequisite_fit should be 1.0 since Python (3.5) >= 2.0
    expect(breakdown.prerequisite_fit).toBe(1.0);
    
    // learning_style_fit should be match (1.0) - penalty (0.3) = 0.7
    expect(breakdown.learning_style_fit).toBe(0.7);

    // recommendation_status should be recommended
    expect(result.recommendation_status).toBe("recommended");
  });

  it("should calculate different skill_gap_match scores for skills with same final_estimate but different target_level", () => {
    const resourceTarget3: LearningResource = {
      id: "res_sql_01",
      skills_taught: ["PostgreSQL"],
      prerequisite_skills: [],
      difficulty: "intermediate",
      duration_hours: 5,
    };

    const resourceTarget5: LearningResource = {
      id: "res_py_01",
      skills_taught: ["Python"],
      prerequisite_skills: [],
      difficulty: "intermediate",
      duration_hours: 5,
    };

    const learner: LearnerContext = {
      skillEstimates: [
        { skill_name: "PostgreSQL", final_estimate: 2.8, target_level: 3.0 },
        { skill_name: "Python", final_estimate: 2.8, target_level: 5.0 },
      ],
      weeklyHours: 10,
      learningStyle: "visual",
      pastFeedback: [],
    };

    const resultTarget3 = scoreResource(resourceTarget3, learner, 0.8);
    const resultTarget5 = scoreResource(resourceTarget5, learner, 0.8);

    // Skill gap for PostgreSQL (2.8/3.0) should be (3 - 2.8)/3 = 0.0667
    // Skill gap for Python (2.8/5.0) should be (5 - 2.8)/5 = 0.44
    expect(resultTarget3.score_breakdown.skill_gap_match).toBeLessThan(
      resultTarget5.score_breakdown.skill_gap_match
    );
    expect(resultTarget3.score_breakdown.skill_gap_match).toBeCloseTo(0.0667, 3);
    expect(resultTarget5.score_breakdown.skill_gap_match).toBeCloseTo(0.44, 2);
  });
});
