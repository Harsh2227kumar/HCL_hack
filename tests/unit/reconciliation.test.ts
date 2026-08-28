import { describe, it, expect } from 'vitest';
import {
  bktUpdate,
  reconcileSkillFromEvidence,
  reconcileSkillEstimate,
  BKT_PARAMS,
  SkillEvidence,
  SkillEvidenceEvent,
} from '../../src/lib/core/reconciliation';

describe('bktUpdate — single-step BKT update', () => {
  it('should increase P(known) after a correct observation', () => {
    const prior = BKT_PARAMS.P_L0; // 0.3
    const posterior = bktUpdate(prior, true);
    expect(posterior).toBeGreaterThan(prior);
  });

  it('should produce a higher P(known) after correct than after incorrect from the same prior', () => {
    const prior = BKT_PARAMS.P_L0; // 0.3
    const afterCorrect = bktUpdate(prior, true);
    const afterIncorrect = bktUpdate(prior, false);

    // Correct observation should always produce a higher posterior than incorrect
    expect(afterCorrect).toBeGreaterThan(afterIncorrect);

    // Correct should increase from prior
    expect(afterCorrect).toBeGreaterThan(prior);

    // Incorrect may decrease from prior (Bayesian posterior drops),
    // but P_T softens the drop compared to pure Bayes without learning transition
    const { P_slip, P_guess } = BKT_PARAMS;
    const pIncorrect = P_slip * prior + (1 - P_guess) * (1 - prior);
    const pureBayesPosterior = (P_slip * prior) / pIncorrect;
    // With P_T applied, the result is higher than pure Bayes posterior
    expect(afterIncorrect).toBeGreaterThan(pureBayesPosterior);
  });

  it('should approach but not meaningfully exceed 1.0 — P(known) saturates near 1', () => {
    let pKnown: number = BKT_PARAMS.P_L0;
    // Run 20 consecutive correct observations (enough to saturate)
    for (let i = 0; i < 20; i++) {
      pKnown = bktUpdate(pKnown, true);
    }
    // Should be very high
    expect(pKnown).toBeGreaterThan(0.99);
    // The value is <= 1.0 (may hit 1.0 exactly due to IEEE 754 rounding)
    expect(pKnown).toBeLessThanOrEqual(1.0);
  });

  it('should never reach exactly 0.0 — P(known) approaches but never equals 0', () => {
    let pKnown: number = BKT_PARAMS.P_L0;
    // Run 100 consecutive incorrect observations
    for (let i = 0; i < 100; i++) {
      pKnown = bktUpdate(pKnown, false);
    }
    expect(pKnown).toBeGreaterThan(0.0);
    // Even after many wrongs, P_T ensures it doesn't collapse to 0
    expect(pKnown).toBeGreaterThan(0.15);
  });

  it('should handle the slip boundary: high P(known) + incorrect = modest decrease', () => {
    // If learner is very likely to know (0.95), a single wrong answer
    // should not obliterate their mastery — slips happen
    const highPrior = 0.95;
    const afterWrong = bktUpdate(highPrior, false);

    // Should drop but not catastrophically (slip protection)
    expect(afterWrong).toBeLessThan(highPrior);
    expect(afterWrong).toBeGreaterThan(0.5);
  });

  it('should handle the guess boundary: low P(known) + correct = moderate increase', () => {
    // If learner probably doesn't know (0.1), a single correct answer
    // should help but not vault them to mastery — could be guessing
    const lowPrior = 0.1;
    const afterCorrect = bktUpdate(lowPrior, true);

    expect(afterCorrect).toBeGreaterThan(lowPrior);
    // Guess rate means they shouldn't jump too high from one correct
    expect(afterCorrect).toBeLessThan(0.7);
  });

  it('should produce reproducible, deterministic results', () => {
    const a = bktUpdate(0.5, true);
    const b = bktUpdate(0.5, true);
    expect(a).toBe(b);
  });
});

describe('reconcileSkillFromEvidence — multi-event BKT', () => {
  it('should return the initial P_L0 with zero confidence when no events', () => {
    const result = reconcileSkillFromEvidence([]);
    expect(result.finalEstimate).toBe(BKT_PARAMS.P_L0);
    expect(result.confidenceScore).toBe(0);
  });

  it('should increase P(known) over a sequence of mostly-correct events', () => {
    const events: SkillEvidenceEvent[] = [
      { correct: true },
      { correct: true },
      { correct: false },
      { correct: true },
      { correct: true },
    ];
    const result = reconcileSkillFromEvidence(events);
    expect(result.finalEstimate).toBeGreaterThan(BKT_PARAMS.P_L0);
    expect(result.finalEstimate).toBeGreaterThan(0.7);
  });

  it('should increase confidence with more events', () => {
    const oneEvent = reconcileSkillFromEvidence([{ correct: true }]);
    const fiveEvents = reconcileSkillFromEvidence([
      { correct: true },
      { correct: true },
      { correct: true },
      { correct: true },
      { correct: true },
    ]);
    expect(fiveEvents.confidenceScore).toBeGreaterThan(oneEvent.confidenceScore);
  });

  it('should converge toward P_T floor after many incorrect events', () => {
    const events: SkillEvidenceEvent[] = Array(20).fill({ correct: false });
    const result = reconcileSkillFromEvidence(events);
    // Should be low but not zero, stabilizing around P_T / (1 - (1-P_T)) region
    expect(result.finalEstimate).toBeGreaterThan(0.15);
    expect(result.finalEstimate).toBeLessThan(0.35);
  });
});

describe('reconcileSkillEstimate — legacy adapter', () => {
  const now = new Date('2026-08-28T00:00:00Z');

  it('should handle zero evidence records', () => {
    const result = reconcileSkillEstimate([], now);
    expect(result).toEqual({ final_estimate: null, confidence_score: 0 });
  });

  it('should scale output to 0–5 range', () => {
    const evidence: SkillEvidence[] = [
      { score: 4, source: 'diagnostic', timestamp: new Date('2026-08-27T00:00:00Z') },
      { score: 5, source: 'project_completion', timestamp: new Date('2026-08-28T00:00:00Z') },
    ];
    const result = reconcileSkillEstimate(evidence, now);
    expect(result.final_estimate).not.toBeNull();
    expect(result.final_estimate!).toBeGreaterThanOrEqual(0);
    expect(result.final_estimate!).toBeLessThanOrEqual(5);
  });

  it('should produce higher estimates from high-scoring evidence', () => {
    const highEvidence: SkillEvidence[] = [
      { score: 5, source: 'diagnostic', timestamp: now },
      { score: 4, source: 'diagnostic', timestamp: now },
    ];
    const lowEvidence: SkillEvidence[] = [
      { score: 1, source: 'diagnostic', timestamp: now },
      { score: 0, source: 'diagnostic', timestamp: now },
    ];
    const highResult = reconcileSkillEstimate(highEvidence, now);
    const lowResult = reconcileSkillEstimate(lowEvidence, now);
    expect(highResult.final_estimate!).toBeGreaterThan(lowResult.final_estimate!);
  });
});
