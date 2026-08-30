const { PrismaClient } = require('@prisma/client');
const fetch = require('node-fetch');

const p = new PrismaClient();
const USER_ID = 'afaa9729-7880-402d-9b9f-60ff34e5985f';
const BASE_URL = 'http://localhost:3000'; // We'll bypass Next.js API and just do it in script

async function simulate() {
  console.log('Simulating onboarding for:', USER_ID);
  
  // 1. Profile Extract (Mocking the AI part)
  const goalTemplate = await p.goalTemplate.findFirst({
    where: { goalName: 'Machine Learning Engineer' }
  });
  
  await p.learnerProfile.upsert({
    where: { userId: USER_ID },
    update: { goal: 'Machine Learning Engineer', goalTemplateId: goalTemplate.id, weeklyHours: 15 },
    create: { userId: USER_ID, goal: 'Machine Learning Engineer', goalTemplateId: goalTemplate.id, weeklyHours: 15 }
  });

  // Mock skills (Beginner in ML, strong in Python, weak in Math)
  const skills = [
    { name: 'Python', level: 5 },
    { name: 'Mathematics Fundamentals', level: 2 },
    { name: 'Machine Learning', level: 1 }
  ];

  for (const s of skills) {
    await p.learnerSkill.upsert({
      where: { userId_skillName: { userId: USER_ID, skillName: s.name } },
      update: { selfRatedLevel: s.level, finalEstimate: s.level, targetLevel: 5 },
      create: { userId: USER_ID, skillName: s.name, selfRatedLevel: s.level, finalEstimate: s.level, targetLevel: 5 }
    });
  }

  // Use the API route handler directly for recommend & path generate (mocking NextRequest)
  // Wait, easiest is to use the core engines directly since I'm in Node
  const { calculateSkillGaps } = require('./src/lib/core/skillGap.ts');
  // Next.js TS imports won't work easily in plain Node without tsx. 
  // Let's just run tsx instead.
}

simulate().then(()=>p.$disconnect());
