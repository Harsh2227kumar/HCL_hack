# Team Roles — Adaptive Learning Intelligence Engine
## Companion to `1_MASTER_PLAN.md` — read that first if you haven't

Team: **Yash Khadgi** (lead), **Rudrakshi** (AI/ML core), **Sameera** (build-to-spec backend/frontend). A 4th collaborator is separately extracting seed data from GitHub — not part of this build team, not blocking (see Master Plan §15.3–15.4).

---

## 1. Role summary

| | Yash Khadgi | Rudrakshi | Sameera |
|---|---|---|---|
| **Title** | Team Lead / Platform & Integration | AI/ML & Intelligence Core | Onboarding, Path & Adaptation |
| **Primary judging criterion owned** | Performance & Code Quality, Solution Design | AI/ML Implementation | Functionality & UX |
| **Touches an LLM directly?** | Yes — builds the abstraction layer | Yes — RAG + explanation prompts | Yes — chat + path explanation prompts |
| **Owns the database schema?** | Yes | No (consumes it) | No (consumes it) |
| **Reviews others' PRs before merge?** | Yes, everyone's | No | No |

---

## 2. Yash Khadgi — Team Lead / Platform & Integration

### 2.1 Why this split
As lead with strong backend + AI understanding, Yash owns everything that (a) everyone else needs to exist before they can build, and (b) requires judgment calls under time pressure rather than a fixed spec.

### 2.2 Owns

**Setup & infra**
- Next.js 14 project scaffold, Tailwind, shadcn/ui, ESLint/Prettier
- Supabase project creation, `prisma/schema.prisma` (full schema from Master Plan §8), push empty schema — **this unblocks Rudrakshi and Sameera, do it first, day 1**
- Vercel project + environment variables (`.env.example` committed, `.env.local` gitignored)

**Shared AI abstraction**
- `lib/ai/callAI.ts` — the retry/fallback/circuit-breaker shell (Master Plan §6.4–6.5). Ship a *stub* version (even one that returns canned JSON) on day 1 so Rudrakshi and Sameera can build against `callAI(role, prompt, schema)` immediately, then harden it with real provider routing.
- `lib/supabase/client.ts` and typed query helpers
- `lib/validation/groundingCheck.ts` (resource-ID existence validator — the anti-hallucination gate)

**Dashboard aggregation**
- `GET /api/dashboard` — pulls together profile + latest path + progress + bottleneck + time-to-goal
- Dashboard frontend shell (`/dashboard/page.tsx`) and wiring the visual components together (component internals can be split with Sameera if time allows)

**Integration & delivery**
- Merges branches, resolves schema/contract conflicts, keeps `types/index.ts` consistent
- Owns `tests/integration/fullFlow.test.ts` (3 personas end-to-end) and the Postman collection
- `docs/README.md`, `docs/ARCHITECTURE.md`
- Final deploy to Vercel, demo video recording and script rehearsal (Master Plan §13)
- Decides if/how the 4th collaborator's scraped dataset gets merged (Master Plan §15.4)

### 2.3 Build order (day-by-day)
1. **Day 1 AM:** Supabase schema pushed, repo scaffolded, `callAI()` stub, `.env.example` — announce in team chat the moment this is done, it unblocks everyone.
2. **Day 1 PM:** review Rudrakshi's and Sameera's first PRs against the shared contracts (Section 5 below); start real `gemini`/`groq` provider wiring inside `callAI()`.
3. **Day 2:** dashboard API + frontend shell; start integration-testing other people's routes as they land.
4. **Day 3:** full `fullFlow.test.ts` run against demo personas, deploy, docs, record demo video, rehearse.

