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

### 2026-08-28 — Yash
- What I built/changed: Completed Phase 0 (Supabase, schema.prisma, types/index.ts). Completed Phase 1 /api/dashboard route with Prisma singleton. Completed Phase 1 AI wiring (Gemini & Groq orchestration in callAI.ts).
- Files touched: `schema.prisma`, `.env.local`, `types/index.ts`, `src/lib/prisma.ts`, `src/app/api/dashboard/route.ts`, `src/lib/ai/gemini.ts`, `src/lib/ai/groq.ts`, `src/lib/ai/callAI.ts`
- Blocked on: Nothing, but API keys for Groq/Gemini seem to be throwing 401/403 errors when tested.
- Next up: Frontend Dashboard UI (`/dashboard/page.tsx`).

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
