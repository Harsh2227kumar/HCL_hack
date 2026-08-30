import { PrismaClient } from '@prisma/client';
import { generateEmbedding } from '../src/lib/ai/embeddings';

const prisma = new PrismaClient();

async function main() {
  const goals = await prisma.goalTemplate.findMany();
  console.log(`Generating embeddings for ${goals.length} GoalTemplates...`);

  for (const goal of goals) {
    console.log(`Embedding: ${goal.goalName}`);
    try {
      const vector = await generateEmbedding(`Role: ${goal.goalName}. Required skills: ${JSON.stringify(goal.requiredSkills).substring(0, 500)}`);
      if (vector.length > 0) {
        const formattedVector = `[${vector.join(',')}]`;
        await prisma.$executeRawUnsafe(`UPDATE "GoalTemplate" SET embedding = '${formattedVector}'::vector WHERE id = '${goal.id}'`);
      }
      // slight delay to avoid rate limit
      await new Promise(r => setTimeout(r, 200));
    } catch (e: any) {
      console.error(`Failed to embed ${goal.goalName}:`, e.message);
    }
  }

  console.log('Done embedding GoalTemplates!');
}

main().catch(console.error).finally(() => prisma.$disconnect());
