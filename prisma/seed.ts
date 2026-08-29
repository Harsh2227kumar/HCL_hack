import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import { config } from 'dotenv';
import { getResourceEmbedding } from '../src/lib/ai/embeddings';

// Load environment variables (.env.local or .env)
if (fs.existsSync('.env.local')) {
  config({ path: '.env.local' });
} else if (fs.existsSync('.env')) {
  config({ path: '.env' });
}

const prisma = new PrismaClient();

async function main() {
  console.log('========================================================');
  console.log('🚀 Starting Reproducible Database Seeding Process');
  console.log('========================================================');

  const dataDir = path.join(__dirname, '../data');

  // 1. Seed Goal Templates
  const goalTemplatesPath = path.join(dataDir, 'goal_templates.json');
  if (fs.existsSync(goalTemplatesPath)) {
    const rawGoals = fs.readFileSync(goalTemplatesPath, 'utf8');
    const goalTemplates = JSON.parse(rawGoals);
    console.log(`\n[1/3] Seeding ${goalTemplates.length} Goal Templates...`);

    for (const gt of goalTemplates) {
      await prisma.goalTemplate.upsert({
        where: { goalName: gt.goal_name || gt.goalName },
        update: {
          requiredSkills: gt.required_skills || gt.requiredSkills || [],
        },
        create: {
          goalName: gt.goal_name || gt.goalName,
          requiredSkills: gt.required_skills || gt.requiredSkills || [],
        },
      });
    }
    console.log('  ✓ Goal Templates seeded successfully.');
  }

  // 2. Seed Skill Dependencies
  const skillDepsPath = path.join(dataDir, 'skill_dependencies.json');
  if (fs.existsSync(skillDepsPath)) {
    const rawDeps = fs.readFileSync(skillDepsPath, 'utf8');
    const skillDependencies = JSON.parse(rawDeps);
    console.log(`\n[2/3] Seeding ${skillDependencies.length} Skill Dependencies...`);

    for (const sd of skillDependencies) {
      const skillName = sd.skill_name || sd.skillName;
      const dependsOnSkillName = sd.depends_on_skill_name || sd.dependsOnSkillName;
      await prisma.skillDependency.upsert({
        where: {
          skillName_dependsOnSkillName: {
            skillName,
            dependsOnSkillName,
          },
        },
        update: {},
        create: {
          skillName,
          dependsOnSkillName,
        },
      });
    }
    console.log('  ✓ Skill Dependencies seeded successfully.');
  }

  // 3. Seed Learning Resources
  const learningResourcesPath = path.join(dataDir, 'learning_resources.json');
  if (fs.existsSync(learningResourcesPath)) {
    const rawResources = fs.readFileSync(learningResourcesPath, 'utf8');
    const resources = JSON.parse(rawResources);
    console.log(`\n[3/3] Seeding ${resources.length} Learning Resources...`);

    let mappedDifficulty = 3;
    let seededCount = 0;
    let embeddingCount = 0;
    const hasApiKey = Boolean(process.env.GEMINI_API_KEY);

    for (const res of resources) {
      if (typeof res.difficulty === 'number') {
        mappedDifficulty = res.difficulty;
      } else {
        const d = String(res.difficulty).toLowerCase();
        if (d === 'beginner') mappedDifficulty = 2;
        else if (d === 'intermediate') mappedDifficulty = 3;
        else if (d === 'advanced') mappedDifficulty = 5;
        else mappedDifficulty = 3;
      }

      const durationHours = typeof res.duration_hours === 'number'
        ? res.duration_hours
        : typeof res.durationHours === 'number'
        ? res.durationHours
        : 5;

      const skillsTaught = res.skills_taught || res.skillsTaught || [];
      const prerequisiteSkills = res.prerequisite_skills || res.prerequisiteSkills || [];

      // Upsert base resource data first (guaranteed offline / without API keys)
      await prisma.learningResource.upsert({
        where: { id: res.id },
        update: {
          title: res.title,
          type: res.type || 'course',
          provider: res.provider || null,
          description: res.description || '',
          url: res.url || null,
          skillsTaught,
          prerequisiteSkills,
          difficulty: mappedDifficulty,
          durationHours,
          format: res.format || 'course',
        },
        create: {
          id: res.id,
          title: res.title,
          type: res.type || 'course',
          provider: res.provider || null,
          description: res.description || '',
          url: res.url || null,
          skillsTaught,
          prerequisiteSkills,
          difficulty: mappedDifficulty,
          durationHours,
          format: res.format || 'course',
        },
      });
      seededCount++;

      // Compute vector embeddings if GEMINI_API_KEY is configured
      if (hasApiKey) {
        try {
          const embedding = await getResourceEmbedding(res.title, res.description || '', skillsTaught);
          if (embedding && embedding.length === 768) {
            const vectorPayload = `[${embedding.join(',')}]`;
            await prisma.$executeRawUnsafe(
              `UPDATE "LearningResource" SET "embedding" = $1::vector WHERE id = $2`,
              vectorPayload,
              res.id
            );
            embeddingCount++;
          }
        } catch {
          // Gracefully continue without failing base seeding
        }
      }
    }

    console.log(`  ✓ ${seededCount} Learning Resources metadata seeded successfully.`);
    if (hasApiKey) {
      console.log(`  ✓ ${embeddingCount} pgvector 768-dim embeddings generated and stored.`);
    } else {
      console.log('  ℹ GEMINI_API_KEY not provided: pgvector embeddings skipped (base resources fully available).');
    }
  }

  console.log('\n========================================================');
  console.log('✨ Database Seeding Completed Successfully!');
  console.log('========================================================');
}

main()
  .catch((e: unknown) => {
    const errMsg = e instanceof Error ? e.message : String(e);
    console.error('❌ Error during seeding:', errMsg);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
