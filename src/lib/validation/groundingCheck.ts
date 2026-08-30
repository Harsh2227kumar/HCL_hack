import { PrismaClient } from '@prisma/client';

export async function groundingCheck(
  resourceIds: string[],
  prisma: PrismaClient
): Promise<{ valid: string[]; invalid: string[] }> {
  
  if (resourceIds.length === 0) {
    return { valid: [], invalid: [] };
  }

  const foundResources = await prisma.learningResource.findMany({
    where: {
      id: { in: resourceIds }
    },
    select: { id: true }
  });

  const foundSet = new Set(foundResources.map(r => r.id));
  
  const valid: string[] = [];
  const invalid: string[] = [];

  for (const id of resourceIds) {
    if (foundSet.has(id)) {
      valid.push(id);
    } else {
      invalid.push(id);
    }
  }

  return { valid, invalid };
}
