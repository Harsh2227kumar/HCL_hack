export type DifficultyLevel = 'beginner' | 'intermediate' | 'advanced';

/**
 * Deterministic difficulty selection based on current BKT mastery P(known).
 * Thresholds:
 *   P(known) < 0.35            -> 'beginner'
 *   0.35 <= P(known) < 0.65   -> 'intermediate'
 *   P(known) >= 0.65           -> 'advanced'
 */
export function selectDifficulty(pKnown: number): DifficultyLevel {
  if (pKnown < 0.35) {
    return 'beginner';
  }
  if (pKnown < 0.65) {
    return 'intermediate';
  }
  return 'advanced';
}

/**
 * Maps a difficulty level to a numeric scale (1-5 range matching system models).
 * beginner=2, intermediate=3, advanced=4
 */
export function difficultyToNumber(level: DifficultyLevel): number {
  switch (level) {
    case 'beginner':
      return 2;
    case 'intermediate':
      return 3;
    case 'advanced':
      return 4;
  }
}
