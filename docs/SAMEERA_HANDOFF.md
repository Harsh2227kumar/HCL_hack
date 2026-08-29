# Handoff to Sameera (Backend / Core Integration)

This document specifies the backend integration requirements for **Tavily Web Research & Grounding** and **Grounded Diagnostic Generation / Learning Notes**.

---

## 1. Required Backend Integration Summary

We have created the standalone server-side search helper in [`src/lib/ai/tavily.ts`](file:///Users/yashkhadgi/HCL_Hack/learning-path-recommender/src/lib/ai/tavily.ts).
To ground Gemini diagnostics and learning notes with live external engineering context, Sameera needs to connect this helper into the backend API routes.

---

## 2. Existing APIs Involved

1. `POST /api/diagnostic/generate` (Generates adaptive diagnostic questions for the target skill)
2. `POST /api/chat` (AI Academic Advisor conversational onboarding)
3. `POST /api/explain/trace` (Generates reasoning trace for recommended resources)

---

## 3. Proposed Request Fields

For `/api/diagnostic/generate`:
```typescript
interface DiagnosticGenerateRequest {
  userId: string;
  targetSkill?: string; // Optional: specify skill directly (otherwise resolved from BKT / required_skills)
  enableWebGrounding?: boolean; // Default: true (triggers Tavily research if TAVILY_API_KEY is present)
}
```

---

## 4. Proposed Response Fields

For `/api/diagnostic/generate`:
```typescript
interface DiagnosticGenerateResponse {
  skillName: string;
  questions: Array<{
    question: string;
    options: string[];
    correctAnswer: string;
    explanation: string;
    groundedContext?: string; // Concise snippet from retrieved research
  }>;
  groundingMetadata?: {
    provider: "tavily" | "gemini-internal" | "fallback";
    queryUsed?: string;
    sources?: Array<{
      title: string;
      url: string;
      snippet: string;
    }>;
  };
  provider: "gemini" | "groq" | "fallback";
}
```

---

## 5. Tavily Retrieval Contract

When generating diagnostic questions or learning notes:
1. Construct search query using canonical vocabulary from `data/skills.json` and `data/goal_templates.json`:
   - E.g., `"${targetSkill} official documentation core concepts engineering assessment ${goalName}"`
2. Call `searchTavily(query, 3)` from `src/lib/ai/tavily.ts`.
3. If results are returned (`provider === 'tavily'`), inject the retrieved snippets into Gemini's system prompt:
   ```
   EVIDENCE FROM CURRENT DOCUMENTATION:
   ${results.map(r => `Source: ${r.title} (${r.url})\n${r.content}`).join('\n\n')}

   Generate 3 diagnostic multiple-choice questions grounded in the above engineering facts.
   ```

---

## 6. Gemini Grounding & Learning Notes Contract

For learning notes or concept explanations:
- Gemini synthesizes the Tavily snippets into 3-bullet takeaway notes.
- Returned JSON schema must include:
  ```json
  {
    "summary": "...",
    "key_takeaways": ["...", "..."],
    "sources": [{ "title": "...", "url": "..." }]
  }
  ```

---

## 7. Fallback Behavior

- If `TAVILY_API_KEY` is missing or rate-limited:
  - System automatically uses internal Gemini generation without crashing (`groundingMetadata.provider = "gemini-internal"`).
- If Gemini/Groq are down:
  - System returns the structured goal-specific fallback question set with `provider = "fallback"` and `groundingMetadata.provider = "fallback"`.
- The frontend UI displays the exact status badge (`AI-generated diagnostic`, `Web-Grounded via Tavily`, or `Fallback diagnostic`) without faking claims.

---

## 8. Security Requirements

- `TAVILY_API_KEY` is accessed exclusively in Node.js server runtimes via `process.env.TAVILY_API_KEY`.
- Never expose `TAVILY_API_KEY` via `NEXT_PUBLIC_*` client variables.
- Never log raw API keys to console or response payloads.
- Do not commit `.env` or `.env.local` to git repositories.

---

## 9. Example Response Shape

```json
{
  "skillName": "Linear Algebra & PyTorch",
  "questions": [
    {
      "question": "What does Singular Value Decomposition (SVD) decompose in tensor optimization?",
      "options": [
        "Orthogonal rotation matrices (U, V) and singular values (Σ)",
        "Eigenvalues and eigenvectors for symmetric matrices only",
        "Gradient descent step vectors",
        "Sparse dot products"
      ],
      "correctAnswer": "Orthogonal rotation matrices (U, V) and singular values (Σ)",
      "explanation": "SVD factors any real matrix into U Σ V^T, fundamental for low-rank matrix decomposition.",
      "groundedContext": "PyTorch documentation on torch.linalg.svd decomposition."
    }
  ],
  "groundingMetadata": {
    "provider": "tavily",
    "queryUsed": "Linear Algebra & PyTorch official documentation tensor operations",
    "sources": [
      {
        "title": "PyTorch Linear Algebra Docs",
        "url": "https://pytorch.org/docs/stable/linalg.html",
        "snippet": "torch.linalg.svd computes the singular value decomposition of a matrix..."
      }
    ]
  },
  "provider": "gemini"
}
```

---

## 10. Exact UI Components Waiting for Integration

1. `src/app/onboarding/page.tsx` (`loadDiagnosticQuestions` consumes `groundingMetadata` and renders source pills).
2. `src/components/roadmap/NodeDetailDrawer.tsx` (`DecisionTraceCard` displays grounding citations when returned).
3. `src/app/course/[id]/page.tsx` (Displays external reference docs and verified skill outcomes).
