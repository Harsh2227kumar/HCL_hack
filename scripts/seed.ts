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
  
  console.log(`Seeding ${depsData.length} Skill Dependencies in batches...`);
  for (let i = 0; i < depsData.length; i += 2000) {
    const batch = depsData.slice(i, i + 2000);
    await prisma.skillDependency.createMany({
      data: batch.map((dep: any) => ({
        skillName: dep.skill,
        dependsOnSkillName: dep.dependsOn,
      })),
      skipDuplicates: true,
    });
  }
  console.log(`✅ Seeded ${depsData.length} Skill Dependencies`);

  // 3. Seed Learning Resources with Embeddings
  const resourcesRaw = fs.readFileSync(path.join(__dirname, '..', 'data', 'learning_resources.json'), 'utf-8');
  const resourcesData = JSON.parse(resourcesRaw);
  
  console.log(`Seeding ${resourcesData.length} Learning Resources in batches...`);
  const BATCH_SIZE = 500;
  
  for (let i = 0; i < resourcesData.length; i += BATCH_SIZE) {
    const batch = resourcesData.slice(i, i + BATCH_SIZE);
    
    const upserts = batch.map((res: any) => 
      prisma.learningResource.upsert({
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
      })
    );

    // Run batch of upserts in a single transaction
    await prisma.$transaction(upserts);

    // Progress logging
    console.log(`Seeded ${Math.min(i + BATCH_SIZE, resourcesData.length)}/${resourcesData.length} resources...`);
  }

  console.log(`\n=== Seed Summary ===`);
  console.log(`Goal Templates:     ${goalsData.length}`);
  console.log(`Skill Dependencies: ${depsData.length}`);
  console.log(`Learning Resources: ${resourcesData.length}`);
  console.log(`\nEmbeddings were intentionally skipped for performance.`);

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
