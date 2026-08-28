import { callAI } from './callAI';

/**
 * Generates a 768-dimensional embedding vector for a resource.
 * Concatenates the title, description, and skills taught into a single structured string.
 * 
 * @param title The title of the learning resource
 * @param description The description of the learning resource
 * @param skillsTaught The list of skills taught by the learning resource
 * @returns Promise<number[]> 768-dimensional embedding vector
 */
export async function getResourceEmbedding(
  title: string,
  description: string,
  skillsTaught: string[]
): Promise<number[]> {
  const combinedText = `Title: ${title}\nDescription: ${description}\nSkills: ${skillsTaught.join(', ')}`;
  return (await callAI<number[]>('embedding', combinedText)) as number[];
}

/**
 * Generates a 768-dimensional embedding vector for a generic query or goal text.
 * 
 * @param text The input query or goal text
 * @returns Promise<number[]> 768-dimensional embedding vector
 */
export async function getQueryEmbedding(text: string): Promise<number[]> {
  return (await callAI<number[]>('embedding', text)) as number[];
}