### 2.4 Working with Claude + Antigravity IDE
- Use **Claude** for architecture decisions, reviewing PRs/diffs from Rudrakshi and Sameera before merge, and debugging cross-cutting issues (schema mismatches, `callAI()` contract breaks).
- Use **Antigravity IDE** as the main agentic driver for scaffolding: give it the exact schema/API contracts from `1_MASTER_PLAN.md` §8–9 as the spec, let it generate the boilerplate (routes, Supabase client, Prisma schema file), then review its output in Claude before accepting.
- Good prompt pattern for both tools: paste the relevant Master Plan section verbatim (e.g. §6.4 multi-AI role split) instead of describing it from memory — this plan is intentionally detailed enough to be copy-pasted directly as a spec.

---

## 3. Rudrakshi — AI/ML & Intelligence Core

### 3.1 Why this split
This is the part of the system that actually earns the "AI/ML Implementation" score (20%) and the strongest technical talking points in front of judges (the reconciliation formula, the bottleneck graph walk, grounded RAG). It needs someone who can reason about the math and defend it live, not just implement a spec — that's the fit for prior ML/AI-project experience.

### 3.2 Owns

**Learner state & diagnostics (F2, F3, F4)**
- `lib/core/diagnosticSelection.ts` — priority scoring: `target_importance × current_uncertainty × prerequisite_criticality`
- `lib/core/reconciliation.ts` — the evidence-weighted formula (Master Plan §8), must produce `final_estimate` + `confidence_score`
- `POST /api/diagnostic/generate`, `POST /api/diagnostic/submit`
- `POST /api/skills/reconcile`, `POST /api/skills/evidence`

**Skill gap & recommendation intelligence (F5, F6, F7, F8)**
- `lib/core/skillGap.ts` and `lib/core/bottleneckDetection.ts` — deterministic graph walk, `bottleneck_score = gap × downstream_skills_blocked`
- `lib/core/hybridScoring.ts` — multi-factor recommendation scoring
- `lib/ai/embeddings.ts` — Gemini `text-embedding-004` wrapper, precomputed at seed time
- `POST /api/recommend`, `POST /api/skills/bottleneck`

**Explainability (F11, F12)**
- Decision trace structure (goal → gap → evidence → candidate → why selected)
- "Why not" counterfactual logic ("B would win if X, Y, Z changed")
- `POST /api/explain/trace`, `POST /api/explain/compare`

**Data fallback (Master Plan §15.4)**
- Own the fallback seed dataset: build a small (30–50 resource) hand-curated `data/learning_resources.json`, `goal_templates.json`, `skill_dependencies.json` covering 1–2 demo goals **early, in parallel**, regardless of whether the 4th collaborator's scrape arrives. Swap in the fuller dataset later if/when it lands.

**Tests**
- `tests/unit/reconciliation.test.ts`, `tests/unit/bottleneckDetection.test.ts`

