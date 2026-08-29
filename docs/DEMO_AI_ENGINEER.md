# DEMO: AI Engineer / AI Engineering & Machine Learning
## HCL Amplified 2026 — Personalized Learning Path Recommender

> **Presenter Note:** This guide is for Yash Khadgi's branch demo. It documents the exact real-data flow. Do NOT hardcode or fabricate metrics — every value comes from the live application.

---

## 1. Goal Details

| Field | Value |
|---|---|
| **Goal ID** | `goal_ml_engineer` |
| **Goal Name** | `AI Engineering & Machine Learning` |
| **Required Skills** | 9 skills |
| **Min Level Target** | 3–5 (per-skill, on a 0–5 scale) |
| **Learning Resources** | 13 course/project resources |
| **Assessment Resources** | 8 assessment resources |

### Required Skills

| Skill | Min Level Required |
|---|---|
| Python | 5 |
| Linear Algebra | 4 |
| Calculus & Optimization | 3 |
| Statistics & Probability | 4 |
| Pandas & Data Processing | 4 |
| Machine Learning (Scikit-Learn) | 5 |
| Deep Learning & PyTorch | 4 |
| RAG & Vector Embeddings | 4 |
| LLM Agents & Tool Calling | 4 |

### Prerequisite Dependency Chain

```
Python
  └── Pandas & Data Processing
        └── Machine Learning (Scikit-Learn)  ←── Linear Algebra
                                              ←── Calculus & Optimization
                                              ←── Statistics & Probability
              └── Deep Learning & PyTorch
                    └── RAG & Vector Embeddings
                          └── LLM Agents & Tool Calling
```

### Available Learning Resources

| ID | Title | Type |
|---|---|---|
| res_ai_01 | Linear Algebra for Machine Learning — MIT 18.06 | course |
| res_ai_02 | Multivariable Calculus and Vector Fields — MIT 18.02 | course |
| res_ai_03 | Statistical Inference, Probability & Hypothesis Testing | course |
| res_ai_04 | Python for Data Science & Pandas High-Performance Processing | course |
| res_ai_05 | Machine Learning Specialization with Scikit-Learn | course |
| res_ai_06 | Deep Learning with PyTorch & Neural Networks from Scratch | course |
| res_ai_07 | Building Production RAG Systems with Vector Databases | project |
| res_ai_08 | Autonomous AI Agents with Tool Calling and Function Execution | project |
| res_ai_09 | Probability & Stochastic Processes for Machine Learning | course |
| res_ai_10 | Optimization Algorithms & Gradient Descent Methods | course |
| res_ai_11 | Advanced Pandas: Time Series & Large Dataset Operations | course |
| res_ai_12 | Practical ML Ops: Model Deployment & Monitoring | course |
| res_ai_13 | Hugging Face Transformers Masterclass | course |

### Available Assessment Resources

| ID | Title | Skill |
|---|---|---|
| res_eval_py_01 | HackerRank Python Skills Certification | Python |
| res_eval_ml_01 | Kaggle ML Competitions & Benchmark Evaluation | Machine Learning (Scikit-Learn) |
| res_eval_stats_01 | Khan Academy AP Statistics Unit Assessments | Statistics & Probability |
| res_eval_dl_01 | Kaggle Deep Learning & Computer Vision Assessment | Deep Learning & PyTorch |
| res_eval_rag_01 | DeepLearning.AI RAG Applications Assessment | RAG & Vector Embeddings |
| res_eval_pandas_01 | LeetCode Pandas Study Plan & Assessment Challenges | Pandas & Data Processing |
| res_eval_calc_01 | Khan Academy Multivariable Calculus Assessments | Calculus & Optimization |
| res_eval_la_01 | Khan Academy Linear Algebra Mastery Assessments | Linear Algebra |

---

## 2. Demo Story

> **Learner Profile:**
> Alex is an early-career software developer who knows Python basics. They want to become an AI Engineer working on production ML and LLM-powered systems. They have 8 hours per week to study and prefer hands-on project work.

Alex's journey: onboard with their Python background → receive a diagnostic on core ML prerequisites → get a personalized DAG roadmap from Python fundamentals through to LLM agents → track their skill gaps with BKT-powered confidence scores → follow curated resources from MIT OpenCourseWare, Kaggle, and DeepLearning.AI → and validate mastery through real skill assessments.

---

## 3. Demo Steps — Exact Sequence

### Step 1 — Open Application

1. Open `http://localhost:3000/onboarding`
2. Clear sessionStorage: Open DevTools → Application → Storage → Session Storage → Clear All
3. The AI Advisor will greet the learner

**Expected output:** A dynamic greeting message with quick-reply chips:
- "Full Stack Web Development"
- "AI Engineering & Machine Learning"  ← **Select this one**
- "Backend Systems & Architecture"
- "DevOps & Cloud Infrastructure"

