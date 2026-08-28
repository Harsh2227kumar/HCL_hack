# Project Tracker — Adaptive Learning Intelligence Engine

> **⚠️ Update this BEFORE every push to GitHub, not after — so the team always knows real-time status.**

One entry per person per push. Add new entries at the **top** of the log (newest first).

**Format:**
```
### [YYYY-MM-DD] — [Name]
- What I built/changed:
- Files touched:
- Blocked on:
- Next up:
```

---

## Log
### 2026-08-28 — Sameera
- What I built/changed: Onboarding chat UI (ChatBubble, QuickReplyChips, ChatInput) with redesigned styling, /api/chat sequencing logic, /api/profile/extract (Gemini-based extraction), prerequisiteSort.ts + impactEvaluator.ts (deterministic, 13/13 unit tests passing), /api/path/generate, /api/path/history, /api/progress, /api/goal/change, ResourceCard.tsx, ProgressToggle.tsx, DecisionTraceModal.tsx (with fallback for missing /api/explain/trace)
- Files touched: src/app/onboarding/, src/components/chat/, src/components/resource/, src/lib/core/prerequisiteSort.ts, src/lib/core/impactEvaluator.ts, src/app/api/chat/, src/app/api/profile/extract/, src/app/api/path/, src/app/api/progress/, src/app/api/goal/, tests/unit/prerequisiteSort.test.ts, tests/unit/impactEvaluator.test.ts
- Blocked on: DB connection (P1001 — can't verify actual Prisma writes yet), prisma.config.ts version mismatch (prisma/config import needs Prisma 6, currently on 5.22.0)
- Next up: Verify end-to-end once DB connection is fixed, integration testing against Rudrakshi's real /api/recommend output once available

### 2026-08-28 — Yash
- What I built/changed: Completed Phase 0 (Supabase, schema.prisma, types/index.ts). Completed Phase 1 /api/dashboard route with Prisma singleton. Completed Phase 1 AI wiring (Gemini & Groq orchestration in callAI.ts). Built the minimalist Frontend Dashboard UI (`src/app/dashboard/page.tsx`) mapping to F10/F14 requirements using shadcn/ui. Merged Sameera's `onboarding-path-generation` branch into dev. Wrote `groundingCheck.ts` to prevent AI hallucinations. Ran `scripts/seedEmbeddings.ts` to populate Supabase with AI-generated vectors.
- Files touched: `schema.prisma`, `.env.local`, `types/index.ts`, `src/lib/prisma.ts`, `src/app/api/dashboard/route.ts`, `src/lib/ai/gemini.ts`, `src/lib/ai/groq.ts`, `src/lib/ai/callAI.ts`, `src/app/dashboard/page.tsx`, `components/ui/*`, `src/lib/validation/groundingCheck.ts`
- Blocked on: Nothing. All code is integrated on `dev`.
- Next up: Postman / Browser end-to-end testing, Vercel Deployment, and Demo Video.

---

### 2026-08-27 — Yash
- What I built/changed: Not started yet — initial repo scaffold complete
- Files touched: N/A
- Blocked on: Waiting for team to confirm setup and pull
- Next up: Phase 0 — schema.prisma, callAI.ts stub, types/index.ts base types

---

### 2026-08-27 — Rudrakshi
- What I built/changed: Not started yet
- Files touched: N/A
- Blocked on: Waiting for Phase 0 scaffold from Yash (types, callAI signature)
- Next up: Phase 1 — /api/profile/extract, /api/diagnostic/generate, /api/diagnostic/submit

---

### 2026-08-27 — Sameera
- What I built/changed: Not started yet
- Files touched: N/A
- Blocked on: Waiting for Phase 0 scaffold from Yash (types, skill_dependencies.json seed data)
- Next up: Phase 1 — /api/skills/reconcile, /api/skills/evidence, /api/recommend, /api/path/generate
