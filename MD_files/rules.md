# Team Rules & Regulations — Adaptive Learning Intelligence Engine Hackathon

> **3-person team · 3-day build · Zero ambiguity policy**
> Team: **Yash** (Tech Lead / Architect), **Rudrakshi** (AI/ML + Diagnostics), **Sameera** (Learning Engine + Data)

---

## 1. Communication Rules

### 1.1 Shared-File Change Protocol
Before editing **any** of the following shared-contract files, you **must** flag it in the team chat FIRST:

| Shared File | Why it's sensitive |
|---|---|
| `src/types/index.ts` | All three slices depend on these type definitions |
| `prisma/schema.prisma` | DB shape — changes break migrations for everyone |
| `src/lib/ai/callAI.ts` (function signature) | Every API route calls this; signature change = breakage |
| `src/lib/validation/schemas.ts` | Validation contract shared across routes |
| `data/skill_dependencies.json` | Core data used by reconciliation, bottleneck, and path logic |

**Protocol:**
1. Post in team chat: `"HEADS UP: editing [filename] — reason: [reason]. ETA: [time]"`
2. Wait for acknowledgment from at least one other team member.
3. Make the change, then post: `"DONE: [filename] updated — please pull."`

### 1.2 General Communication
- Use the team chat (WhatsApp / Discord / agreed channel) for all coordination — no silent lone-wolf edits.
- If you're blocked for more than **30 minutes**, post in chat immediately — don't sit on it.
- Status updates: at least once per session, post what you're working on.
- If you're going AFK for more than 1 hour during build hours, say so.

---

## 2. Git Rules

### 2.1 Core Git Workflow
```
Pull → Code → Test locally → Update project_tracker.md → Commit → Push
```

**Never skip a step.**

### 2.2 Rules
1. **Pull before you push, always.** Run `git pull origin main` before starting any session.
2. **Never push directly to `main` if it breaks someone else's working code.** If unsure, use a feature branch and open a PR.
3. **Small, frequent commits over big monolithic ones.**
   - Good: `"feat: add skillGap calculation logic"` (one function)
   - Bad: `"added everything"` (four hours of untested code)
4. **Every PR must be reviewed by Yash before merge** (per team roles in `docs/2_TEAM_ROLES.md`). Yash is the final merge authority.
5. **Commit messages follow this format:**
   ```
   <type>: <short description>

   Types: feat | fix | refactor | data | docs | test | chore
   ```
6. **If you push broken code**, immediately post in team chat with what broke and a fix ETA.
7. **Do not rebase or force-push to `main`.** Ever.

### 2.3 Branch Strategy (if needed)
- `main` = always deployable / at minimum runnable
- Feature branches: `<name>/<feature>` e.g. `rudrakshi/diagnostic-selection`
- Merge into `main` via PR only (reviewed by Yash)

---

## 3. Pre-Push Checklist

Before **every** push to GitHub, complete this checklist:

- [ ] `git pull origin main` (resolve any conflicts locally)
- [ ] Code runs without crashing (`npm run dev` passes)
- [ ] **Update `MD_files/project_tracker.md`** with your entry (see format below)
- [ ] Commit message is descriptive and typed correctly
- [ ] You have NOT touched a shared-contract file without prior team-chat flagging

> ⚠️ **The project_tracker.md update happens BEFORE the push — not after.**

---

## 4. Personal Memory Files

Each team member has their own personal working-memory file inside `MD_files/`:

| File | Owner |
|---|---|
| `MD_files/memory_yash.md` | Yash |
| `MD_files/memory_rudrakshi.md` | Rudrakshi |
| `MD_files/memory_sameera.md` | Sameera |

**Rules for memory files:**
- These are **personal, not shared.** Do not read, edit, or commit your teammates' memory files.
- They are added to `.gitignore` via the pattern `MD_files/memory_*.md` — they will **never** be pushed to GitHub.
- Use your memory file as a running log for your AI assistant sessions (Claude / Antigravity / Cursor). Log: decisions made, things tried, what didn't work, context your AI needs to pick up next session.
- This means you never have to re-explain your context from scratch at the start of a new AI session — just paste your memory file.

---

## 5. Feature Scope Lock

**No new features beyond the locked 16 in the master plan.**

The 16 features are locked. There is no scope creep during a 3-day hackathon. If an idea comes up:
1. Note it somewhere personal.
2. Do NOT implement it during the build window.
3. Bring it up after the demo if the team wants to continue the project.

The locked 16 features are listed in `MD_files/prd.md`.

---

## 6. Non-Negotiable Technical Rules

### Deterministic Logic Is Never Delegated to an LLM

> *"Any logic that must produce the same output for the same input — scoring, sorting, prerequisite ordering, bottleneck detection, skill gap calculation — is implemented as deterministic TypeScript code. LLMs are used only for natural-language generation (explanations, recommendations prose, diagnostic questions). If it needs to be testable with `expect(fn(input)).toBe(output)`, it is NOT an LLM call."*

This rule is non-negotiable. It is carried verbatim from the master plan.

**Practically this means:**
- `hybridScoring.ts`, `prerequisiteSort.ts`, `bottleneckDetection.ts`, `skillGap.ts`, `reconciliation.ts`, `impactEvaluator.ts` → pure TypeScript functions, no LLM calls inside
- `callAI.ts` is only invoked for: profile extraction, diagnostic question generation, path explanation/comparison, recommendation prose

---

## 7. Code Quality Minimums

- No `any` types in TypeScript except as a last resort (comment why if used)
- Every API route must validate its request body using `src/lib/validation/schemas.ts`
- Every AI call goes through `src/lib/ai/callAI.ts` — no raw `fetch` to Gemini/Groq anywhere else
- If you add a new file, export it cleanly — no dead files sitting around

---

## 8. End-of-Day Sync

At the end of each build day:
1. Each person updates `project_tracker.md` with their final status.
2. Everyone pushes their working state (even if incomplete — use a WIP commit).
3. Quick team check-in: blockers for tomorrow, who needs what from whom.

---

*Last updated: 2026-08-27 | Owner: Yash (Tech Lead)*
