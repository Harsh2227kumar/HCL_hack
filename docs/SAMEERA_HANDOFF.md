# Handoff to Sameera (Backend/Core)

This document summarizes the current state of the data, validation, and UI layers established on the `yash/features` branch, and outlines the integration contract for the backend.

## Yash Completed

* **Canonical skill vocabulary** (`data/skills.json`)
* **Resource coverage** (65 curated resources)
* **Assessment resources** (15 targeted assessments with distinct UI)
* **Data validation** (`validateLearningGraph.ts` script for integrity checks)
* **Canonical goal cleanup** (All goal templates now use canonical skill names)
* **Assessment validation** (Ensuring goals have matching assessments)
* **UI honesty/fallback clarity** (Explicit badges for rule-based and fallback states)
* **Skill-gap dashboard** (BKT current vs target skill visualization)
* **Decision trace** (Score breakdown and path explanations UI)
* **Resource comparison** (Side-by-side module comparison)
* **AI Engineer demo guide** (`docs/DEMO_AI_ENGINEER.md`)

## Current Data Contract

The JSON datasets in `data/` serve as the source of truth for all graph structure and UI rendering:

* **Canonical Skills**: 36 unique skills defined in `data/skills.json`.
* **Aliases**: 132 aliases mapped to canonical skills.
* **Goal Templates**: Found in `data/goal_templates.json`.
* **Resource Schema**: Defined in `data/learning_resources.json` (includes `skills_taught`, `prerequisite_skills`, `duration_hours`, etc.).
* **Assessment Resource Type**: Resources with `type: "assessment"` receive specialized "Skill Evaluation" styling.
* **Validation Command**: Run `npm run validate:data` after any modifications to the data files to ensure structural integrity.

## Sameera-Owned Integration

Sameera owns the backend logic that powers the UI. Do not modify the frontend/data logic to bypass these systems:

* Diagnostic backend (`/api/diagnostic/*`)
* Adaptive diagnostic logic
* BKT (Bayesian Knowledge Tracing) implementation
* Hybrid scoring engine
* Recommendation engine (`/api/recommend`)
* Prerequisite sorting and resolution
* Resource replacement and goal-change regeneration
* API routes (`src/app/api/*`)
* Prisma schema and database migrations (`prisma/`)
* Backend test suites (`tests/integration/`, `tests/unit/`)

## Important Integration Rules

* **Use Canonical Skill Names**: When logging progress, resolving dependencies, or updating BKT, always use the canonical skill names from `data/skills.json`.
* **Goal Templates**: Do not reintroduce alias names into `data/goal_templates.json`.
* **Assessment Resources**: Ensure new assessment resources use `type: "assessment"`.
* **Coordination**: Do not modify Yash UI/data components without coordination.
* **Validation**: Run `npm run validate:data` after any data changes.

## Known Warnings

The `npm run validate:data` script currently produces some expected warnings where certain goal skills lack dedicated assessment resources (e.g., `HTML & CSS`, `TypeScript`, `Next.js`). **These are warnings, not errors**, and do not block the build or demo.

## Final Verification (as of latest commit)

* `npm run validate:data` -> **PASS**
* `npx vitest run` -> **PASS (60/60 tests)**
* `npm run lint` -> **PASS (0 errors, 0 warnings)**
* `npx next build --webpack` -> **PASS (Compiled successfully)**
