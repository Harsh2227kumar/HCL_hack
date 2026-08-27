# Product Requirements Document — Adaptive Learning Intelligence Engine
## 3-Day Hackathon Build Plan

> **Team:** Yash (Tech Lead / Architect) · Rudrakshi (AI/ML + Diagnostics) · Sameera (Learning Engine + Data)
> **Event:** HCL Hack 2026 · Duration: 3 days

---

## Product Overview

The **Adaptive Learning Intelligence Engine** is an AI-powered learning path recommender that:
- Ingests a user's background (resume/LinkedIn text), goals, and diagnostic quiz responses
- Builds a personalized, prerequisite-aware learning path from a curated resource library
- Continuously adapts the path based on progress, surfacing bottlenecks and skill gaps
- Explains every recommendation transparently (no black-box AI)

**Core principle:** The system is a *hybrid* — deterministic TypeScript handles all logic (scoring, sorting, gap analysis); LLMs handle only natural-language generation (explanations, question text, recommendation prose).

---

## Locked Feature List (16 Features — Scope-Locked, No Additions)

| # | Feature | Owner | API Route |
|---|---|---|---|
| F1 | Profile extraction from free-text (resume/LinkedIn) | Rudrakshi | `POST /api/profile/extract` |
| F2 | Diagnostic quiz generation (adaptive, goal-aware) | Rudrakshi | `POST /api/diagnostic/generate` |
| F3 | Diagnostic quiz submission & skill scoring | Rudrakshi | `POST /api/diagnostic/submit` |
| F4 | Skill reconciliation (profile + diagnostic → unified model) | Sameera | `POST /api/skills/reconcile` |
| F5 | Evidence recording for skill assessments | Sameera | `POST /api/skills/evidence` |
| F6 | Bottleneck detection in skill graph | Sameera | `GET /api/skills/bottleneck` |
| F7 | Hybrid resource scoring & recommendation | Sameera | `POST /api/recommend` |
| F8 | Prerequisite-aware learning path generation | Sameera | `POST /api/path/generate` |
| F9 | Path history & versioning | Yash | `GET /api/path/history` |
| F10 | Progress tracking & update | Yash | `POST /api/progress` |
| F11 | Goal change & path re-routing | Yash | `POST /api/goal/change` |
| F12 | Explanation: compare two resources | Yash | `GET /api/explain/compare` |
| F13 | Explanation: trace why resource was recommended | Yash | `GET /api/explain/trace` |
| F14 | Dashboard aggregation endpoint | Yash | `GET /api/dashboard` |
| F15 | Conversational AI chat assistant | Yash | `POST /api/chat` |
| F16 | Onboarding flow (UI) | Yash | `/onboarding` page |

---

## Non-Negotiable Ground Rules

1. **Deterministic logic is never delegated to an LLM.** Scoring, sorting, prerequisite ordering, bottleneck detection, skill gap calculation — all implemented as pure TypeScript. If it needs to be testable with `expect(fn(input)).toBe(output)`, it is NOT an LLM call.
2. **Every AI call goes through `src/lib/ai/callAI.ts`.** No raw fetch to Gemini/Groq anywhere else.
3. **Feature scope is locked at 16.** No new features during the build window.
4. **Every API route validates its request body** using `src/lib/validation/schemas.ts`.
5. **No `any` TypeScript types** without an explicit comment explaining why.
6. **The shared contract files** (`types/index.ts`, `schema.prisma`, `callAI.ts` signature) require team-chat flagging before editing.

---

## Phase 0 — Setup & Unblocking
**Goal:** Everyone can pull and run. Shared contracts are locked. No one is blocked.
**Duration target:** Day 1, Morning (first ~4 hours)

### Deliverables

