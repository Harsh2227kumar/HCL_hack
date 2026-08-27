# HCL Hackathon — Adaptive Learning Intelligence Engine
## Master Plan (Self-Contained — hand this to any fresh AI chat or teammate, they need nothing else)

> If you are an AI assistant reading this for the first time: this single file gives you everything — the hackathon context, the product, the architecture, the tech stack, the schema, the security plan, the testing plan, the demo script, AND the current team structure. A person may paste this file and then say "I am Yash / I am Rudrakshi / I am Sameera — what should I do next?" — use Section 15 to answer that.

---

## 0. Context — what this is and why it matters

**Event:** HCLTech hackathon.
**Stakes:** ~1000 teams participate. Only the **top 25** are selected. Selection leads directly to a **placement offer**. This is a recruitment filter disguised as a hackathon — polish, engineering depth, and a clean story matter as much as raw features.
**Timeline:** ~3 days from planning to submission.

**Required submission deliverables:**
1. Code as a zip file
2. GitHub repository
3. Demo video
4. Working prototype
5. Working deployed URL
6. Documentation

**Assumed judging rubric:**

| Criterion | Weight |
|---|---|
| Problem Understanding & Solution Design | 20% |
| Functionality & Feature Completeness | 25% |
| AI/ML Implementation | 20% |
| Innovation & Creativity | 15% |
| UX & Interface | 10% |
| Performance & Code Quality | 10% |

---

## 1. Original problem statement (verbatim, as given by HCL)

> **AI-Powered Personalized Learning Path Recommender**
>
> Design and prototype an AI-powered solution that delivers personalized learning experiences based on an individual's needs, interests, learning patterns and goals.
>
> **Background:** Online learning platforms offer thousands of courses across diverse domains. While recommendation systems can suggest relevant courses, learners often struggle to identify the right sequence of learning resources needed to achieve a specific goal. Different learners have different skill levels, interests, career aspirations and learning preferences, making a one-size-fits-all approach ineffective.
>
> **Task:** Design and build an intelligent learning assistant that recommends personalized learning paths based on a learner's interests, goals, previous learning history and skill level. The solution should generate a structured learning roadmap, explain recommendations, and adapt suggestions based on user feedback and progress.
>
> **What to build:**
> - A conversational interface where learners describe their goals in natural language.
> - A learner profiling engine capturing interests, experience level, completed courses and objectives.
> - A recommendation engine suggesting relevant courses, projects and learning resources.
> - A personalized learning path generator with prerequisites and milestones.
> - An AI assistant that explains why each recommendation was made and answers learner queries.
> - A dashboard visualizing progress, skill development, milestones and next recommended actions.

**The pitch to memorize:**

> "Instead of trusting what learners say they know, our system measures what they actually know, estimates confidence from evidence, identifies bottlenecks in the skill graph, optimizes a prerequisite-aware path under a real time budget, and continuously rebuilds the roadmap as new evidence comes in. It can even say 'not ready yet' instead of always recommending something."

Internal name: **Adaptive Learning Intelligence Engine**

---

## 2. Core conceptual pipeline

```
Learner Goal
   ↓
Self-Assessment + Diagnostic Selection Engine
   ↓
Diagnostics (targeted, not exhaustive)
   ↓
LEARNER STATE MODEL (self-rated + observed + evidence + confidence + velocity)
   ↓
Skill Gap Engine + Bottleneck Detection (via skill dependency graph)
   ↓
RAG Retrieval (pgvector semantic search over a grounded resource database)
   ↓
Hybrid Recommendation Scoring + Time-Constrained Optimization
   ↓
Prerequisite Graph / Path Generator (+ time-to-goal estimate)
   ↓
Learning Path (courses + projects + assessments, phased into milestones)
   ↓
Learn / Test → Evidence & Feedback → Impact Evaluator
   ↓
   NO  → keep current path
   YES → diagnose the cause → adapt/replan → new path version
```

---

## 3. Final feature list (16 features — LOCKED, no new features)

