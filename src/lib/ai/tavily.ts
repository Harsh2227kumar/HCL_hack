/**
 * Server-side Tavily Search & Grounding Client
 * Used to retrieve fresh, authoritative engineering documentation and learning context.
 * 
 * SECURITY:
 * - Executes strictly in Node.js server runtime.
 * - TAVILY_API_KEY is read from process.env and never exposed to the client bundle.
 * - Handles offline/missing key gracefully without crashing.
 */

export interface TavilySearchResult {
  title: string;
  url: string;
  content: string;
  score?: number;
}

export interface TavilySearchResponse {
  query: string;
  results: TavilySearchResult[];
  responseTime?: number;
  provider: 'tavily' | 'fallback';
}

/**
 * Searches Tavily for grounded technical context matching the learner's goal and skill.
 * 
 * @param query Targeted search query constructed from canonical skill + goal context
 * @param maxResults Number of high-quality results to retrieve (default: 3)
 */
export async function searchTavily(
  query: string,
  maxResults: number = 3
): Promise<TavilySearchResponse> {
  const apiKey = process.env.TAVILY_API_KEY;

  if (!apiKey || apiKey.trim() === '' || apiKey.includes('<my key>')) {
    // Graceful fallback when Tavily key is not set
    return {
      query,
      results: [],
      provider: 'fallback'
    };
  }

  try {
    const response = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        api_key: apiKey,
        query,
        search_depth: 'basic',
        include_answer: false,
        include_raw_content: false,
        max_results: maxResults,
      }),
    });

    if (!response.ok) {
      console.warn(`[Tavily] Search API responded with status ${response.status}`);
      return {
        query,
        results: [],
        provider: 'fallback'
      };
    }

    const data = await response.json();
    const rawResults = Array.isArray(data.results) ? data.results : [];

    const results: TavilySearchResult[] = rawResults.map((r: { title?: string; url?: string; content?: string; score?: number }) => ({
      title: r.title || 'Official Documentation',
      url: r.url || '',
      content: r.content || '',
      score: typeof r.score === 'number' ? r.score : 0.85,
    }));

    return {
      query,
      results,
      responseTime: data.response_time,
      provider: 'tavily'
    };
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : String(error);
    console.warn('[Tavily] Failed to execute web grounding search:', errMsg);
    return {
      query,
      results: [],
      provider: 'fallback'
    };
  }
}
