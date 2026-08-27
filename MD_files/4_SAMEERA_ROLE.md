# Sameera's Role — Onboarding, Path & Adaptation
## Adaptive Learning Intelligence Engine — HCL Hackathon

> This file is yours. Paste `1_MASTER_PLAN.md` into a fresh Claude/Antigravity session first for full project context, then use this file as your personal execution guide. If you only have time to read one file before starting, read this one.

---

## 1. Your one-line mandate

You own the part of the system the learner actually *touches* first and *feels* adapting later: the onboarding conversation that turns a vague goal into a structured profile, the path generator that turns Rudrakshi's scored candidates into a phased roadmap, and the adaptation engine that rebuilds the plan when the learner struggles. This is the most fully-specified slice of the whole system — every behavior below is already decided in `1_MASTER_PLAN.md`. Your job is fast, precise execution against that spec, not improvisation.

---

## 2. Everything you own, grouped by what it does

### A. Onboarding (F1)
| File | What it does |
|---|---|
| `src/app/onboarding/page.tsx` | The onboarding screen — hosts the chat flow |
| `components/chat/ChatBubble.tsx` | Renders one message (learner or AI) |
| `components/chat/QuickReplyChips.tsx` | Tappable chips for closed-ended questions (experience level, weekly hours, learning style, per-skill self-rating) |
| `components/chat/ChatInput.tsx` | Free-text input for open-ended goal description |
| `lib/ai/gemini.ts` | Gemini client wrapper — plugs into `callAI()` for the "understanding/extraction" role |
| `POST /api/chat` | Runs the onboarding conversation turn-by-turn, returns `quick_replies` when the next question is closed-ended |
| `POST /api/profile/extract` | Calls `callAI()` to turn the conversation into a structured JSON profile matching the schema — **must always return valid schema JSON**, this is what Rudrakshi's pipeline consumes next |

**Key behavior to hold the line on:** onboarding is **hybrid input** — free text for the open-ended goal, quick-reply chips for everything closed-ended. Don't quietly turn it into a pure form or a pure chatbot; the master plan is explicit about this (§14 rule 10 in `hcl_plan.md`, carried into `1_MASTER_PLAN.md`).

### B. Path generation & adaptation (F10, F13, F14, F15)
| File | What it does |
|---|---|
| `lib/core/prerequisiteSort.ts` | **Deterministic** topological sort of Rudrakshi's ranked candidates into phases: Foundations → Core → Applied Project → Specialization → Capstone. Outputs a time-to-goal estimate from the learner's weekly hour budget. |
| `lib/core/impactEvaluator.ts` | Checks whether new evidence (a progress event, a "too hard" flag) crosses the replan threshold. If yes, runs the cause-diagnosis chain in order: check prerequisite gap → recent diagnostic scores → difficulty metadata → format mismatch → pick the first matching cause → apply the matching action (insert prerequisite / swap resource / adjust pacing). |
| `lib/ai/groq.ts` | Groq client wrapper — plugs into `callAI()` for the "writing/explanation" role (e.g. the adaptation reason banner text) |
| `POST /api/path/generate` | Runs `prerequisiteSort.ts` on Rudrakshi's candidates, writes a new `learning_paths` + `learning_path_items` version |
| `GET /api/path/history` | Returns all path versions for the evolution timeline |
| `POST /api/progress` | Logs a progress event, calls `impactEvaluator.ts`, triggers replan if threshold crossed |
| `POST /api/goal/change` | Recomputes the gap against the new goal template, credits transferable/already-verified skills instead of restarting from zero |

**Key behavior to hold the line on:** `prerequisiteSort.ts` and `impactEvaluator.ts` are **deterministic code, never an LLM call**. The LLM (via `callAI()` → `groq.ts`) only writes the *prose* for the adaptation reason banner — it never decides *whether* to replan or *what* the new order is. That decision logic is yours to write as plain TypeScript, not a prompt.

### C. Supporting components
| File | What it does |
|---|---|
| `components/resource/ResourceCard.tsx` | Displays one resource in the path (title, type, difficulty, reason) |
| `components/resource/ProgressToggle.tsx` | Marks an item complete / too hard / skipped — feeds `/api/progress` |
| `components/resource/DecisionTraceModal.tsx` | Rendering shell only — the actual trace *content* comes from Rudrakshi's `/api/explain/trace`, you just wire the display |

### D. Tests
- `tests/unit/prerequisiteSort.test.ts` — valid topological ordering, no cycles, correct phase assignment
- `tests/unit/impactEvaluator.test.ts` — threshold logic, correct cause picked in the diagnosis chain, no false-positive replans

