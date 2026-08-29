import { describe, test, expect } from 'vitest';
import {
  evaluateImpact,
  ProgressEvent,
  LearnerContext,
} from '../../src/lib/core/impactEvaluator';

describe('evaluateImpact', () => {
  const defaultContext: LearnerContext = {
    hasPrereqGap: false,
    recentDiagnosticNormalizedScore: 0.8,
    resourceDifficulty: 2,
    learnerExperienceLevel: 'Intermediate',
    formatMismatch: false,
  };

  test('triggers prereq_gap cause when hasPrereqGap is true', () => {
    const event: ProgressEvent = { eventType: 'too_hard', resourceId: 'res-1' };
    const context: LearnerContext = { ...defaultContext, hasPrereqGap: true };

    const result = evaluateImpact(event, context);
    expect(result.replan).toBe(true);
    expect(result.cause).toBe('prereq_gap');
    expect(result.action).toBe('insert_prerequisite');
  });

  test('triggers diagnostic_low_score cause when recentDiagnosticNormalizedScore < 0.5', () => {
    const event: ProgressEvent = { eventType: 'too_hard', resourceId: 'res-2' };
    const context: LearnerContext = { ...defaultContext, recentDiagnosticNormalizedScore: 0.3 };

    const result = evaluateImpact(event, context);
    expect(result.replan).toBe(true);
    expect(result.cause).toBe('diagnostic_low_score');
    expect(result.action).toBe('swap_resource');
  });

  test('triggers diagnostic_low_score cause for raw score of 2/5 (normalized 0.4)', () => {
    const event: ProgressEvent = { eventType: 'too_hard', resourceId: 'res-2b' };
    const context: LearnerContext = { ...defaultContext, recentDiagnosticNormalizedScore: 2 / 5 };

    const result = evaluateImpact(event, context);
    expect(result.replan).toBe(true);
    expect(result.cause).toBe('diagnostic_low_score');
    expect(result.action).toBe('swap_resource');
  });

  test('triggers difficulty_mismatch cause when resourceDifficulty >= 4 for Beginner', () => {
    const event: ProgressEvent = { eventType: 'too_hard', resourceId: 'res-3' };
    const context: LearnerContext = {
      ...defaultContext,
      resourceDifficulty: 4,
      learnerExperienceLevel: 'Beginner',
    };

    const result = evaluateImpact(event, context);
    expect(result.replan).toBe(true);
    expect(result.cause).toBe('difficulty_mismatch');
    expect(result.action).toBe('swap_resource');
  });

  test('triggers format_mismatch cause when formatMismatch is true', () => {
    const event: ProgressEvent = { eventType: 'too_easy', resourceId: 'res-4' };
    const context: LearnerContext = { ...defaultContext, formatMismatch: true };

    const result = evaluateImpact(event, context);
    expect(result.replan).toBe(true);
    expect(result.cause).toBe('format_mismatch');
    expect(result.action).toBe('swap_resource');
  });

  test('respects cause priority order (prereq_gap wins over diagnostic_low_score)', () => {
    const event: ProgressEvent = { eventType: 'too_hard', resourceId: 'res-5' };
    const context: LearnerContext = {
      hasPrereqGap: true,
      recentDiagnosticNormalizedScore: 0.2,
      resourceDifficulty: 5,
      learnerExperienceLevel: 'Beginner',
      formatMismatch: true,
    };

    const result = evaluateImpact(event, context);
    expect(result.replan).toBe(true);
    expect(result.cause).toBe('prereq_gap');
    expect(result.action).toBe('insert_prerequisite');
  });

  test('respects cause priority order (diagnostic_low_score wins over difficulty_mismatch)', () => {
    const event: ProgressEvent = { eventType: 'too_hard', resourceId: 'res-6' };
    const context: LearnerContext = {
      hasPrereqGap: false,
      recentDiagnosticNormalizedScore: 0.3,
      resourceDifficulty: 5,
      learnerExperienceLevel: 'Beginner',
      formatMismatch: true,
    };

    const result = evaluateImpact(event, context);
    expect(result.replan).toBe(true);
    expect(result.cause).toBe('diagnostic_low_score');
  });

  test('non-replan eventTypes (started, completed, skipped, diagnostic_taken) always return replan: false', () => {
    const context: LearnerContext = {
      hasPrereqGap: true,
      recentDiagnosticNormalizedScore: 0.1,
      resourceDifficulty: 5,
      learnerExperienceLevel: 'Beginner',
      formatMismatch: true,
    };

    const nonReplanEvents: ProgressEvent['eventType'][] = [
      'started',
      'completed',
      'skipped',
      'diagnostic_taken',
    ];

    nonReplanEvents.forEach((eventType) => {
      const result = evaluateImpact({ eventType, resourceId: 'res-7' }, context);
      expect(result.replan).toBe(false);
      expect(result.cause).toBeUndefined();
      expect(result.action).toBeUndefined();
    });
  });

  test('returns replan: false when no diagnosis cause matches', () => {
    const event: ProgressEvent = { eventType: 'too_hard', resourceId: 'res-8' };
    const result = evaluateImpact(event, defaultContext);
    expect(result.replan).toBe(false);
  });
});

