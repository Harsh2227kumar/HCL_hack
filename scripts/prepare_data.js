const fs = require('fs');
const path = require('path');

const ROADMAPS_DIR = path.join(__dirname, '../data/roadmaps_data/roadmaps');
const RESOURCES_FILE = path.join(__dirname, '../data/roadmaps_data/learning_resources_full.json');
const OUT_GOALS = path.join(__dirname, '../data/goal_templates.json');
const OUT_DEPS = path.join(__dirname, '../data/skill_dependencies.json');
const OUT_RESOURCES = path.join(__dirname, '../data/learning_resources.json');

function main() {
  const goalTemplates = [];
  const skillDependencies = [];
  const existingDeps = new Set(); // To avoid duplicates

  // Process all roadmaps
  const files = fs.readdirSync(ROADMAPS_DIR);
  for (const file of files) {
    if (!file.endsWith('.json')) continue;
    const data = JSON.parse(fs.readFileSync(path.join(ROADMAPS_DIR, file), 'utf8'));
    
    // 1. Goal Template
    const requiredSkills = data.topics.map(t => ({ skill: t.skill_id, min_level: 3 }));
    
    // GoalName should be human readable, e.g. "ai-engineer" -> "Ai Engineer"
    const goalName = data.roadmap.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    
    goalTemplates.push({
      goalName,
      requiredSkills
    });

    // 2. Skill Dependencies (Linear)
    for (let i = 1; i < data.topics.length; i++) {
      const prev = data.topics[i-1].skill_id;
      const curr = data.topics[i].skill_id;
      const key = `${curr}->${prev}`;
      if (!existingDeps.has(key)) {
        skillDependencies.push({
          skill: curr,
          dependsOn: prev
        });
        existingDeps.add(key);
      }
    }
  }

  // 3. Learning Resources
  // We need to map `learning_resources_full.json` to our `LearningResource` format.
  const rawResources = JSON.parse(fs.readFileSync(RESOURCES_FILE, 'utf8'));
  const learningResources = rawResources.map(r => ({
    id: r.resource_id,
    title: r.title,
    type: r.type,
    provider: 'Unknown',
    description: `A resource for ${r.skill_ids.join(', ')}`,
    url: r.source_url.replace('](', ''), // fixing broken URL string from python script
    skillsTaught: r.skill_ids,
    prerequisiteSkills: [],
    difficulty: 3,
    durationHours: 2,
    format: r.type === 'video' ? 'video' : 'article'
  }));

  fs.writeFileSync(OUT_GOALS, JSON.stringify(goalTemplates, null, 2));
  fs.writeFileSync(OUT_DEPS, JSON.stringify(skillDependencies, null, 2));
  fs.writeFileSync(OUT_RESOURCES, JSON.stringify(learningResources, null, 2));

  console.log(`Generated ${goalTemplates.length} goal templates`);
  console.log(`Generated ${skillDependencies.length} skill dependencies`);
  console.log(`Generated ${learningResources.length} learning resources`);
}

main();