| Deliverable | Owner | Done? |
|---|---|---|
| `prisma/schema.prisma` — full DB schema (users, skills, resources, paths, progress, diagnostics) | Yash | ☐ |
| `src/types/index.ts` — all shared TypeScript interfaces & types | Yash | ☐ |
| `src/lib/ai/callAI.ts` — stub with final function signature | Yash | ☐ |
| `src/lib/ai/gemini.ts` — Gemini client setup | Yash | ☐ |
| `src/lib/ai/groq.ts` — Groq client setup | Yash | ☐ |
| `data/skill_dependencies.json` — skill graph seed data | Yash / Sameera | ☐ |
| `data/learning_resources.json` — curated resource library | Sameera | ☐ |
| `data/goal_templates.json` — predefined goal templates | Sameera | ☐ |
| `.env.example` confirmed & `.env.local` filled by each member | All | ☐ |
| Supabase project created, DB migrated (`npx prisma db push`) | Yash | ☐ |
| `npm run dev` works for all three members | All | ☐ |

**Exit criteria for Phase 0:** All three members can run `npm run dev` without errors, and Yash has pushed `types/index.ts`, `callAI.ts` stub, and the Prisma schema.

---

## Phase 1 — Core Build (Owned Slices)
**Goal:** Each person builds their owned API routes and core logic independently.
**Duration target:** Day 1 Afternoon → Day 2 End

### Rudrakshi's Slice — AI/ML + Diagnostics

| Deliverable | Feature | Done? |
|---|---|---|
| `POST /api/profile/extract` | F1 — Parse free-text into structured profile | ☐ |
| `POST /api/diagnostic/generate` | F2 — Generate adaptive quiz questions via LLM | ☐ |
| `POST /api/diagnostic/submit` | F3 — Score answers, return skill assessments | ☐ |
| `src/lib/core/diagnosticSelection.ts` | Pure TS logic for question selection | ☐ |
| Unit tests: diagnosticSelection | | ☐ |

**Rudrakshi's dependencies on Yash's Phase 0:**
- `UserProfile` type from `types/index.ts`
- `callAI()` function signature from `callAI.ts`
- `DiagnosticQuestion`, `SkillAssessment` types

### Sameera's Slice — Learning Engine + Data

| Deliverable | Feature | Done? |
|---|---|---|
| `POST /api/skills/reconcile` | F4 — Merge profile + diagnostic into unified skill model | ☐ |
| `POST /api/skills/evidence` | F5 — Record skill evidence | ☐ |
| `GET /api/skills/bottleneck` | F6 — Detect bottleneck skills blocking the path | ☐ |
| `POST /api/recommend` | F7 — Score and rank resources | ☐ |
| `POST /api/path/generate` | F8 — Generate prerequisite-sorted learning path | ☐ |
| `src/lib/core/reconciliation.ts` | Pure TS skill reconciliation logic | ☐ |
| `src/lib/core/skillGap.ts` | Pure TS skill gap calculation | ☐ |
| `src/lib/core/bottleneckDetection.ts` | Pure TS bottleneck detection | ☐ |
| `src/lib/core/hybridScoring.ts` | Pure TS hybrid resource scoring | ☐ |
| `src/lib/core/prerequisiteSort.ts` | Pure TS topological sort for prerequisites | ☐ |
| Seed `data/learning_resources.json` with ≥20 real resources | | ☐ |
| Unit tests: hybridScoring, prerequisiteSort | | ☐ |

**Sameera's dependencies on Yash's Phase 0:**
- `SkillModel`, `Resource`, `LearningPath` types
- `data/skill_dependencies.json` seeded

### Yash's Slice — Architecture + Integration Routes

| Deliverable | Feature | Done? |
|---|---|---|
| `GET /api/path/history` | F9 — Retrieve user's path versions | ☐ |
| `POST /api/progress` | F10 — Update resource completion status | ☐ |
| `POST /api/goal/change` | F11 — Reroute path on goal change | ☐ |
| `GET /api/explain/compare` | F12 — LLM comparison of two resources | ☐ |
| `GET /api/explain/trace` | F13 — LLM explanation of why resource was recommended | ☐ |
| `GET /api/dashboard` | F14 — Aggregate dashboard data | ☐ |
| `POST /api/chat` | F15 — Conversational assistant | ☐ |
| `/onboarding` page (UI) | F16 — Onboarding flow | ☐ |
| `src/lib/core/impactEvaluator.ts` | Pure TS goal-change impact analysis | ☐ |
| `src/lib/supabase/client.ts` | Supabase client singleton | ☐ |
| `src/lib/validation/schemas.ts` | Zod schemas for all routes | ☐ |
| `src/lib/validation/groundingCheck.ts` | LLM output grounding/validation | ☐ |

