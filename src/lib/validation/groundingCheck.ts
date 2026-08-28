import { prisma } from '../prisma';

/**
 * Validates whether the given resource IDs actually exist in the database.
 * Prevents LLM hallucinations from breaking the frontend rendering.
 * 
 * @param resourceIds Array of resource IDs recommended by the LLM
 * @returns Array of resource IDs that are verified to exist
 */
export async function groundingCheck(resourceIds: string[]): Promise<string[]> {
  if (!resourceIds || resourceIds.length === 0) return [];

  try {
    const validResources = await prisma.learningResource.findMany({
      where: {
        id: {
          in: resourceIds,
        },
      },
      select: {
        id: true,
      },
    });

    return validResources.map((r) => r.id);
  } catch (error) {
    console.error('[GroundingCheck] Failed to verify resources against DB:', error);
    // In case of DB failure, we return empty to be safe (strict grounding)
    return [];
  }
}
