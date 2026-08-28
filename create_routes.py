import os

routes = {
    "src/app/api/diagnostic/generate/route.ts": """import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { selectSkillsForDiagnostic, ClaimedSkill, SkillDependency } from '@/lib/core/diagnosticSelection';
import skillDependenciesData from '../../../../../data/skill_dependencies.json';
import { callAI } from '@/lib/ai/callAI';

const QuestionSchema = z.object({
  questions: z.array(z.object({
    question: z.string(),
    options: z.array(z.string()),
    correctAnswer: z.string(),
    explanation: z.string()
  }))
});

export async function POST(request: Request) {
  try {
    const { userId } = await request.json();
    if (!userId) return NextResponse.json({ error: 'userId is required' }, { status: 400 });

    const skills = await prisma.learnerSkill.findMany({ where: { userId } });
    if (!skills.length) return NextResponse.json({ error: 'No skills found' }, { status: 404 });

    const claimedSkills: ClaimedSkill[] = skills.map(s => ({
      skillName: s.skillName,
      selfRatedLevel: s.selfRatedLevel,
      confidenceScore: s.confidenceScore
    }));
    
    const dependencies: SkillDependency[] = (skillDependenciesData as any[]).map(d => ({
      skill_name: d.skill_name,
      depends_on_skill_name: d.depends_on_skill_name
    }));

    const selected = selectSkillsForDiagnostic(claimedSkills, dependencies, 1);
    if (!selected.length) return NextResponse.json({ questions: [] });

    const targetSkill = selected[0].skillName;
    const prompt = `Generate 5 multiple-choice questions to assess a learner's knowledge in "${targetSkill}". Include 4 options per question, the correct answer, and a short explanation.`;

    const aiRes = await callAI('understanding', prompt, QuestionSchema);
    
    if (Array.isArray(aiRes)) throw new Error('Expected structured data from callAI');

    return NextResponse.json({
      skillName: targetSkill,
      questions: aiRes.data.questions
    });

  } catch (error: any) {
    console.error('Error generating diagnostic:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
""",
    "src/app/api/diagnostic/submit/route.ts": """import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { reconcileSkillEstimate, SkillEvidence } from '@/lib/core/reconciliation';

export async function POST(request: Request) {
  try {
    const { userId, skillName, score } = await request.json(); // score 0-5
    if (!userId || !skillName || typeof score !== 'number') {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
    }

    // 1. Create Evidence
    await prisma.skillEvidence.create({
      data: {
        userId,
        skillName,
        source: 'diagnostic',
        score,
        reliability: 0.7, // Diagnostic has high reliability
        recencyWeight: 1.0,
      }
    });

    // 2. Fetch all evidence and reconcile
    const allEvidence = await prisma.skillEvidence.findMany({
      where: { userId, skillName }
    });

    const evidenceRecords: SkillEvidence[] = allEvidence.map(e => ({
      score: e.score,
      reliability: e.reliability,
      source: e.source,
      timestamp: e.timestamp
    }));

    const reconciled = reconcileSkillEstimate(evidenceRecords);

    // 3. Update LearnerSkill
    const updatedSkill = await prisma.learnerSkill.update({
      where: { userId_skillName: { userId, skillName } },
      data: {
        finalEstimate: reconciled.final_estimate ?? score,
        confidenceScore: reconciled.confidence_score,
        observedLevel: Math.round(score),
        lastAssessed: new Date()
      }
    });

    return NextResponse.json({ success: true, updatedSkill });

  } catch (error: any) {
    console.error('Error submitting diagnostic:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
""",
    "src/app/api/skills/reconcile/route.ts": """import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { reconcileSkillEstimate, SkillEvidence } from '@/lib/core/reconciliation';

export async function POST(request: Request) {
  try {
    const { userId, skillName } = await request.json();
    if (!userId || !skillName) return NextResponse.json({ error: 'Missing inputs' }, { status: 400 });

    const allEvidence = await prisma.skillEvidence.findMany({
      where: { userId, skillName }
    });

    const evidenceRecords: SkillEvidence[] = allEvidence.map(e => ({
      score: e.score,
      reliability: e.reliability,
      source: e.source,
      timestamp: e.timestamp
    }));

    const reconciled = reconcileSkillEstimate(evidenceRecords);

    const updatedSkill = await prisma.learnerSkill.update({
      where: { userId_skillName: { userId, skillName } },
      data: {
        finalEstimate: reconciled.final_estimate ?? 0,
        confidenceScore: reconciled.confidence_score,
      }
    });

    return NextResponse.json({ success: true, updatedSkill });

  } catch (error: any) {
    console.error('Error reconciling skill:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
""",
    "src/app/api/skills/evidence/route.ts": """import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const { userId, skillName, source, score, reliability, recencyWeight } = await request.json();
    if (!userId || !skillName || !source || score == null) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const evidence = await prisma.skillEvidence.create({
      data: {
        userId,
        skillName,
        source,
        score,
        reliability: reliability ?? 0.5,
        recencyWeight: recencyWeight ?? 1.0
      }
    });

    return NextResponse.json({ success: true, evidence });

  } catch (error: any) {
    console.error('Error adding evidence:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
""",
    "src/app/api/skills/bottleneck/route.ts": """import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { detectBottleneck, SkillMastery, SkillDependency } from '@/lib/core/bottleneckDetection';
import skillDependenciesData from '../../../../../data/skill_dependencies.json';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    if (!userId) return NextResponse.json({ error: 'userId is required' }, { status: 400 });

    const skills = await prisma.learnerSkill.findMany({ where: { userId } });
    
    const skillMasteries: SkillMastery[] = skills.map(s => ({
      skillName: s.skillName,
      pKnown: s.finalEstimate / 5
    }));

    const dependencies: SkillDependency[] = (skillDependenciesData as any[]).map(d => ({
      skill_name: d.skill_name,
      depends_on_skill_name: d.depends_on_skill_name
    }));

    const result = detectBottleneck(skillMasteries, dependencies);

    return NextResponse.json({ success: true, bottleneck: result });

  } catch (error: any) {
    console.error('Error detecting bottleneck:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
""",
    "src/app/api/explain/compare/route.ts": """import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { callAI } from '@/lib/ai/callAI';

const CompareSchema = z.object({
  explanation: z.string()
});

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const idA = searchParams.get('resourceIdA');
    const idB = searchParams.get('resourceIdB');

    if (!idA || !idB) return NextResponse.json({ error: 'Missing resource IDs' }, { status: 400 });

    const [resA, resB] = await Promise.all([
      prisma.learningResource.findUnique({ where: { id: idA } }),
      prisma.learningResource.findUnique({ where: { id: idB } })
    ]);

    if (!resA || !resB) return NextResponse.json({ error: 'Resource not found' }, { status: 404 });

    const prompt = `Compare these two learning resources:
Resource A: "${resA.title}" - ${resA.description}
Resource B: "${resB.title}" - ${resB.description}
Explain briefly why a learner might choose A over B, or B over A based on their differences.`;

    const aiRes = await callAI('writing', prompt, CompareSchema);
    if (Array.isArray(aiRes)) throw new Error('Expected object from callAI');

    return NextResponse.json({ success: true, explanation: aiRes.data.explanation });

  } catch (error: any) {
    console.error('Error comparing resources:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
""",
    "src/app/api/explain/trace/route.ts": """import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { callAI } from '@/lib/ai/callAI';

const TraceSchema = z.object({
  traceExplanation: z.string()
});

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const pathId = searchParams.get('pathId');
    const resourceId = searchParams.get('resourceId');

    if (!pathId || !resourceId) return NextResponse.json({ error: 'Missing pathId or resourceId' }, { status: 400 });

    const pathItem = await prisma.learningPathItem.findUnique({
      where: { pathId_resourceId: { pathId, resourceId } },
      include: { resource: true }
    });

    if (!pathItem) return NextResponse.json({ error: 'Path item not found' }, { status: 404 });

    const prompt = `Trace why this resource was recommended:
Resource: "${pathItem.resource.title}"
Phase: ${pathItem.phase}, Position: ${pathItem.position}
Score Breakdown: ${JSON.stringify(pathItem.scoreBreakdown)}

Write a grounded 1-2 sentence explanation of why this was placed here for the learner.`;

    const aiRes = await callAI('writing', prompt, TraceSchema);
    if (Array.isArray(aiRes)) throw new Error('Expected object from callAI');

    return NextResponse.json({ success: true, traceExplanation: aiRes.data.traceExplanation });

  } catch (error: any) {
    console.error('Error tracing recommendation:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
"""
}

for filepath, content in routes.items():
    os.makedirs(os.path.dirname(filepath), exist_ok=True)
    with open(filepath, 'w') as f:
        f.write(content)
    print(f"Created {filepath}")