---

## 3. The non-negotiable rule for your entire slice

**`prerequisiteSort.ts` and `impactEvaluator.ts` never delegate their decision to an LLM.** It can be tempting — "just ask the LLM to reorder these" or "just ask the LLM if this counts as struggling" — because it's faster to write. Don't. This determinism (Master Plan §14 rule 3) is the team's single strongest defensible claim to judges, and it has to hold everywhere, not just in Rudrakshi's code. Your code computes the order and the decision; `callAI()` only narrates it afterward in plain language.

---

## 4. Why deviating from spec is a stop-and-check, not a judgment call

Because your slice is the most fully specified part of the plan, **any point where you feel like you're improvising instead of following `1_MASTER_PLAN.md` is a signal to stop and ask Yash**, not a place to make a fast call and move on. This isn't about trusting your judgment less — it's that Rudrakshi and Yash are building against the exact contracts below, and a silent drift here (e.g. changing what `/api/path/generate` returns) is the most likely source of late integration pain for a 3-person team working this tightly coupled. Fast execution is your strength; keep it aimed at the spec, not around it.

---

## 5. Shared contracts you depend on / provide

- **You depend on:** the Supabase schema and `callAI()` signature from Yash — confirm his schema is pushed before writing real queries, don't build against a guess.
- **You depend on:** `learner_skills.final_estimate` + `confidence_score` from Rudrakshi's `/api/skills/reconcile`, and the ranked array from `/api/recommend`: `{ resource_id, score, score_breakdown }[]`.
- **You provide to Rudrakshi:** `learner_profiles` row + initial `learner_skills` rows (`self_rated_level` only), written right after `/api/profile/extract` — this is what unblocks his diagnostic selection.
- **You provide to Yash:** `learning_paths` + `learning_path_items` rows, fully populated with `reason` and `status`, ready for the dashboard to render as-is.

---

## 6. Suggested day-by-day

**Day 1:**
- Morning: as soon as Yash's schema + `callAI()` stub land, start `src/app/onboarding/page.tsx` + `ChatBubble`/`QuickReplyChips`/`ChatInput` against the stub — don't wait for real provider wiring.
- Get `/api/chat` and `/api/profile/extract` working end-to-end with the stub `callAI()`, confirm the profile JSON always matches schema (test with 5+ varied sample conversations).
- Ask Claude to turn Master Plan §5 (onboarding spec) into an explicit component + state checklist before writing code — this is the fastest way to remove ambiguity up front.

**Day 2:**
- `prerequisiteSort.ts` — build and unit-test against Rudrakshi's candidate shape as soon as `/api/recommend` returns real data.
- `impactEvaluator.ts` — implement the cause-diagnosis chain exactly in the order specified (prereq gap → diagnostic scores → difficulty → format mismatch).
- `/api/path/generate`, `/api/progress` wired end-to-end.
- Unit tests for both.

**Day 3:**
- `/api/goal/change`, `/api/path/history`.
- `ResourceCard`, `ProgressToggle`, `DecisionTraceModal` (display shell — content from Rudrakshi's trace endpoint).
- Sit with Yash for the `fullFlow.test.ts` run; be ready to walk through the adaptation flow (item marked "too hard" → diagnosis → path v2 → evolution strip) for the demo rehearsal, since it's step 7 of the demo script.

---

## 7. Working with Claude + Antigravity IDE

- **Claude first, for spec-to-checklist conversion** — before touching code on any piece, paste the relevant Master Plan section (§5 for onboarding, §7/§10 for path generation, §13 for the demo script) and ask for an exact step-by-step checklist of components/state/API shape. This turns "build the onboarding flow" into a list of concrete, checkable tasks — which is exactly where fast implementation works best.
- **Antigravity IDE for the build loop** — once the checklist is agreed, this is well suited to "implement exactly this, following this spec" work. Feed it the checklist and the shared contracts from Section 5 above as the spec, not a paraphrase.
- **Always re-check against Section 5's shared contracts before opening a PR** — a shape mismatch here (e.g. `learning_path_items` missing a field Yash's dashboard expects) is the easiest way to cause a late merge conflict in a 3-person team.
- If a spec section feels ambiguous or underspecified, that's the "ask Yash" trigger from Section 4 — use Claude to first confirm it's genuinely ambiguous (not just unfamiliar) by asking "does `1_MASTER_PLAN.md` §X actually specify this behavior?", then take it to Yash rather than guessing.
