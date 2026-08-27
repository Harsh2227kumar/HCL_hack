# Yash's Role — Team Lead / Platform & Integration
## Adaptive Learning Intelligence Engine — HCL Hackathon

> This file is yours. You already know the whole project, but keep this open anyway — it's your execution checklist, not just background. If you're handing a piece of your work to Claude or Antigravity mid-build, paste `1_MASTER_PLAN.md` first for full context, then the relevant section of this file as the exact spec.

---

## 1. Your one-line mandate

You own everything that has to exist *before* Rudrakshi and Sameera can build, and everything that requires a judgment call under time pressure rather than a fixed spec. You're also the only one reviewing everyone's PRs — which means you're the team's integration point, schema owner, and the person who ultimately answers "does this actually work end-to-end." Your work is invisible in the demo but it's the reason the demo runs at all.

---

## 2. Everything you own, grouped by what it does

### A. Setup & infra (do this first, day 1)
| File | What it does |
|---|---|
| Next.js 14 scaffold, Tailwind, shadcn/ui, ESLint/Prettier | The repo everyone builds inside |
| `prisma/schema.prisma` | Full DB schema from Master Plan §8 — push an **empty** schema to Supabase immediately, don't wait to perfect it. This single action unblocks both Rudrakshi and Sameera. |
| Supabase project creation | Postgres + pgvector + Auth |
| Vercel project + env vars | `.env.example` committed (no real secrets), `.env.local` gitignored |

**This is the literal critical path.** Nothing Rudrakshi or Sameera builds against a real table can start until this lands — announce the moment it's done.

### B. Shared AI abstraction
| File | What it does |
|---|---|
| `lib/ai/callAI.ts` | The retry/fallback/circuit-breaker shell (Master Plan §6.4–6.5) that every LLM call in the codebase goes through. **Ship a stub version day 1** — even one that returns canned JSON matching the expected schema — so Rudrakshi and Sameera can build against `callAI(role, prompt, schema)` immediately. Harden it with real Gemini/Groq provider routing once the stub is unblocking people. |
| `lib/supabase/client.ts` | Supabase client init + typed query helpers |
| `lib/validation/groundingCheck.ts` | The anti-hallucination gate — validates that any resource ID the LLM references actually exists in the DB before it's shown to the learner |

### C. Dashboard aggregation
| File | What it does |
|---|---|
| `GET /api/dashboard` | Pulls together profile + latest path + progress + bottleneck + time-to-goal into one payload |
| `src/app/dashboard/page.tsx` | The dashboard shell — wires goal, skill-gap bars, bottleneck callout, milestone timeline, time-to-goal, next best action, AI insight line, and path evolution strip together. Component internals (the individual cards) can be split with Sameera if time allows, but you own the assembly. |

### D. Integration & delivery
| File | What it does |
|---|---|
| PR review | Every PR from Rudrakshi and Sameera passes through you before merge — you're checking against the shared contracts in Section 4 below, not just code quality |
| `types/index.ts` | Shared TypeScript types — keep this consistent as both others' work lands |
| `tests/integration/fullFlow.test.ts` | The 3 canned personas run end-to-end (complete beginner, career switcher, upskilling professional) |
| Postman collection | Every API route in Master Plan §9, including malformed-input failure modes |
| `docs/README.md`, `docs/ARCHITECTURE.md` | Documentation deliverables |
| Vercel deploy | The working deployed URL deliverable |
| Demo video | Recording and script rehearsal against Master Plan §13 |
| 4th collaborator's dataset | You're the one who decides if/how the scraped `developer-roadmap` data gets merged in — though the actual swap-in is Rudrakshi's job per §15.4, since she owns the consuming code |

---

## 3. The non-negotiable rule for your entire slice

**Every LLM call site in the codebase goes through `callAI()` — no scattered provider calls.** If you catch yourself or a teammate reaching for `fetch()` directly against Gemini or Groq instead of going through the abstraction, stop and fix it before it merges. This is what makes the free-tier fallback (Gemini ↔ Groq) actually work when one provider is down, and it's the kind of thing that's invisible when it's right and very visible in a live demo when it's wrong.

---

## 4. Shared contracts you provide / depend on

- **You provide to everyone:** the Supabase schema itself (must exist before anyone writes a real query) and the `callAI(role, prompt, schema)` signature that Rudrakshi and Sameera plug their provider clients into. Get this right early — a signature change after both have built against it is the most expensive mistake on this team.
- **You depend on:** `learning_paths` + `learning_path_items` rows from Sameera (fully populated, ready to render) and the bottleneck/skill-gap/time-to-goal data from Rudrakshi — your `/api/dashboard` is the aggregation point for both.
- **Communication rule that protects this:** any change to `types/index.ts`, `schema.prisma`, or the `callAI()` signature gets flagged in team chat *before* editing, not after. A 3-person team working this tightly coupled doesn't have the isolation a 5-person split would — silent changes here are the single most likely source of merge pain.

---

## 5. Suggested day-by-day

**Day 1 AM:** Supabase schema pushed, repo scaffolded, `callAI()` stub live, `.env.example` committed — announce in team chat the moment this is done, it's what unblocks both teammates.

**Day 1 PM:** Review Rudrakshi's and Sameera's first PRs against the shared contracts (Section 4). Start real Gemini/Groq provider wiring inside `callAI()` so it's hardened before anyone depends on the stub in the final build.

**Day 2:** Build `/api/dashboard` + the dashboard frontend shell. Start integration-testing other people's routes as they land rather than waiting for everything to be done — catch contract drift early.

**Day 3:** Full `fullFlow.test.ts` run against the 3 demo personas. Deploy to Vercel. Write docs. Record the demo video and rehearse against Master Plan §13 — you're most likely presenting, so know the reconciliation and bottleneck logic well enough to field a judge's question even though Rudrakshi built it.

---

## 6. Working with Claude + Antigravity IDE

- **Claude** for architecture decisions, reviewing PRs/diffs from Rudrakshi and Sameera before merge, and debugging cross-cutting issues — schema mismatches, `callAI()` contract breaks, anything that spans more than one person's slice. This is the reasoning-heavy part of your role; don't skip straight to code when a design call is actually what's needed.
- **Antigravity IDE** as your main agentic driver for scaffolding: give it the exact schema/API contracts from `1_MASTER_PLAN.md` §8–9 as the spec, let it generate the boilerplate (routes, Supabase client, Prisma schema file), then review its output in Claude before accepting — don't accept generated boilerplate straight into a shared file without a second look, since everyone builds on top of it.
- Good prompt pattern for both tools: paste the relevant Master Plan section verbatim instead of describing it from memory — the plan is written to be copy-pasted directly as a spec, so use it that way.
- Since you're reviewing two other people's PRs, a useful Claude pattern is pasting a diff alongside the relevant shared contract from Section 4 and asking "does this honor the contract, and what breaks downstream if it doesn't" — faster than manually cross-checking every field.
