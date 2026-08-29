import { describe, it, expect } from 'vitest';
import { selectDifficulty, difficultyToNumber } from '../../src/lib/core/adaptiveDiagnostic';

describe('adaptiveDiagnostic', () => {
  describe('selectDifficulty', () => {
    it("returns 'beginner' for pKnown = 0.2", () => {
      expect(selectDifficulty(0.2)).toBe('beginner');
    });

    it("returns 'intermediate' for pKnown = 0.5", () => {
      expect(selectDifficulty(0.5)).toBe('intermediate');
    });

    it("returns 'advanced' for pKnown = 0.8", () => {
      expect(selectDifficulty(0.8)).toBe('advanced');
    });

    it("returns 'intermediate' for boundary value exactly 0.35", () => {
      expect(selectDifficulty(0.35)).toBe('intermediate');
    });

    it("returns 'advanced' for boundary value exactly 0.65", () => {
      expect(selectDifficulty(0.65)).toBe('advanced');
    });
  });

  describe('difficultyToNumber', () => {
    it('maps beginner to 2, intermediate to 3, and advanced to 4', () => {
      expect(difficultyToNumber('beginner')).toBe(2);
      expect(difficultyToNumber('intermediate')).toBe(3);
      expect(difficultyToNumber('advanced')).toBe(4);
    });
  });
});
