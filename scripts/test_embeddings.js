require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { GoogleGenAI } = require('@google/genai');

const prisma = new PrismaClient();
const genai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function testSimilarity() {
  // Generate an embedding for a query
  const query = "I need to learn linear algebra for machine learning";
  const resp = await genai.models.embedContent({
    model: 'gemini-embedding-001',
    contents: query,
  });
  const queryVector = resp.embeddings[0].values;
  const formattedVector = `[${queryVector.join(',')}]`;

  // Use pgvector cosine similarity to find top 5 matching resources
  const results = await prisma.$queryRawUnsafe(`
    SELECT id, title, "skillsTaught", 
           1 - (embedding <=> '${formattedVector}'::vector) as similarity
    FROM "LearningResource" 
    WHERE embedding IS NOT NULL
    ORDER BY embedding <=> '${formattedVector}'::vector
    LIMIT 5
  `);

  console.log(`\nQuery: "${query}"\n`);
  console.log("Top 5 most similar resources:");
  console.log("─".repeat(80));
  for (const r of results) {
    console.log(`  ${(r.similarity * 100).toFixed(1)}%  ${r.title}`);
    console.log(`         Skills: ${r.skillsTaught.join(', ')}`);
  }

  // Test 2: A different query
  const query2 = "I want to build REST APIs with Node.js";
  const resp2 = await genai.models.embedContent({
    model: 'gemini-embedding-001',
    contents: query2,
  });
  const queryVector2 = resp2.embeddings[0].values;
  const formattedVector2 = `[${queryVector2.join(',')}]`;

  const results2 = await prisma.$queryRawUnsafe(`
    SELECT id, title, "skillsTaught", 
           1 - (embedding <=> '${formattedVector2}'::vector) as similarity
    FROM "LearningResource" 
    WHERE embedding IS NOT NULL
    ORDER BY embedding <=> '${formattedVector2}'::vector
    LIMIT 5
  `);

  console.log(`\n\nQuery: "${query2}"\n`);
  console.log("Top 5 most similar resources:");
  console.log("─".repeat(80));
  for (const r of results2) {
    console.log(`  ${(r.similarity * 100).toFixed(1)}%  ${r.title}`);
    console.log(`         Skills: ${r.skillsTaught.join(', ')}`);
  }

  // Test 3: deep learning query (should NOT surface unless prereqs met)
  const query3 = "teach me deep learning and neural networks";
  const resp3 = await genai.models.embedContent({
    model: 'gemini-embedding-001',
    contents: query3,
  });
  const queryVector3 = resp3.embeddings[0].values;
  const formattedVector3 = `[${queryVector3.join(',')}]`;

  const results3 = await prisma.$queryRawUnsafe(`
    SELECT id, title, "skillsTaught", "prerequisiteSkills",
           1 - (embedding <=> '${formattedVector3}'::vector) as similarity
    FROM "LearningResource" 
    WHERE embedding IS NOT NULL
    ORDER BY embedding <=> '${formattedVector3}'::vector
    LIMIT 5
  `);

  console.log(`\n\nQuery: "${query3}"\n`);
  console.log("Top 5 most similar resources:");
  console.log("─".repeat(80));
  for (const r of results3) {
    console.log(`  ${(r.similarity * 100).toFixed(1)}%  ${r.title}`);
    console.log(`         Skills: ${r.skillsTaught.join(', ')}`);
    console.log(`         Prereqs: ${r.prerequisiteSkills.join(', ') || 'none'}`);
  }

  await prisma.$disconnect();
}

testSimilarity().catch(console.error);