---

### Step 2 — Select Target Goal

Click the quick reply chip:

> **"AI Engineering & Machine Learning"**

Or type a free-form message such as:

> "I want to become an AI Engineer. I know Python basics, I can study 8 hours per week, and I prefer hands-on projects."

**Expected output:** The AI Advisor responds and calls `/api/profile/extract`. Then it will prompt with a diagnostic question about your current skill level.

---

### Step 3 — Complete Diagnostic

The diagnostic flow will generate 3–5 questions from `/api/diagnostic/generate`.

**AI-Generated Diagnostic (if Gemini API key is set):**
- Questions will be specific to Python, Linear Algebra, and Statistics
- Each question has labeled difficulty
- Answers feed into BKT (Bayesian Knowledge Tracing)

**Fallback Diagnostic (if Gemini API unavailable):**
- Questions are drawn from the project's seeded fallback set
- Labeled clearly with badge: `[Fallback diagnostic]`
- Still feeds BKT scoring

**Demo Presenter Tip:** Answer 2 of 5 questions correctly to simulate a mid-level Python learner with known gaps in Statistics and Linear Algebra.

---

### Step 4 — View Skill-Gap Dashboard

After diagnostic submission, the app calls `/api/recommend`.

Navigate to `/dashboard`.

On the **Personalized AI Engineer Path** roadmap track (look for `personalized-engine-path` in the sidebar), the **Skill Gap & BKT Analysis** panel will appear showing:

```
Target Goal:  AI Engineering & Machine Learning
─────────────────────────────────────────────────
Skill         | CURRENT | TARGET | GAP   | CONFIDENCE
─────────────────────────────────────────────────
Python        | X.X/5.0 | 5.0/5.0 | Y.Y  | ZZ%
Statistics    | X.X/5.0 | 4.0/5.0 | Y.Y  | ZZ%
...
```

**Gap Classification:**
- 🔴 **Bottleneck** — the single most blocking skill (rose border)
- 🟡 **Large Gap** (≥ 2.5) — amber border
- 🔵 **Moderate Gap** (≥ 1.0) — blue border
- 🟢 **Small Gap** (< 1.0) — green border

**Important:** All numbers shown are real BKT-calculated values from the backend. Never hardcoded.

---

### Step 5 — Open Personalized Roadmap

In the left sidebar, click the **"Personalized AI Engineer Path"** roadmap.

The DAGVisualizer renders the AI engineer skill graph in topological order:

```
[Python Fundamentals]  [Linear Algebra]  [Calculus]  [Statistics]
          ↓                   ↓              ↓            ↓
    [Pandas & Data Processing]
          ↓                   ↑──────────────────────────┘
    [Machine Learning (Scikit-Learn)]
          ↓
    [Deep Learning & PyTorch]
          ↓
    [RAG & Vector Embeddings]
          ↓
    [LLM Agents & Tool Calling]
```

Nodes are color-coded:
- ✅ Green = Mastered
- 🔄 Amber = In Progress
- ⬜ Grey = Not Started

---

### Step 6 — Open Next Recommended Node

The recommended node (the skill with the highest priority gap) is visually prominent.

Click on it to open the **NodeDetailDrawer** on the right.

The drawer shows:
- Node title & level
- Prerequisites satisfied / missing
- Estimated hours
- Skills taught

---

### Step 7 — View Decision Trace

In the NodeDetailDrawer, the **Decision Trace: Why Recommended?** card shows:

```
Decision Trace: Why Recommended?
Selected Module: Machine Learning Specialization with Scikit-Learn
─────────────────────────────────────────────────────────────────
Recommended because it directly addresses your high-priority skill 
gaps and you possess strong foundational prerequisites for it.

Score Component Breakdown:
  Skill Gap Match      ████████░░ 78%
  Prerequisite Fit     ██████████ 95%
  Semantic Relevance   ███████░░░ 72%
  Difficulty Fit       ████████░░ 80%
  Time Budget Fit      █████████░ 88%
  Learning Style Fit   ███████░░░ 70%
```

**Important:** All scores are real `scoreBreakdown` values from backend hybrid scoring. No values are fabricated.

If the backend is in fallback mode, the badge reads:
> `Rule-Based Trace` (amber badge)

---

### Step 8 — View Learning Resource

Resources for each node are surfaced in the drawer. Each resource shows:

- **Title** (from database)
- **Provider** (real provider: "Kaggle", "MIT OCW", "DeepLearning.AI", etc.)
- **Type** (course / project / assessment)
- **Duration** in hours
- **Skills Taught**
- **Prerequisite Skills**

---

### Step 9 — View Assessment Resource

Scroll to a node that has an assessment. Assessment resources are visually distinct:

