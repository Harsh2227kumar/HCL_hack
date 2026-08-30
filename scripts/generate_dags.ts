import fs from 'fs';
import path from 'path';
import { PrismaClient } from '@prisma/client';
import { callAI } from '../src/lib/ai/callAI';
import { z } from 'zod';

const prisma = new PrismaClient();

const ROADMAPS_DIR = path.join(__dirname, '../data/roadmaps_data/roadmaps');
const DAG_PROMPT = `You are an expert curriculum designer. Given a list of topics for a specific developer roadmap, define the true prerequisite dependencies (Directed Acyclic Graph) between them.
Do NOT just assume a linear list. Some advanced topics require multiple foundational topics. Some topics can be learned in parallel.
Return an array of dependencies where 'skill' depends on 'dependsOn'.
Use EXACTLY the 'skill_id' strings provided in the input list.`;

const dagSchema = z.object({
  dependencies: z.array(z.object({
    skill: z.string(),
    dependsOn: z.string()
  }))
});

async function main() {
  console.log('Resuming DAG generation. Checking existing edges...');

  const files = fs.readdirSync(ROADMAPS_DIR).filter(f => f.endsWith('.json'));
  console.log(`Found ${files.length} roadmaps to process for DAG generation.`);

  for (const file of files) {
    const data = JSON.parse(fs.readFileSync(path.join(ROADMAPS_DIR, file), 'utf8'));
    
    // Check if we already processed this roadmap by seeing if any of its topics have dependencies
    const sampleTopic = data.topics[0]?.skill_id;
    if (sampleTopic) {
      const existing = await prisma.skillDependency.findFirst({
        where: {
          OR: [
            { skillName: sampleTopic },
            { dependsOnSkillName: sampleTopic }
          ]
        }
      });
      if (existing) {
        console.log(`Skipping ${data.roadmap} (already processed)...`);
        continue;
      }
    }

    console.log(`Processing roadmap: ${data.roadmap} (${data.topics.length} topics)`);

    // We can't send 200 topics with descriptions easily due to token limits, so just send IDs and titles
    const topicList = data.topics.map((t: any) => ({
      skill_id: t.skill_id,
      title: t.title
    }));

    const inputData = JSON.stringify(topicList, null, 2);

    try {
      const response = await callAI('understanding', `Roadmap: ${data.roadmap}\nTopics:\n${inputData}`, dagSchema, DAG_PROMPT);
      
      const edges = response.dependencies;
      console.log(`Generated ${edges.length} edges for ${data.roadmap}`);

      // Save to database directly
      let success = 0;
      for (const edge of edges) {
        try {
          await prisma.skillDependency.upsert({
            where: {
              skillName_dependsOnSkillName: {
                skillName: edge.skill,
                dependsOnSkillName: edge.dependsOn
              }
            },
            update: {},
            create: {
              skillName: edge.skill,
              dependsOnSkillName: edge.dependsOn
            }
          });
          success++;
        } catch (dbErr) {
          // Ignore unique constraint or other db errors
        }
      }
      console.log(`  Saved ${success} edges for ${data.roadmap}`);
    } catch (err: any) {
      console.error(`Failed to generate DAG for ${data.roadmap}:`, err.message);
    }

    // Wait 15 seconds between roadmaps to strictly respect the 8000 Tokens/Min rate limit
    console.log('Sleeping for 15s to avoid rate limits...');
    await new Promise(r => setTimeout(r, 15000));
  }

  console.log('Finished generating real DAGs for all roadmaps!');
}

main().catch(console.error).finally(() => prisma.$disconnect());
