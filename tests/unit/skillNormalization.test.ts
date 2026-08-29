import { describe, it, expect } from 'vitest';
import {
  buildSkillVocabulary,
  resolveSkillName,
  getSkillVocabulary,
} from '../../src/lib/core/skillNormalization';

describe('skillNormalization', () => {
  const mockVocab = [
    { canonical: 'JavaScript', aliases: ['JS', 'ES6', 'ECMAScript'] },
    { canonical: 'Python', aliases: ['Python Programming', 'Python Fundamentals'] },
    { canonical: 'PostgreSQL & SQL', aliases: ['PostgreSQL', 'SQL'] },
  ];

  const { canonicalSet, aliasToCanonicalMap } = buildSkillVocabulary(mockVocab);

  it('resolves exact canonical match', () => {
    expect(resolveSkillName('JavaScript', canonicalSet, aliasToCanonicalMap)).toBe('JavaScript');
    expect(resolveSkillName('Python', canonicalSet, aliasToCanonicalMap)).toBe('Python');
  });

  it('resolves alias match', () => {
    expect(resolveSkillName('JS', canonicalSet, aliasToCanonicalMap)).toBe('JavaScript');
    expect(resolveSkillName('ES6', canonicalSet, aliasToCanonicalMap)).toBe('JavaScript');
    expect(resolveSkillName('PostgreSQL', canonicalSet, aliasToCanonicalMap)).toBe('PostgreSQL & SQL');
  });

  it('resolves case-insensitive match for canonical and aliases', () => {
    expect(resolveSkillName('javascript', canonicalSet, aliasToCanonicalMap)).toBe('JavaScript');
    expect(resolveSkillName('js', canonicalSet, aliasToCanonicalMap)).toBe('JavaScript');
    expect(resolveSkillName('python programming', canonicalSet, aliasToCanonicalMap)).toBe('Python');
  });

  it('returns null for unknown skill', () => {
    expect(resolveSkillName('Rust Programming Language 101', canonicalSet, aliasToCanonicalMap)).toBeNull();
    expect(resolveSkillName(null, canonicalSet, aliasToCanonicalMap)).toBeNull();
    expect(resolveSkillName(undefined, canonicalSet, aliasToCanonicalMap)).toBeNull();
  });

  it('loads skill vocabulary singleton via getSkillVocabulary', () => {
    const vocab = getSkillVocabulary();
    expect(vocab.canonicalSet.size).toBeGreaterThan(0);
    expect(vocab.canonicalSet.has('Python')).toBe(true);
    expect(resolveSkillName('JS', vocab.canonicalSet, vocab.aliasToCanonicalMap)).toBe('JavaScript');
  });
});