| # | Feature | Depth included |
|---|---|---|
| F1 | Conversational + guided onboarding | Hybrid input: free text for open-ended, tappable quick-reply chips for closed-ended |
| F2 | Diagnostic selection engine | `priority = target_importance × current_uncertainty × prerequisite_criticality` |
| F3 | Diagnostic assessment | AI-generated ~5-question quiz per skill → observed level + confidence |
| F4 | Learner state model | self-rated + observed + evidence + confidence(0–1) + velocity, full provenance trail |
| F5 | Measurable goal templates + skill dependency graph | Powers bottleneck detection; seeded from roadmap.sh |
| F6 | Skill-gap engine + bottleneck detection | `bottleneck_score = gap × downstream_skills_blocked` |
| F7 | RAG-based retrieval | pgvector top-k; LLM can only reference retrieved candidates (anti-hallucination) |
| F8 | Hybrid recommendation scoring | Multi-factor score + time-constrained optimization + "not recommended yet" |
| F9 | Resource types beyond courses | `type: course \| project \| assessment \| article` |
| F10 | Prerequisite-aware path generator | Topological sort into phases + time-to-goal estimate |
| F11 | Explainability ("why this") | Grounded 1–2 sentence reason + structured decision trace |
| F12 | "Why not" comparison | Full counterfactual: "B would win if X, Y, Z changed" |
| F13 | Threshold-gated adaptive replanning | Diagnosis step before replanning (prereq gap / low score / difficulty / format mismatch) |
| F14 | Adaptation reason banner | `adaptation_reason` object → path evolution view (v1→v2→v3) |
| F15 | Goal-change adaptation | Recomputes gap, credits transferable/verified skills |
| F16 | Dashboard | Goal, skill-gap bars, bottleneck callout, milestone timeline, time-to-goal, next best action, AI insight, path evolution strip |

**Excluded from scope (never build):** live web search/Tavily, gamified personas, cross-learner collaborative recommendations.

---

## 4. Data source: roadmap.sh / developer-roadmap GitHub repo

**Repo:** `https://github.com/kamranahmedse/developer-roadmap` · **Site:** `https://roadmap.sh/roadmaps`

roadmap.sh publishes ~94 community-vetted interactive roadmaps (Python, SQL, Backend, Data Analyst, AI/ML, DevOps, etc.), structured as ordered/branching topic graphs — i.e. **the roadmap structure is already a curated skill dependency graph**.

| roadmap.sh concept | Maps to |
|---|---|
| A roadmap | `goal_templates` entry — ordered topics become `required_skills` |
| Node ordering/branching | `skill_dependencies` (skill → depends_on skill) |
| Topic content files | Source for `learning_resources` entries (title, description, difficulty) |

**Important constraint:** this is a one-time, offline data-prep step. Not a live integration, not scraped at runtime, not a dependency of the deployed app. Static dataset lives in the project's own DB.

**Team note (current structure):** this extraction work is being done by a 4th, separate collaborator who is *only* responsible for scraping/curating this GitHub repo into the required JSON files (see Section 15.4). The 3-person build team does **not** wait on this — see the fallback plan in Section 15.4.

---

## 5. Onboarding UX — hybrid conversational + quick-reply input

- Open-ended questions (e.g. "What are you trying to achieve?") → free text, LLM extraction.
- Closed-ended/structured questions → tappable quick-reply chips (experience level, weekly hours, learning style, per-skill self-rating 0–5). Free-text input stays visible too, for flexibility.
- Chat message schema carries an optional `quick_replies: string[]` field; frontend renders buttons when present.
- This is a UI refinement of F1 — no new backend feature.

---

## 6. System architecture

### 6.1 High-level data flow

```
Learner (Web Browser)
        ↓
Next.js App (Vercel) — Chat/Onboarding UI + Dashboard + API Routes
        ↓
AI Abstraction Layer (single interface, retry + fallback logic: callAI())
        ↓                                    ↓
Primary: Gemini 2.5 Flash          Deterministic Core (plain code):
(understanding/extraction)          - Skill Reconciliation
        ↓ on failure                - Gap Engine + Bottleneck Detection
Fallback: Groq Llama 3.3 70B        - Hybrid Recommendation Scoring
(also primary for writing role)     - Time-Constrained Optimization
        ↓ if both fail              - Prerequisite Graph Sort
Template/cached response            - Impact Evaluator
        ↓                                    ↓
        └──────────────┬─────────────────────┘
                        ↓
        Supabase (PostgreSQL + pgvector + Auth)
                        ↓
        Feedback loop: progress_events → Impact Evaluator →
        (if threshold crossed) → Adaptation Engine → new
        learning_paths version → back to dashboard
```

### 6.2 Processing loop (per request)

```
PERCEIVE  (LLM)   — extract intent/entities from learner input
RETRIEVE  (code)  — RAG: pgvector top-k candidate resources
THINK     (code)  — reconciliation, gap, bottleneck, scoring, time optimization — NO LLM
ACT       (LLM)   — writes explanation, grounded ONLY on RETRIEVE's candidates
VALIDATE  (code)  — checks referenced resource IDs exist, checks output schema
RESPOND           — shown to learner
OBSERVE   (code)  — logs progress_events, updates velocity, loops back to THINK if threshold crossed
```