- **Purple border** (vs blue for courses)
- 🏆 **Award icon** badge
- **Subtitle**: "Skill Evaluation & Benchmarking"
- Real platform names (HackerRank, Kaggle, LeetCode, Khan Academy, DeepLearning.AI)

Example assessment visible in the AI engineer flow:
> **Kaggle Machine Learning Competitions & Benchmark Evaluation** → `res_eval_ml_01`

This is NOT a regular tutorial. It exists to evaluate mastery before marking the skill complete.

---

### Step 10 — Update Progress

In the NodeDetailDrawer at the bottom, use the **Status Switcher**:

```
[Not Started]  →  [In Progress]  →  [Mastered ✓]
                                  or
                              [Skip Node]  [Too Hard?]
```

Clicking any button calls POST `/api/progress` — this is real persistence, not UI state only.

The roadmap node's badge updates immediately.

---

## 4. Expected Evidence Per Step

| Step | What the Judge Should See |
|---|---|
| 1 | Welcome chat with AI career goal quick-replies |
| 2 | "AI Engineering & Machine Learning" selected, profile extracted |
| 3 | Real or fallback diagnostic with clear badge indicator |
| 4 | Skill-gap table with CURRENT / TARGET / GAP / CONFIDENCE per skill |
| 5 | DAG roadmap with prerequisite chain from Python → LLM Agents |
| 6 | Clicked node with details panel (prerequisite fit, hours, importance) |
| 7 | Decision trace with grounded score breakdown and explanation text |
| 8 | Resource card with real provider name, type, and duration |
| 9 | Assessment card with distinct purple styling and "Skill Evaluation" label |
| 10 | Progress state updating on the node after clicking a status button |

---

## 5. Fallback Mode

If Gemini API is unavailable (no `GEMINI_API_KEY` or quota exhausted), the app degrades gracefully:

| Component | Fallback Behavior |
|---|---|
| Onboarding Chat | Greets with static welcome message |
| Diagnostic | Serves seeded fallback questions, labeled `[Fallback diagnostic]` |
| Recommendations | Uses keyword + BKT scoring from seeded DB resources (no pgvector) |
| Decision Trace | Shows "Rule-Based Trace" amber badge instead of AI trace |

**How to recognize fallback mode:**
- Orange/amber `[Fallback diagnostic]` badge in the diagnostic step
- `Rule-Based Trace` badge in the Decision Trace card
- No "AI Insight" text in the recommendation summary

**Important:** Fallback mode is honest. The app never claims AI-generation when it isn't the case.

---

## 6. Judge Talking Points

These bullets are supported by the actual implementation:

1. **Personalized to target role** — Skill gap analysis maps the learner's current diagnostic scores against the exact `goal_ml_engineer` required skill levels in `data/goal_templates.json`

2. **Skill-gap driven** — BKT (Bayesian Knowledge Tracing) computes current, target, and gap values per skill; shown live in the SkillGapDashboard component

3. **Prerequisite-aware** — The DAGVisualizer renders the skill dependency graph from `data/skill_dependencies.json`, ensuring Python is learned before Pandas, and Pandas before ML

4. **Resource-grounded** — All 21 AI Engineer resources come from `data/learning_resources.json` (MIT OCW, Kaggle, HackerRank, DeepLearning.AI, LeetCode, Khan Academy)

5. **Explainable** — The DecisionTraceCard surfaces actual `scoreBreakdown` components (`skill_gap_match`, `prerequisite_fit`, `retrieval_similarity`, `difficulty_fit`, `time_fit`, `learning_style_fit`) with human-readable labels

6. **Progress-aware** — `Not Started → In Progress → Mastered` state transitions call the real `/api/progress` endpoint; BKT re-evaluates the skill model on each update

7. **Honest about limitations** — Fallback modes are explicitly labeled; the system never presents rule-based output as AI-generated

---

## 7. Backend Dependencies

> **Note to team:** The following capabilities require Sameera's backend to be live with a connected PostgreSQL database:

- BKT confidence values per skill (requires `learnerSkillLevel` table)
- Persistent progress updates (requires `learningPathItem` table)
- `/api/explain/trace` returning real `scoreBreakdown` (requires path item records)
- Semantic search-based resource retrieval (requires pgvector extension and embeddings)

**Without DB:** The application falls back to JSON-seeded keyword scoring for recommendations. All UI components still render with whatever data is returned — empty/null fields are handled gracefully with "Not available" labels.

---

## 8. Validation

Run before demo:

```bash
npm run validate:data   # Validates skill graph, resources, assessments
npx vitest run          # 60 unit/integration tests
npm run lint            # 0 warnings, 0 errors
npx next build --webpack  # Clean production build
```

All must pass before presenting.

---

*Last updated: 2026-08-29 — Yash Khadgi — DATA + VALIDATION + UI/DEMO branch*
