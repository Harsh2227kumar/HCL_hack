import fs from 'fs';
import path from 'path';

export interface SkillVocabEntry {
  canonical: string;
  aliases?: string[];
}

export interface SkillVocabulary {
  canonicalSet: Set<string>;
  aliasToCanonicalMap: Map<string, string>;
}

/**
 * Builds canonicalSet and aliasToCanonicalMap from vocabulary entries.
 */
export function buildSkillVocabulary(skillsVocab: SkillVocabEntry[]): SkillVocabulary {
  const canonicalSet = new Set<string>();
  const aliasToCanonicalMap = new Map<string, string>();

  for (const entry of skillsVocab) {
    const canonical = entry.canonical?.trim();
    if (!canonical) continue;

    if (!canonicalSet.has(canonical)) {
      canonicalSet.add(canonical);
    }

    const aliases = entry.aliases || [];
    for (const alias of aliases) {
      const trimmedAlias = alias.trim();
      if (!aliasToCanonicalMap.has(trimmedAlias)) {
        aliasToCanonicalMap.set(trimmedAlias, canonical);
      }
    }
  }

  return { canonicalSet, aliasToCanonicalMap };
}

/**
 * Resolves a raw skill name to its canonical skill name using exact, alias, or case-insensitive matching.
 */
export function resolveSkillName(
  rawSkillName: string | null | undefined,
  canonicalSet: Set<string>,
  aliasToCanonicalMap: Map<string, string>
): string | null {
  if (!rawSkillName) return null;
  const trimmed = rawSkillName.trim();
  if (canonicalSet.has(trimmed)) return trimmed;
  const mapped = aliasToCanonicalMap.get(trimmed);
  if (mapped && canonicalSet.has(mapped)) return mapped;

  // Case-insensitive fallback lookup
  const lower = trimmed.toLowerCase();
  for (const c of canonicalSet) {
    if (c.toLowerCase() === lower) return c;
  }
  for (const [a, c] of aliasToCanonicalMap.entries()) {
    if (a.toLowerCase() === lower) return c;
  }
  return null;
}

let cachedVocabulary: SkillVocabulary | null = null;

/**
 * Returns a cached singleton of the skill vocabulary loaded from data/skills.json.
 */
export function getSkillVocabulary(): SkillVocabulary {
  if (!cachedVocabulary) {
    const rootDir = process.cwd();
    const skillsPath = path.join(rootDir, 'data', 'skills.json');
    const skillsVocab: SkillVocabEntry[] = JSON.parse(fs.readFileSync(skillsPath, 'utf8'));
    cachedVocabulary = buildSkillVocabulary(skillsVocab);
  }
  return cachedVocabulary;
}
