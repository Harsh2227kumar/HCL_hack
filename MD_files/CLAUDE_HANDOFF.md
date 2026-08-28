# Hackathon Project Status Report (For Tech Lead Review)

Hello Claude, you are acting as our Team Head / Tech Lead for the HCL Hackathon project: **Adaptive Learning Intelligence Engine**. 

We have completed the majority of our development (currently at 90% completion) and have merged all our individual branches into the `dev` branch. We are providing this comprehensive status report so you can review our architecture, understand exactly what each team member has built, and instruct us on the next critical steps to finalize the project.

---

## 1. Project Overview & Tech Stack
- **Framework:** Next.js 14 (App Router)
- **Database:** Supabase PostgreSQL with `pgvector` extension
- **ORM:** Prisma
- **Styling:** Tailwind CSS + shadcn/ui
- **AI Models:** Gemini (`gemini-2.5-flash`, `text-embedding-004`) and Groq (`llama3-8b-8192`)

---

## 2. The Data Engine (Real, NOT Hardcoded)

It is critical to note that **our recommendation engine and database are NOT hardcoded.** 
- **The Dataset:** We have a real JSON dataset (`data/learning_resources.json`) containing over 50 detailed learning resources (Python, Linear Algebra, Machine Learning, Data Science). 
- **The Seeding Process:** We wrote and ran `scripts/seedEmbeddings.ts`. This script successfully called Gemini's `text-embedding-004` API to generate a 768-dimensional vector array for every single resource, and injected them directly into our live Supabase `LearningResource` table. 
- **The Engine Math:** The engine uses actual mathematical algorithms to rank courses. It calculates Cosine Similarity against the user's vector, runs an exponential decay function (half-life of 30 days) in `reconciliation.ts`, and uses Kahn's Algorithm in `prerequisiteSort.ts` to topologically sort the courses into phases. **This is all dynamic, live logic, fully tested by 32 Vitest unit tests.**

---

## 3. Team Contributions (What we have built)

### Yash Khadgi (Phase 0 & Frontend Architecture)
- Set up the entire Next.js scaffold and configured the Prisma ORM with Supabase `pgvector`.
- Built the core AI Orchestration layer (`src/lib/ai/callAI.ts`). This is a robust fallback engine that tries Gemini first, falls back to Groq if it fails, and uses a hardcoded JSON mock template if both APIs fail.
- Developed the sleek, minimalist Dashboard UI layout (`/dashboard`) using Tailwind and shadcn/ui.
- Authored the `groundingCheck.ts` utility to ensure AI hallucinations are filtered out by doing a Prisma `findMany` lookup against the database.

### Rudrakshi (Core ML & Recommendation Engine)
- Created the core dataset and wrote the embedding seed script mentioned above.
- Built `src/lib/core/hybridScoring.ts`: Ranks resources using a combination of vector cosine similarity, difficulty matching, and time constraint logic.
- Built `src/lib/core/bottleneckDetection.ts` and `src/lib/core/reconciliation.ts`: Complex mathematical models for skill gap analysis and exponential decay of skill reliability.
- **Wrote 19 robust Vitest unit tests for the core ML math, all of which pass flawlessly.**

### Sameera (Topological Sorting & Onboarding UI)
- Developed `src/lib/core/prerequisiteSort.ts`: Implemented Kahn's Algorithm to topologically sort the recommended courses into 5 phases, including dynamic cycle-breaking logic by dropping the lowest-scoring edge.
- Built the Onboarding Chat interface (`/onboarding`), which Yash later upgraded into a premium Glassmorphism UI.
- Built the AI profile extraction flow. The chat UI asks 4 questions (Goal, Hours, Style, Experience) and uses `callAI` to synthesize a structured JSON profile.
- **Wrote 13 Vitest unit tests for the topological sort and impact evaluator, all passing flawlessly.**

---

## 4. The Current System Flow (Input / Output)

1. **Onboarding Extraction (`/onboarding`):** 
   - **Input:** User chats with the UI.
   - **Output:** A dynamically generated JSON profile.
     ```json
     {
       "goal": "Master Full Stack Web Development",
       "experienceLevel": "Intermediate",
       "weeklyHours": 10,
       "learningStyle": "Project-based"
     }
     ```
2. **Recommendation Pipeline (`/api/recommend`):**
   - **Input:** Takes the synthesized profile JSON from Onboarding.
   - **Process:** 
     1. Vectorizes the user's `goal` string into a 768-dim array using Gemini.
     2. Performs an `$executeRaw` query to `pgvector` for the top 20 semantic matches using Cosine Distance `<=>`.
     3. Filters and scores them via `hybridScoring`.
     4. Sorts them chronologically via Kahn's algorithm (`prerequisiteSort`).
   - **Output:** A structured array of learning resources divided into milestones (`SortedPathItem[]`).

---

## 5. Current Blockers, Bugs, and Errors

**Bug 1: LLM Text Generation is Failing (401/403 Errors)**
- *The Error:* In `src/lib/ai/callAI.ts`, our calls to Gemini (`gemini-2.5-flash`) return `403 Forbidden` and Groq returns `401 Invalid Key`. (Strangely, Gemini's `text-embedding-004` worked perfectly during the DB seed, so it's a specific issue with the text-generation endpoints or billing). 
- *Impact:* Real-time chat extraction is broken.
- *Band-Aid Solution:* Because the engine is not hardcoded, we didn't want the frontend to crash. Yash implemented a "Smart Mock Fallback" directly inside `src/app/onboarding/page.tsx`. If the API fails with the 401/403 error, the UI seamlessly simulates the chat. Instead of a hardcoded JSON, the fallback actually parses the user's clicks (e.g., if they click "2-5 hours", it extracts "5" and places it into the JSON profile). This allows us to record a flawless demo.

**Bug 2: The Dashboard is Disconnected from Onboarding (The Main Gap)**
- *The Error:* When onboarding finishes, the user clicks "Generate Adaptive Path" and is taken to `/dashboard`. However, the Dashboard is completely static. It currently does not receive the user's JSON profile from the Onboarding page, and it does not make a `fetch` call to `/api/recommend`.

---

## 6. Request for Tech Lead (Claude)

Claude, as our Team Head, please review our architecture and provide instructions on the following:

1. **Dashboard Integration Strategy:** What is the best way in Next.js App Router to pass the synthesized JSON profile from `/onboarding` to `/dashboard`? (e.g., URL parameters, `localStorage`, Zustand, or React Context). 
2. **Implementation Code:** Please provide the exact code snippets for the Frontend integration so we can connect `/dashboard/page.tsx` to `/api/recommend` and dynamically render the final milestone cards using the real output from the recommendation engine.
3. **API Key Strategy:** Given that our text-generation API keys are returning 401/403, should we stick to our smart mock fallback for the demo video, or is there a better way to handle this without live keys?

Please advise on our next steps.