### 3.3 Critical rule to hold the line on
Everything above is **deterministic code, never an LLM call**, except the diagnostic quiz *generation* (F3) and the "why" *prose* (which just narrates numbers Rudrakshi's code already computed). If a shortcut ever tempts "just ask the LLM to score it," don't — this determinism is the project's single strongest defensible claim to judges (Master Plan §14 rule 3).

### 3.4 Working with Claude + Antigravity IDE
- Use **Claude** to work through the math itself first (reconciliation weights, bottleneck traversal correctness, edge cases like a skill with no evidence yet) — this is genuinely reasoning-heavy, get the logic right in conversation before generating code.
- Use **Antigravity IDE** to implement and unit-test the agreed logic quickly, and to iterate on the RAG retrieval + hybrid scoring pipeline against real seed data.
- See the fully personalized breakdown, checklist, and day-by-day plan in `3_RUDRAKSHI_ROLE.md`.

---

## 4. Sameera — Onboarding, Path & Adaptation

### 4.1 Why this split
This slice of the system is the most **fully specified** part of the whole plan — the onboarding UX (Master Plan §5), the path generator (pure topological sort), and the impact evaluator (a threshold check with named branches) are all laid out in exact detail already. That's precisely where fast, confident implementation ("vibe coding") pays off — the ambiguity is already removed, so the job is disciplined execution against a spec, with review.

### 4.2 Owns

**Onboarding (F1)**
- `src/app/onboarding/page.tsx`, `components/chat/ChatBubble.tsx`, `QuickReplyChips.tsx`, `ChatInput.tsx`
- `POST /api/chat`, `POST /api/profile/extract`
- `lib/ai/gemini.ts` — Gemini client wrapper (used for understanding/extraction role)

**Path generation & adaptation (F10, F13, F14, F15)**
- `lib/core/prerequisiteSort.ts` — topological sort into phases (Foundations → Core → Applied Project → Specialization → Capstone), outputs time-to-goal
- `lib/core/impactEvaluator.ts` — replan-threshold check + "too hard" cause diagnosis (check prereq gap → recent diagnostic scores → difficulty metadata → format mismatch → pick cause → apply matching action)
- `lib/ai/groq.ts` — Groq client wrapper (writing/explanation role)
- `POST /api/path/generate`, `GET /api/path/history`, `POST /api/progress`, `POST /api/goal/change`

**Supporting components**
- `components/resource/ResourceCard.tsx`, `ProgressToggle.tsx`, `DecisionTraceModal.tsx` (rendering shell — trace *content* comes from Rudrakshi's `/api/explain/trace`)

**Tests**
- `tests/unit/prerequisiteSort.test.ts`, `tests/unit/impactEvaluator.test.ts`

### 4.3 How this role is set up for success
Because build-to-spec speed is the strength being leaned on here, every task above already has its exact behavior defined in `1_MASTER_PLAN.md` — the topological sort phases, the diagnosis branches, the quick-reply chip UX. **Sameera should treat deviations from the written spec as a flag to stop and check with Yash**, not a place to improvise, since this is the area most likely to cause integration surprises late if it drifts from the contract other people are building against.
Yash reviews these PRs before merge, given the pairing described in Section 2.2.

### 4.4 Working with Claude + Antigravity IDE
- Use **Claude** to turn each spec section into an explicit step-by-step checklist *before* touching code (e.g. paste Master Plan §5 and ask "give me the exact component + state changes needed for this") — this converts ambiguity risk into a checklist, which plays to a fast-implementation strength.
- Use **Antigravity IDE** to execute the checklist directly — it's well suited to "build exactly this, following this spec" tasks.
- Always re-check generated code against the shared contracts in Section 5 below before opening a PR.
- Full personalized breakdown and checklist in `4_SAMEERA_ROLE.md`.

---

## 5. Shared contracts (so nobody blocks anybody)

Agree on these exact shapes **before** writing implementation — this is what lets all three people build in parallel without waiting on each other:

- **Sameera → Rudrakshi**: `learner_profiles` row + initial `learner_skills` rows (`self_rated_level` only), written after `/api/profile/extract`
- **Rudrakshi → Sameera**: `learner_skills.final_estimate` + `confidence_score` (from `/api/skills/reconcile`), and the ranked array from `/api/recommend`: `{ resource_id, score, score_breakdown }[]`
- **Sameera → Yash**: `learning_paths` + `learning_path_items` rows, fully populated with `reason` and `status`, ready to render
- **Yash → everyone**: the Supabase schema itself (must exist before anyone writes real queries) and the `callAI(role, prompt, schema)` signature that Rudrakshi and Sameera plug their provider clients into

---

## 6. Communication rules

- Any change to a shared file (`types/index.ts`, `schema.prisma`, `callAI.ts` signature) gets flagged in the team chat **before** editing — these three people are not working in isolated folders the way a 5-person team would, so silent changes here are the most likely source of merge pain.
- End of each day: quick sync on what got built, what's blocked, and whether the 4th collaborator's data has landed yet (if it has, Rudrakshi decides whether/how to merge it).
- If Sameera hits a spec ambiguity, default action is "ask Yash," not "make a judgment call and continue" — this keeps her fast-execution strength working *for* the timeline instead of against it.