### 6.3 Orchestration — no LangChain/LangGraph

Hand-rolled TypeScript pipeline. Reasoning: the pipeline is fully specified in advance (not an open-ended agent decision), and this stack is Next.js/TypeScript (LangChain/LangGraph are Python-first). Judge-facing line: *"Our pipeline is fully specified and auditable — we don't need general-purpose agent orchestration for a scoped, deterministic system."*

### 6.4 Multi-AI role split

| Role | Primary | Fallback | Why |
|---|---|---|---|
| Understanding/extraction (profile, diagnostics, intent) | **Gemini 2.5 Flash** | Groq Llama 3.3 70B | Reliable structured JSON output |
| Writing/explanation (reasons, counterfactuals, chat) | **Groq Llama 3.3 70B** | Gemini 2.5 Flash | Very fast inference — snappy live demo |
| Retrieval + scoring | **Deterministic code + pgvector** | none | Auditable, not LLM-guessed |
| Validation | **Deterministic code** | none | Final gate before anything reaches learner |

Embeddings: Gemini `text-embedding-004`, precomputed once at seed time.

### 6.5 Resilience

- Single abstraction: `callAI()` — every LLM call site goes through it.
- Automatic failover on error/429 → other provider.
- Circuit breaker: 2 consecutive failures → cooldown, stop hammering a dead endpoint.
- Final fallback: deterministic template/keyword-parse response if both providers are down. Product keeps functioning; only prose loses polish.

### 6.6 Hallucination controls (four layers)

1. Grounded generation (RAG) — LLM only sees pre-retrieved candidates.
2. Post-generation validation — every referenced `resource_id` must exist in DB; drop silently if not.
3. Deterministic core stays LLM-free — gap/scoring/ordering is plain code.
4. Schema-enforced structured output — malformed response → one retry → template fallback.

---

## 7. Technology stack

| Category | Tool |
|---|---|
| Frontend framework | Next.js 14 (App Router) |
| Styling | Tailwind CSS |
| Components | shadcn/ui |
| Charts | Recharts |
| Icons | Lucide React |
| Backend | Next.js API routes (no separate backend service) |
| LLM — understanding | Google Gemini API — Gemini 2.5 Flash (free tier) |
| LLM — writing | Groq API — Llama 3.3 70B (free tier) |
| Embeddings | Gemini `text-embedding-004` |
| Database | Supabase (PostgreSQL) |
| Vector search | pgvector (built into Supabase) |
| Auth | Supabase Auth |
| ORM | Supabase JS client / Drizzle or Prisma |
| Orchestration | Custom TypeScript pipeline — no LangChain/LangGraph |
| Hosting | Vercel |
| API testing | Postman |
| Unit testing | Vitest / Jest |
| Version control | GitHub |
| Secrets | Vercel env vars + Supabase project settings (never `NEXT_PUBLIC_*`) |
| Docs | Markdown + Excalidraw/draw.io diagrams |
| Demo recording | OBS Studio or Loom |
| Dataset | Self-curated JSON, 150–300 entries, grounded in roadmap.sh |
| IDE / build tool | **Claude + Google Antigravity IDE** (see Section 15 for how each person should use it) |

**Explicitly excluded:** separate Python/FastAPI backend, dedicated vector DB service, AWS, LangChain/LangGraph, live web search, paid LLM as primary path.

---

## 8. Database schema (Supabase/Postgres)

```
learner_profiles        id, user_id, goal, weekly_hours, learning_style, notes, updated_at

learner_skills          id, user_id, skill_name, self_rated_level(0-5),
                         observed_level(0-5, nullable), confidence_score(0.0-1.0),
                         final_estimate(0-5), target_level(0-5),
                         velocity, last_assessed

skill_evidence          id, user_id, skill_name, source(self_report|diagnostic|
                         project|course_completion), score, reliability,
                         recency_weight, timestamp   -- evidence provenance/audit trail

skill_dependencies      id, skill_name, depends_on_skill_name   -- knowledge graph

goal_templates           id, goal_name, required_skills(jsonb: [{skill,min_level}])

learning_resources       id, title, type(course|project|assessment|article),
                          provider, description, url, skills_taught(jsonb),
                          prerequisite_skills(jsonb), difficulty, duration_hours,
                          format, embedding(vector)

diagnostics               id, skill_name, questions(jsonb), difficulty

learning_paths            id, user_id, version(int), trigger_reason(initial|
                           too_easy|too_hard|goal_change|diagnostic_result),
                           estimated_weeks_to_goal, generated_at

learning_path_items       id, path_id, resource_id, phase, position, status,
                           reason, score, score_breakdown

progress_events           id, user_id, resource_id, event_type(started|completed|
                           too_easy|too_hard|skipped|diagnostic_taken),
                           score(nullable), created_at
```