---

## Phase 2 — Integration
**Goal:** Shared contracts wired together. Full happy-path flow works end-to-end.
**Duration target:** Day 3, Morning

### Integration Checklist

| Task | Owner | Done? |
|---|---|---|
| `fullFlow` integration test: onboard → profile → diagnostic → path | Yash | ☐ |
| Rudrakshi's routes consume `callAI.ts` correctly | Rudrakshi + Yash | ☐ |
| Sameera's routes consume `types/index.ts` correctly | Sameera + Yash | ☐ |
| Dashboard pulls live data from DB | Yash | ☐ |
| Onboarding UI calls `/api/profile/extract` + `/api/diagnostic/generate` | Yash + Rudrakshi | ☐ |
| `/api/goal/change` triggers path regeneration correctly | Yash + Sameera | ☐ |
| All API routes return consistent error shapes | All | ☐ |
| All `src/lib/core/*.ts` functions have unit tests passing | All | ☐ |
| Postman collection covers all 16 feature endpoints | Yash | ☐ |

**Exit criteria for Phase 2:** Running `curl` (or Postman) through the full flow from profile extract → path generate returns a valid, prerequisite-sorted learning path with no errors.

---

## Phase 3 — Polish, Deploy, Docs & Demo
**Goal:** Deployed, documented, demo-ready.
**Duration target:** Day 3, Afternoon → Evening

### Deliverables

| Deliverable | Owner | Done? |
|---|---|---|
| Deploy to Vercel (or agreed host) | Yash | ☐ |
| `docs/README.md` — project overview, setup instructions | Yash | ☐ |
| `docs/ARCHITECTURE.md` — system design, data flow diagrams | Yash | ☐ |
| `docs/EVALUATION.md` — evaluation criteria + results | All | ☐ |
| `docs/demo-script.md` — rehearsed demo script | All | ☐ |
| Demo video recorded (≤5 min) | All | ☐ |
| Final demo rehearsal (all 3 present) | All | ☐ |
| `MD_files/project_tracker.md` final entries for all | All | ☐ |

---

## Shared Contracts Reference

### Core Data Types (defined in `src/types/index.ts`)
- `UserProfile` — extracted from resume/LinkedIn text
- `SkillAssessment` — output of diagnostic quiz
- `SkillModel` — unified skill state (profile + diagnostic reconciled)
- `Resource` — a learning resource (video, article, course, etc.)
- `LearningPath` — ordered list of resources with prerequisites resolved
- `DiagnosticQuestion` — adaptive quiz question
- `ProgressUpdate` — resource completion event
- `GoalChangeRequest` — new goal + current state for re-routing

### Core Logic Modules (`src/lib/core/`)
| Module | What it does | Type |
|---|---|---|
| `reconciliation.ts` | Merges profile + diagnostic skill scores | Pure TS |
| `diagnosticSelection.ts` | Selects next question based on skill model | Pure TS |
| `skillGap.ts` | Calculates gap between current and target skill levels | Pure TS |
| `bottleneckDetection.ts` | Finds skills blocking the most path nodes | Pure TS |
| `hybridScoring.ts` | Scores resources using multiple signals | Pure TS |
| `prerequisiteSort.ts` | Topological sort on skill dependency graph | Pure TS |
| `impactEvaluator.ts` | Evaluates which resources to drop/add on goal change | Pure TS |

---

*Last updated: 2026-08-27 | Owner: Yash (Tech Lead)*
