import { NextResponse } from 'next/server';
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
