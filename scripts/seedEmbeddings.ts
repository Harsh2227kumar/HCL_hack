import { prisma } from '../src/lib/prisma';
import { getResourceEmbedding } from '../src/lib/ai/embeddings';
import * as fs from 'fs';
import * as path from 'path';
import { config } from 'dotenv';

// Load variables from local environment file (falls back to .env if .env.local doesn't exist)
if (fs.existsSync('.env.local')) {
  config({ path: '.env.local' });
} else {
  config({ path: '.env' });
}

async function seed() {
  console.log("=== Starting Learning Resources Embedding Seeding ===");

  const filePath = path.join(__dirname, '../data/learning_resources.json');
  if (!fs.existsSync(filePath)) {
    throw new Error(`Data file not found at: ${filePath}`);
  }

  const rawData = fs.readFileSync(filePath, 'utf8');
  const resources = JSON.parse(rawData);
  console.log(`Loaded ${resources.length} resources from data/learning_resources.json`);

  for (const res of resources) {
    const title = res.title;
    const description = res.description || '';
    const skillsTaught = res.skills_taught || [];

    console.log(`\nProcessing: "${title}" (${res.id})`);
    try {
      // 1. Generate 768-dim vector embedding
      console.log(`-> Requesting embedding vector...`);
      const embedding = await getResourceEmbedding(title, description, skillsTaught);
      if (!embedding || embedding.length !== 768) {
        throw new Error(`Invalid embedding vector size: ${embedding?.length ?? 0}`);
      }

      // 2. Map complexity string to Prisma difficulty integer (1-5)
      let mappedDifficulty = 3;
      if (typeof res.difficulty === 'number') {
        mappedDifficulty = res.difficulty;
      } else {
        const d = String(res.difficulty).toLowerCase();
        if (d === 'beginner') mappedDifficulty = 2;
        else if (d === 'intermediate') mappedDifficulty = 3;
        else if (d === 'advanced') mappedDifficulty = 5;
      }

      const durationHours = res.duration_hours !== undefined ? res.duration_hours : 0;

      // 3. Upsert base fields to Supabase LearningResource model
      console.log(`-> Upserting base model to DB...`);
      await prisma.learningResource.upsert({
        where: { id: res.id },
        update: {
          title: res.title,
          type: res.type,
          provider: res.provider,
          description: res.description,
          url: res.url,
          skillsTaught: res.skills_taught,
          prerequisiteSkills: res.prerequisite_skills,
          difficulty: mappedDifficulty,
          durationHours: durationHours,
          format: res.format,
        },
        create: {
          id: res.id,
          title: res.title,
          type: res.type,
          provider: res.provider,
          description: res.description,
          url: res.url,
          skillsTaught: res.skills_taught,
          prerequisiteSkills: res.prerequisite_skills,
          difficulty: mappedDifficulty,
          durationHours: durationHours,
          format: res.format,
        },
      });

      // 4. Update pgvector unsupported vector(768) column via raw SQL execution
      console.log(`-> Injecting pgvector payload...`);
      const vectorPayload = `[${embedding.join(',')}]`;
      await prisma.$executeRawUnsafe(
        `UPDATE "LearningResource" SET "embedding" = $1::vector WHERE id = $2`,
        vectorPayload,
        res.id
      );

      console.log(`✓ Successfully seeded resource: ${res.id}`);
    } catch (e: any) {
      console.error(`✗ Failed to seed resource ${res.id}:`, e.message);
    }
  }

  console.log("\n=== Embedding Seeding Script Execution Complete ===");
}

seed()
  .catch((err) => {
    console.error("Embedding seed process failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
