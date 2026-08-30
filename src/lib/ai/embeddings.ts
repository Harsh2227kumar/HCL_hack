import { geminiClient } from './gemini';

const EMBEDDING_MODEL = 'gemini-embedding-001';

export async function generateEmbedding(text: string): Promise<number[]> {
  const response = await geminiClient.models.embedContent({
    model: EMBEDDING_MODEL,
    contents: text,
  });

  return response.embeddings?.[0]?.values || [];
}

export async function generateEmbeddings(texts: string[]): Promise<number[][]> {
  const results: number[][] = [];

  // Process in batches of 5 to avoid rate limits
  const batchSize = 5;
  for (let i = 0; i < texts.length; i += batchSize) {
    const batch = texts.slice(i, i + batchSize);
    const promises = batch.map(text =>
      geminiClient.models.embedContent({
        model: EMBEDDING_MODEL,
        contents: text,
      })
    );

    const responses = await Promise.all(promises);
    for (const resp of responses) {
      results.push(resp.embeddings?.[0]?.values || []);
    }

    // Small delay between batches to avoid rate limits
    if (i + batchSize < texts.length) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }

  return results;
}