**Reconciliation formula (must be defended in front of judges):**
```
final_estimate = Σ(evidence.score × evidence.reliability × evidence.recency_weight)
                ÷ Σ(evidence.reliability × evidence.recency_weight)
```
Baseline reliability: diagnostic ≈ 0.7, self_report ≈ 0.3, project_completion ≈ 0.6.

**Bottleneck score:**
```
bottleneck_score(skill) = gap(skill) × count(downstream_skills_blocked_in_graph)
```

---

## 9. API surface

| Route | Purpose |
|---|---|
| `POST /api/chat` | Onboarding conversation, returns `quick_replies` when closed-ended |
| `POST /api/profile/extract` | Conversation → structured JSON profile (Gemini) |
| `POST /api/diagnostic/generate` | Generates quiz for a chosen skill |
| `POST /api/diagnostic/submit` | Scores quiz, writes `skill_evidence`, updates `observed_level` |
| `POST /api/skills/reconcile` | Deterministic: `final_estimate` + `confidence_score` |
| `POST /api/skills/evidence` | Full evidence provenance trail |
| `POST /api/skills/bottleneck` | Walks `skill_dependencies`, returns current bottleneck |
| `POST /api/recommend` | RAG + hybrid scoring, ranked resources with score breakdown |
| `POST /api/path/generate` | Topological sort + time-to-goal + batched LLM explanations |
| `POST /api/progress` | Logs event → Impact Evaluator → replan if threshold crossed |
| `POST /api/goal/change` | Recomputes gap vs new goal template, credits transferable skills |
| `POST /api/explain/compare` | "Why A not B" counterfactual |
| `POST /api/explain/trace` | Structured decision trace |
| `GET /api/path/history` | All path versions, for evolution timeline |
| `GET /api/dashboard` | Aggregates everything for the frontend |

---

## 10. Frontend pages & components

- `/` landing · `/onboarding` chat + quick replies · `/dashboard` main screen (goal, skill-gap bars, bottleneck callout, milestone timeline, time-to-goal, next best action, AI insight sentence, path evolution strip) · `/course/[id]` optional detail view.
- Shared: `ChatBubble`, `QuickReplyChips`, `SkillGapBars`, `BottleneckCallout`, `PathTimeline`, `PathEvolutionStrip`, `ResourceCard`, `ProgressToggle`, `DecisionTraceModal`.
- UI direction: calm education-product feel, soft neutral background, one accent color, generous whitespace, milestone timeline reads as a connected journey.

---

## 11. Testing plan

- Unit tests (Vitest/Jest): reconciliation formula, bottleneck score, topological sort, impact-evaluator threshold, "too hard" cause diagnosis.
- Prompt/schema tests: 5–10 sample conversations → profile extraction always returns valid schema JSON.
- API tests (Postman): every route, including malformed-input/missing-field failure modes.
- Integration test: 3 canned personas (complete beginner, career switcher, upskilling professional) before every demo rehearsal.
- Security/injection test: prompt injection must be refused and explained.
- Failure-mode test: both LLM providers unreachable → deterministic path generation still works.
- Manual QA: vague chat input, quick-reply rendering, dashboard at 0%/100% progress, replanning banner, no console errors.
- Benchmark for docs: 10 personas × goals — report Prerequisite validity % (target 100%), Adaptation correctness %, Precision@5.

---

## 12. Security

- All API keys server-side only, never `NEXT_PUBLIC_*`; `.env.local` gitignored.
- Supabase SSL by default; Row Level Security on all tables.
- Parameterized queries only, no raw string SQL.
- System prompts instruct LLM to ignore embedded override instructions; grounding layer means even a successful injection can't produce an unverified recommendation.
- Basic per-IP rate limiting on public routes.

---

## 13. The demo script (build this end-to-end FIRST)

1. Learner types free-text goal ("I want to become an ML engineer, I know Python but I'm weak in math"), answers a few quick-reply questions.
2. Diagnostic engine picks Python + Math to test, skips low-priority claimed skills.
3. Python quiz scored ~52% → estimated level 2.6/5, confidence 0.31 — flagged mismatch vs self-rated 5/5.
4. Bottleneck detector flags Linear Algebra — blocks ML and Deep Learning downstream.
5. Path v1 generated using reconciled estimate, under weekly hour budget; dashboard shows time-to-goal.
6. Learner asks for "Deep Learning" directly → system says **"Not ready yet"** with reason.
7. Learner marks an item "too hard" → adaptation engine diagnoses cause, inserts prerequisite, generates **path v2**, shown in the evolution strip with a reason banner.
8. Prompt-injection attempt → refused, explained.
9. Close on full dashboard.

