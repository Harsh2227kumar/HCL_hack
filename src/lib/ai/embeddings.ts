import { geminiClient } from './gemini';

export async function generateEmbedding(text: string): Promise<number[]> {
  const response = await geminiClient.models.embedContent({
    model: 'text-embedding-004',
    contents: text,
  });
  
  return response.embeddings?.[0]?.values || [];
}

export async function generateEmbeddings(texts: string[]): Promise<number[][]> {
  // Batch embeddings if supported, or loop.
  // The GenAI SDK supports batchEmbedContents
  const requests = texts.map((text) => ({
    model: 'text-embedding-004',
    contents: text,
  }));
  
  const response = await geminiClient.models.batchEmbedContents({
    requests,
  });
  
  return response.embeddings?.map(e => e.values || []) || [];
}
