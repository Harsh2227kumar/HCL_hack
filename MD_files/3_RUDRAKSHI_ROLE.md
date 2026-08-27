# Rudrakshi's Role — AI/ML & Intelligence Core
## Adaptive Learning Intelligence Engine — HCL Hackathon

> This file is yours. Paste `1_MASTER_PLAN.md` into a fresh Claude/Antigravity session first for full project context, then use this file as your personal execution guide. If you only have time to read one file before starting, read this one.

---

## 1. Your one-line mandate

You own the part of the system that actually thinks: the learner state model, the skill-gap and bottleneck math, the retrieval + scoring pipeline, and the explanations. This is the "AI/ML Implementation" 20% of the score, and it's also the strongest technical story the team tells judges — you should be able to walk a judge through the reconciliation formula and the bottleneck graph walk from memory by demo day.

---

## 2. Everything you own, grouped by what it does

### A. Learner State Model (F2, F3, F4)
| File | What it does |
|---|---|
| `lib/core/diagnosticSelection.ts` | Decides which claimed skills actually get tested. `priority = target_importance × current_uncertainty × prerequisite_criticality`. Only top-N by priority get quizzed. |
| `lib/core/reconciliation.ts` | Combines self-report + observed + evidence into one honest number. **This is the formula, don't approximate it:**<br>`final_estimate = Σ(score × reliability × recency_weight) ÷ Σ(reliability × recency_weight)`<br>Baseline reliability: diagnostic ≈ 0.7, self_report ≈ 0.3, project_completion ≈ 0.6. Recency weight decays with time. |
| `POST /api/diagnostic/generate` | Calls `callAI()` (understanding role → Gemini) to generate a ~5-question quiz for one skill |
| `POST /api/diagnostic/submit` | Scores it, writes a row to `skill_evidence`, updates `learner_skills.observed_level` |
| `POST /api/skills/reconcile` | Runs your reconciliation formula, writes `final_estimate` + `confidence_score` |
| `POST /api/skills/evidence` | Returns the full evidence trail for one skill (powers the "why is my level X" click-through) |

### B. Skill Gap, Bottleneck & Recommendation (F5, F6, F7, F8)
| File | What it does |
|---|---|
| `lib/core/skillGap.ts` | Deterministic: `final_estimate` vs `target_level` per skill |
| `lib/core/bottleneckDetection.ts` | Walks the `skill_dependencies` graph. `bottleneck_score(skill) = gap(skill) × count(downstream_skills_blocked)`. Highest score wins, **not** the largest raw gap — that distinction is the point. |
| `lib/core/hybridScoring.ts` | Weighted multi-factor score: skill-gap match, prerequisite fit, difficulty fit, time fit, learning-style fit, historical feedback. Can output `"not_recommended_yet"` when prerequisites aren't met. |
| `lib/ai/embeddings.ts` | Gemini `text-embedding-004` wrapper. Precompute embeddings for the whole resource catalog **once at seed time** — never live during the demo. |
| `POST /api/recommend` | RAG (pgvector top-k) → your hybrid scoring → ranked candidates |
| `POST /api/skills/bottleneck` | Returns the current bottleneck skill |

### C. Explainability (F11, F12)
| File | What it does |
|---|---|
| Decision trace logic | goal → detected gap → evidence → candidate → why selected. Structured, not chain-of-thought prose. |
| Counterfactual logic | "Why A not B" → "B would win if X, Y, Z changed" |
| `POST /api/explain/trace` | Serves the structured trace |
| `POST /api/explain/compare` | Serves the counterfactual |

### D. Fallback seed data (your responsibility per Master Plan §15.4)
- Don't wait on the 4th collaborator's GitHub scrape.
- Build `data/learning_resources.json` (30–50 entries), `data/goal_templates.json` (2–3 goals, e.g. "Data Analyst" and "ML Engineer" since those match the demo script), `data/skill_dependencies.json` (enough edges to make Linear Algebra a real bottleneck for the demo persona) — **early, in parallel with everything else**, not after waiting to see what arrives.
- If the fuller scraped dataset lands with time to spare, merge/replace it and re-run the seed script. If not, your hand-built set is what ships.

### E. Tests
- `tests/unit/reconciliation.test.ts` — formula correctness, edge case: skill with zero evidence
- `tests/unit/bottleneckDetection.test.ts` — correct bottleneck picked over largest-raw-gap distractor, no infinite loops on cyclic input

---

## 3. The non-negotiable rule for your entire slice

**Nothing in Section 2.A/2.B ever calls an LLM to make a decision.** The LLM (via `callAI()`) is only used for: (1) generating diagnostic quiz *questions*, and (2) writing the *prose* explanation of a decision your code already made. If you ever find yourself thinking "I'll just have the LLM score/rank/decide this," stop — that's exactly the shortcut the team has explicitly ruled out, because "deterministic core, never delegated to an LLM" is the single most defensible claim in front of judges. Your code computes the number; the LLM only narrates it.

---

## 4. Shared contracts you depend on / provide

- **You depend on:** `learner_profiles` + initial `learner_skills` (self-rated only) from Sameera's `/api/profile/extract`.
- **You provide to Sameera:** `learner_skills.final_estimate` + `confidence_score`, and the ranked array from `/api/recommend`: `{ resource_id, score, score_breakdown }[]`.
- **You depend on:** the Supabase schema and `callAI()` signature from Yash — don't build against a guessed schema, confirm his is pushed first.

---

## 5. Suggested day-by-day

**Day 1:**
- Morning: as soon as Yash's schema + `callAI()` stub land, start `reconciliation.ts` and `diagnosticSelection.ts` against real table shapes.
- In parallel: start the hand-built fallback dataset (Section 2.D) — don't wait for the scraped data.
- Get the reconciliation formula and bottleneck formula reviewed in a Claude conversation before writing final code — these are the two things you'll defend live to judges, get them right early.

**Day 2:**
- `skillGap.ts`, `bottleneckDetection.ts`, `hybridScoring.ts` against your fallback dataset.
- `embeddings.ts` + pgvector retrieval wired into `/api/recommend`.
- Unit tests for reconciliation + bottleneck.

**Day 3:**
- Decision trace + counterfactual explanation endpoints.
- If the 4th collaborator's scraped dataset has arrived by now, merge it in and re-run seeds; otherwise ship the fallback set.
- Sit with Yash for the `fullFlow.test.ts` run and be ready to explain the reconciliation + bottleneck logic for the demo rehearsal.

---

## 6. Working with Claude + Antigravity IDE

- **Claude first, code second** for anything in Section 2.A/2.B — these are the pieces with real logic (weighting, graph traversal, threshold behavior), so talk through the formula/algorithm and edge cases in a Claude conversation before generating implementation. Paste the exact formulas from this file or `1_MASTER_PLAN.md` §8 — don't paraphrase them from memory, copy them verbatim into your prompt so nothing drifts.
- **Antigravity IDE** for the implementation + unit-test loop once the logic is agreed — it's well suited to "implement this exact function, then write tests that check these exact edge cases" tasks.
- Good pattern for edge cases to explicitly ask Claude about: a skill with zero evidence records, a skill dependency graph with a cycle (shouldn't happen but defend against it), a learner whose self-rating and diagnostic score disagree strongly, a recommendation candidate list that comes back empty from pgvector.
- When you want a second opinion on "is this a good enough judge-facing explanation of the bottleneck formula," ask Claude to role-play as a skeptical hackathon judge — it's a fast way to pressure-test your explanation before demo day.
