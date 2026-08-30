import { PrismaClient } from '@prisma/client';
import { GoogleGenAI } from '@google/genai';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

dotenv.config();

const prisma = new PrismaClient();
const genai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

const EMBEDDING_MODEL = 'gemini-embedding-001';

async function generateEmbedding(text: string): Promise<number[]> {
  const response = await genai.models.embedContent({
    model: EMBEDDING_MODEL,
    contents: text,
  });
  return response.embeddings?.[0]?.values || [];
}

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
  console.log('Starting seed...');

  // 1. Seed Goal Templates
  const goalsRaw = fs.readFileSync(path.join(__dirname, '..', 'data', 'goal_templates.json'), 'utf-8');
  const goalsData = JSON.parse(goalsRaw);
  for (const goal of goalsData) {
    await prisma.goalTemplate.upsert({
      where: { goalName: goal.goalName },
      update: { requiredSkills: goal.requiredSkills },
      create: {
        goalName: goal.goalName,
        requiredSkills: goal.requiredSkills,
      },
    });
  }
  console.log(`✅ Seeded ${goalsData.length} Goal Templates`);

  // 2. Seed Skill Dependencies
  const depsRaw = fs.readFileSync(path.join(__dirname, '..', 'data', 'skill_dependencies.json'), 'utf-8');
  const depsData = JSON.parse(depsRaw);
  for (const dep of depsData) {
    await prisma.skillDependency.upsert({
      where: {
        skillName_dependsOnSkillName: {
          skillName: dep.skill,
          dependsOnSkillName: dep.dependsOn,
        },
      },
      update: {},
      create: {
        skillName: dep.skill,
        dependsOnSkillName: dep.dependsOn,
      },
    });
  }
  console.log(`✅ Seeded ${depsData.length} Skill Dependencies`);

  // 3. Seed Learning Resources with Embeddings
  const resourcesRaw = fs.readFileSync(path.join(__dirname, '..', 'data', 'learning_resources.json'), 'utf-8');
  const resourcesData = JSON.parse(resourcesRaw);
  
  let successCount = 0;
  let failCount = 0;

  for (let i = 0; i < resourcesData.length; i++) {
    const res = resourcesData[i];
    
    // Upsert the resource data first
    await prisma.learningResource.upsert({
      where: { id: res.id },
      update: {
        title: res.title,
        type: res.type,
        provider: res.provider,
        description: res.description,
        url: res.url,
        skillsTaught: res.skillsTaught,
        prerequisiteSkills: res.prerequisiteSkills,
        difficulty: res.difficulty,
        durationHours: res.durationHours,
        format: res.format,
      },
      create: {
        id: res.id,
        title: res.title,
        type: res.type,
        provider: res.provider,
        description: res.description,
        url: res.url,
        skillsTaught: res.skillsTaught,
        prerequisiteSkills: res.prerequisiteSkills,
        difficulty: res.difficulty,
        durationHours: res.durationHours,
        format: res.format,
      },
    });

    // Generate embedding
    const textToEmbed = `${res.title}. ${res.description}. Teaches: ${res.skillsTaught.join(', ')}. Difficulty: ${res.difficulty}/5. Format: ${res.format || 'mixed'}`;
    
    try {
      console.log(`[${i + 1}/${resourcesData.length}] Generating embedding for ${res.id}...`);
      const vector = await generateEmbedding(textToEmbed);
      
      if (vector.length > 0) {
        const formattedVector = `[${vector.join(',')}]`;
        await prisma.$executeRawUnsafe(
          `UPDATE "LearningResource" SET embedding = '${formattedVector}'::vector WHERE id = '${res.id}'`
        );
        successCount++;
        console.log(`  ✅ ${res.id} — ${vector.length} dims`);
      } else {
        failCount++;
        console.log(`  ❌ ${res.id} — empty embedding returned`);
      }
    } catch (e: any) {
      failCount++;
      console.error(`  ❌ ${res.id} — ${e.message?.substring(0, 100)}`);
      
      // If rate limited, wait longer
      if (e.status === 429 || e.message?.includes('429')) {
        console.log('  ⏳ Rate limited, waiting 10s...');
        await sleep(10000);
        // Retry once
        try {
          const vector = await generateEmbedding(textToEmbed);
          if (vector.length > 0) {
            const formattedVector = `[${vector.join(',')}]`;
            await prisma.$executeRawUnsafe(
              `UPDATE "LearningResource" SET embedding = '${formattedVector}'::vector WHERE id = '${res.id}'`
            );
            successCount++;
            failCount--;
            console.log(`  ✅ ${res.id} — retry succeeded, ${vector.length} dims`);
          }
        } catch (retryErr: any) {
          console.error(`  ❌ ${res.id} — retry failed: ${retryErr.message?.substring(0, 100)}`);
        }
      }
    }

    // Throttle: wait between requests to avoid rate limits
    if (i < resourcesData.length - 1) {
      await sleep(300);
    }
  }

  console.log(`\n=== Seed Summary ===`);
  console.log(`Goal Templates:     ${goalsData.length}`);
  console.log(`Skill Dependencies: ${depsData.length}`);
  console.log(`Learning Resources: ${resourcesData.length}`);
  console.log(`Embeddings OK:      ${successCount}`);
  console.log(`Embeddings Failed:  ${failCount}`);
  
  if (failCount > 0) {
    console.log(`\n⚠️ Some embeddings failed. Re-run the seed to retry.`);
  } else {
    console.log(`\n🎉 All embeddings generated successfully!`);
  }

  // Verify embeddings
  const withEmbeddings = await prisma.$queryRawUnsafe<any[]>(
    `SELECT id FROM "LearningResource" WHERE embedding IS NOT NULL`
  );
  console.log(`\nVerification: ${withEmbeddings.length}/${resourcesData.length} resources have embeddings in DB`);

  console.log('\nSeed completed!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
