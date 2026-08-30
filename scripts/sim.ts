import { PrismaClient } from '@prisma/client';
import { calculateSkillGaps } from '../src/lib/core/skillGap';
import { scoreResources } from '../src/lib/core/hybridScoring';
import { generatePath } from '../src/lib/core/prerequisiteSort';
import { generateReasoningTrace } from '../src/lib/core/reasoningTrace';
import { calculatePathwayMetrics } from '../src/lib/core/onboardingMetrics';
import { generateEmbedding } from '../src/lib/ai/embeddings';

const p = new PrismaClient();
const USER_ID = 'afaa9729-7880-402d-9b9f-60ff34e5985f';

async function main() {
  console.log('1. Setting up profile...');
  let goalTemplate = await p.goalTemplate.findFirst({
    where: { goalName: { contains: 'Machine', mode: 'insensitive' } }
  });
  if (!goalTemplate) goalTemplate = await p.goalTemplate.findFirst();
  
  const profile = await p.learnerProfile.upsert({
    where: { userId: USER_ID },
    update: { goal: 'Machine Learning Engineer', goalTemplateId: goalTemplate?.id, weeklyHours: 15 },
    create: { userId: USER_ID, goal: 'Machine Learning Engineer', goalTemplateId: goalTemplate?.id, weeklyHours: 15 }
  });

  const skillsData = [
    { name: 'Python', level: 5 },
    { name: 'Mathematics Fundamentals', level: 2 },
    { name: 'Machine Learning', level: 1 }
  ];

  for (const s of skillsData) {
    await p.learnerSkill.upsert({
      where: { userId_skillName: { userId: USER_ID, skillName: s.name } },
      update: { selfRatedLevel: s.level, finalEstimate: s.level, targetLevel: 5, confidenceScore: 0.8 },
      create: { userId: USER_ID, skillName: s.name, selfRatedLevel: s.level, finalEstimate: s.level, targetLevel: 5, confidenceScore: 0.8 }
    });
  }

  const skills = await p.learnerSkill.findMany({ where: { userId: USER_ID } });
  
  console.log('2. Calculating Gaps...');
  const { gaps, readinessScore, matchedSkills, missingSkills } = calculateSkillGaps(skills as any, goalTemplate as any);
  
  console.log('3. Skip Embedding... (Using exact match for 20k resources)');
  const gapSkillsFormatted = gaps.map(g => `'${g.skillName.replace(/'/g, "''")}'`).join(',');

  console.log('4. Querying...');
  const rawResources = await p.$queryRawUnsafe<any[]>(`
    SELECT id, title, type, provider, description, url, "skillsTaught", "prerequisiteSkills", difficulty, "durationHours", format
    FROM "LearningResource"
    WHERE EXISTS (
      SELECT 1 
      FROM jsonb_array_elements_text("skillsTaught") as skill 
      WHERE skill IN (${gapSkillsFormatted})
    )
    LIMIT 100
  `);

  console.log('5. Scoring...');
  const scored = scoreResources(rawResources as any, skills as any, gaps, profile as any);

  console.log('6. Path Generation...');
  const deps = await p.skillDependency.findMany();
  const resourceMap = new Map(rawResources.map(c => [c.id, c]));
  const { phases, estimatedWeeksToGoal } = generatePath(scored, deps as any, 15, resourceMap as any);

  const trace = generateReasoningTrace(gaps, phases, resourceMap as any);
  const metrics = calculatePathwayMetrics(phases, readinessScore, 15, resourceMap as any);

  console.log('7. Saving...');
  await p.learningPath.deleteMany({ where: { userId: USER_ID } }); // clear old
  
  await p.learningPath.create({
    data: {
      userId: USER_ID,
      version: 1,
      triggerReason: 'initial',
      estimatedWeeksToGoal,
      items: {
        create: phases.flatMap(phase => 
          phase.items.map(item => ({
            resourceId: item.resourceId,
            phase: phase.phase,
            phaseName: phase.phaseName,
            position: item.position,
            status: 'pending',
            reason: trace.find(t => t.resourceSelected === resourceMap.get(item.resourceId)?.title)?.reason || 'Recommended',
          }))
        )
      }
    }
  });

  console.log('✅ Done! Run dashboard endpoint or script to fetch full dashboard JSON.');
  await p.$disconnect();
}

main().catch(e => console.error(e));
