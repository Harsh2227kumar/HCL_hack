import { PrismaClient } from '@prisma/client';
import fs from 'fs/path';
import path from 'path';
import { generateEmbedding } from '../src/lib/ai/embeddings';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting seed...');

  // 1. Seed Goal Templates
  const goalsData = require('../data/goal_templates.json');
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
  console.log('Seeded Goal Templates');

  // 2. Seed Skill Dependencies
  const depsData = require('../data/skill_dependencies.json');
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
  console.log('Seeded Skill Dependencies');

  // 3. Seed Learning Resources with Embeddings
  const resourcesData = require('../data/learning_resources.json');
  for (const res of resourcesData) {
    // Generate embedding based on title, description, and skills
    const textToEmbed = `${res.title}. ${res.description}. Teaches: ${res.skillsTaught.join(', ')}`;
    
    // Check if it exists to avoid re-embedding if we don't have to, but for simplicity let's just do it
    // Or we can query first
    const existing = await prisma.learningResource.findUnique({ where: { id: res.id } });
    
    let vector: number[] = [];
    if (!existing || !existing.embedding) {
      try {
         console.log(`Generating embedding for ${res.id}...`);
         vector = await generateEmbedding(textToEmbed);
      } catch (e) {
         console.error(`Failed to generate embedding for ${res.id}:`, e);
      }
    }

    const createdOrUpdated = await prisma.learningResource.upsert({
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

    if (vector.length > 0) {
      // Update embedding via raw SQL because Prisma doesn't natively support vector insertion nicely yet
      const formattedVector = `[${vector.join(',')}]`;
      await prisma.$executeRaw`
        UPDATE "LearningResource" 
        SET embedding = ${formattedVector}::vector
        WHERE id = ${res.id}
      `;
    }
  }
  console.log('Seeded Learning Resources');

  console.log('Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