---

## 14. Non-negotiable ground rules

1. No features beyond the 16 in Section 3.
2. Demo script (Section 13) gets built completely, end-to-end, before any polish.
3. Deterministic logic (reconciliation, gap, bottleneck, scoring, sorting, impact evaluation) is **never** delegated to an LLM.
4. One AI abstraction layer (`callAI()`), never scattered provider calls.
5. Free tier only: Gemini 2.5 Flash + Groq Llama 3.3 70B.
6. Supabase + Vercel. No AWS.
7. No LangChain/LangGraph.
8. Postman for API testing, Vitest/Jest for unit tests.
9. roadmap.sh content is an offline, one-time reference only — not a runtime dependency.
10. Onboarding uses hybrid input (free text + quick-reply chips).

---

## 15. Current team structure (READ THIS if you are a teammate)

The original design assumed a 5-person team. **The actual execution team is 3 people**, plus one separate collaborator who contributes only a data-extraction task on the side.

### 15.1 The three builders

| Person | Strength | Owns |
|---|---|---|
| **Yash Khadgi** | Team lead, project setup, backend, strong AI understanding | Infra, integration, `callAI()`, Supabase, dashboard API, deployment, docs, demo — see `2_TEAM_ROLES.md` |
| **Rudrakshi** | Hands-on ML/AI, prior AI-project experience | The AI/ML intelligence core: diagnostics, reconciliation, skill-gap, bottleneck, RAG + hybrid scoring, explainability — see `3_RUDRAKSHI_ROLE.md` |
| **Sameera** | Backend + fast "vibe coding," needs clear specs and review | Onboarding chat, path generation, adaptation/replanning — see `4_SAMEERA_ROLE.md` |

Full depth, file ownership, API-route ownership, and day-by-day plan for each are in the companion files listed above. Every builder is expected to use **Claude** (for reasoning, code review, and unblocking) and **Antigravity IDE** (for the actual agentic build/edit loop) — details in `2_TEAM_ROLES.md`.

### 15.2 Why this split (not the original 5-way split)

The original plan divided work into 5 near-equal slices. With 3 builders, the slices are recombined by *type of thinking* rather than split evenly by feature count:

- **Yash** = everything that is infrastructure/integration-shaped (must be right for everyone else to build on top of, and needs judgment/lead calls).
- **Rudrakshi** = everything that is genuinely AI/ML/algorithmic-shaped (the reconciliation math, the graph walk, the scoring — this is what wins the 20% "AI/ML Implementation" score and deserves someone with real ML instincts).
- **Sameera** = everything that is clearly-specified, build-to-spec backend/frontend work (this plan already fully specifies these pieces, which is exactly the situation where fast implementation shines — paired with review from Yash).

### 15.3 The 4th collaborator (data extraction only)

One additional person is separately scraping/curating the `developer-roadmap` GitHub repo (Section 4) into the three seed files: `learning_resources.json`, `goal_templates.json`, `skill_dependencies.json`.

**Rule: the 3-person build team does not block on this.** Whatever they deliver, whenever they deliver it, gets folded in if it's good and ready in time. If it never arrives, or arrives too late/low-quality, the team proceeds anyway — see the fallback plan below.

### 15.4 Fallback if the 4th person's data doesn't arrive in time

- Seeding is decoupled from all other work by design (Section 6.1, embeddings are precomputed independently).
- **Owner of the fallback: Rudrakshi** (already owns `skillGap`/`bottleneckDetection`/`hybridScoring`, which are the actual consumers of this data) writes a **small hand-built seed set** (30–50 `learning_resources`, 3–5 `goal_templates`, one `skill_dependencies` graph for 1–2 demo goals) early, in parallel — not after waiting. This unblocks the demo regardless of what arrives later.
- If the 4th person's full dataset (150–300 entries) arrives with enough time before submission, Rudrakshi swaps/merges it in and re-runs the seed script. If it arrives late or incomplete, the small hand-built set is what ships — it is enough to make the locked 16 features and the demo script work end-to-end, which matters more than dataset size for judging.

---

*This file is self-contained. A teammate or a fresh AI session should be able to understand the entire project, its architecture, and the current team structure from this file alone.*
