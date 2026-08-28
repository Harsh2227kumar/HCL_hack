"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ArrowRight, CheckCircle2, Clock, Map, Target, AlertCircle, PlayCircle } from "lucide-react";

import { useRouter } from "next/navigation";

export default function DashboardPage() {
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [provider, setProvider] = useState<string | null>(null);

  useEffect(() => {
    async function fetchDashboard() {
      const raw = sessionStorage.getItem('learnerProfile');
      const aiProv = sessionStorage.getItem('aiProvider');
      if (aiProv) setProvider(aiProv);
      
      if (!raw) {
        router.replace('/onboarding');
        return;
      }
      
      const profile = JSON.parse(raw);
      
      try {
        // Strategy: try reading stored state first (returning user),
        // fall back to generation (first visit after onboarding).
        
        // 1. Try GET /api/dashboard — reads existing path from DB
        //    This is the fast, stable path for returning users.
        const userId = profile.userId || sessionStorage.getItem('userId');
        if (userId) {
          const dashRes = await fetch(`/api/dashboard?userId=${userId}`);
          if (dashRes.ok) {
            const dashJson = await dashRes.json();
            // Only use if there's an actual stored path
            if (dashJson.activePath) {
              setData(dashJson);
              setLoading(false);
              return;
            }
          }
          // 404 or no stored path → fall through to generation
        }

        // 2. Fall back to POST /api/recommend — generates a new path
        //    Used on first visit after onboarding when no path is stored yet.
        const res = await fetch("/api/recommend", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            goal: profile.goal,
            userId: userId || undefined,
            learnerContext: profile
          }),
        });
        
        if (!res.ok) {
          throw new Error("Failed to load adaptive path");
        }
        
        const json = await res.json();
        setData(json);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchDashboard();
  }, [router]);

  if (loading) {
    return <DashboardSkeleton />;
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-zinc-50 p-4">
        <div className="text-center space-y-4 max-w-md">
          <AlertCircle className="w-12 h-12 text-zinc-400 mx-auto" />
          <h2 className="text-xl font-semibold text-zinc-900">Setup Required</h2>
          <p className="text-zinc-500">{error}</p>
          <Button onClick={() => window.location.href = '/onboarding'} variant="default">
            Start Onboarding
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50/50 pb-20">
      {/* Header Banner */}
      <header className="bg-white border-b border-zinc-200 pt-16 pb-12 px-6 lg:px-12 mb-8">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 text-zinc-500 mb-2">
              <Target className="w-4 h-4" />
              <span className="text-sm font-medium tracking-wide uppercase">Current Goal</span>
              {provider && (
                <Badge variant="outline" className={`ml-2 text-[10px] uppercase tracking-wider ${
                  provider === 'mock' ? 'border-orange-200 text-orange-600 bg-orange-50' :
                  provider === 'gemini' ? 'border-blue-200 text-blue-600 bg-blue-50' :
                  'border-green-200 text-green-600 bg-green-50'
                }`}>
                  Powered by: {provider === 'mock' ? 'Offline Mode' : provider}
                </Badge>
              )}
            </div>
            <h1 className="text-3xl md:text-4xl font-semibold tracking-tight text-zinc-900">
              {data.goal}
            </h1>
          </div>
          <div className="flex flex-col md:text-right">
            <span className="text-sm text-zinc-500 font-medium">Estimated Time</span>
            <div className="flex items-center md:justify-end gap-2 text-zinc-900 font-semibold mt-1">
              <Clock className="w-5 h-5 text-zinc-400" />
              {data.timeToGoalWeeks ? `${data.timeToGoalWeeks} weeks left` : "Computing..."}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 lg:px-12 grid grid-cols-1 lg:grid-cols-12 gap-10">
        
        {/* Left Column: The Map (Timeline) */}
        <section className="lg:col-span-7 space-y-8">
          <div className="flex items-center gap-2 text-zinc-900 font-semibold mb-6">
            <Map className="w-5 h-5 text-zinc-400" />
            <h2>Your Journey Map</h2>
          </div>

          <div className="space-y-6 relative before:absolute before:inset-0 before:ml-4 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-zinc-200 before:to-transparent">
            {data.activePath?.milestones.map((item: any, idx: number) => {
              const isCompleted = item.status === 'completed';
              const isCurrent = item.status === 'pending' && (!data.activePath.milestones[idx - 1] || data.activePath.milestones[idx - 1].status === 'completed');
              
              return (
                <div key={item.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                  <div className={`flex items-center justify-center w-8 h-8 rounded-full border-2 bg-white shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-sm z-10 transition-colors
                    ${isCompleted ? 'border-zinc-900 bg-zinc-900 text-white' : isCurrent ? 'border-zinc-900 text-zinc-900' : 'border-zinc-200 text-zinc-300'}`}>
                    {isCompleted ? <CheckCircle2 className="w-4 h-4" /> : <span className="text-xs font-bold">{idx + 1}</span>}
                  </div>
                  <div className={`w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-xl border transition-all ${
                    isCurrent ? 'bg-white border-zinc-900 shadow-sm' : 'bg-transparent border-zinc-200 opacity-60 hover:opacity-100'
                  }`}>
                    <div className="flex items-center justify-between mb-2">
                      <Badge variant={isCurrent ? 'default' : 'secondary'} className={isCurrent ? 'bg-zinc-900' : 'bg-zinc-100 text-zinc-500'}>
                        {item.phase}
                      </Badge>
                      <span className="text-xs font-medium text-zinc-400">{item.resource.durationHours}h</span>
                    </div>
                    <h3 className={`font-semibold ${isCurrent ? 'text-zinc-900' : 'text-zinc-600'}`}>{item.resource.title}</h3>
                    {item.reason && (
                      <p className="text-sm text-zinc-500 mt-2 leading-relaxed">{item.reason}</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Right Column: Diagnostics & Action */}
        <section className="lg:col-span-5 space-y-8">
          
          {/* AI Insight Callout */}
          <div className="bg-zinc-900 text-zinc-50 p-6 rounded-2xl shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <Target className="w-24 h-24" />
            </div>
            <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-2">Intelligence engine</h3>
            <p className="text-zinc-100 text-lg leading-relaxed relative z-10">
              {data.aiInsight}
            </p>
          </div>

          {/* Next Best Action Card */}
          {data.nextBestAction && (
            <Card className="border-zinc-200 shadow-sm bg-white overflow-hidden">
              <div className="h-1 bg-zinc-900 w-full" />
              <CardHeader className="pb-4">
                <CardTitle className="text-xl">Next Up</CardTitle>
                <CardDescription>Ready to tackle your current bottleneck?</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="p-4 bg-zinc-50 rounded-lg border border-zinc-100 mb-6">
                  <h4 className="font-semibold text-zinc-900 mb-1">{data.nextBestAction.resource.title}</h4>
                  <div className="flex gap-3 text-sm text-zinc-500">
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3"/> {data.nextBestAction.resource.durationHours}h</span>
                    <span className="capitalize">{data.nextBestAction.resource.format}</span>
                  </div>
                </div>
                <Button className="w-full h-12 text-base font-medium flex items-center gap-2">
                  <PlayCircle className="w-5 h-5" />
                  Start Module
                </Button>
              </CardContent>
            </Card>
          )}

          <Separator className="bg-zinc-200" />

          {/* Skill Gaps */}
          <div>
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-semibold text-zinc-900 text-lg">Skill Gaps</h3>
              {data.bottleneck && (
                <Badge variant="secondary" className="bg-red-50 text-red-600 border border-red-100 shadow-sm">
                  Bottleneck: {data.bottleneck}
                </Badge>
              )}
            </div>
            <div className="space-y-6">
              {data.skillGaps.map((skill: any) => {
                const isBottleneck = skill.skillName === data.bottleneck;
                const percentage = (skill.current / 10) * 100;
                const targetPercentage = (skill.target / 10) * 100;
                
                return (
                  <div key={skill.skillName} className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className={`font-medium ${isBottleneck ? 'text-red-600' : 'text-zinc-700'}`}>
                        {skill.skillName}
                      </span>
                      <span className="text-zinc-400">
                        {skill.current.toFixed(1)} / {skill.target}
                      </span>
                    </div>
                    <div className="relative h-2 w-full bg-zinc-100 rounded-full overflow-hidden">
                      <div 
                        className={`absolute top-0 left-0 h-full rounded-full transition-all duration-1000 ${isBottleneck ? 'bg-red-500' : 'bg-zinc-900'}`}
                        style={{ width: `${percentage}%` }}
                      />
                      <div 
                        className="absolute top-0 bottom-0 w-0.5 bg-zinc-400 z-10"
                        style={{ left: `${targetPercentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

      </main>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="min-h-screen bg-zinc-50 pb-20 animate-pulse">
      <div className="bg-white border-b border-zinc-200 pt-16 pb-12 px-6 lg:px-12 mb-8">
        <div className="max-w-6xl mx-auto flex justify-between">
          <div className="space-y-4">
            <div className="w-24 h-4 bg-zinc-200 rounded" />
            <div className="w-64 md:w-96 h-10 bg-zinc-200 rounded" />
          </div>
          <div className="space-y-4 text-right">
            <div className="w-24 h-4 bg-zinc-200 rounded ml-auto" />
            <div className="w-32 h-6 bg-zinc-200 rounded ml-auto" />
          </div>
        </div>
      </div>
      <div className="max-w-6xl mx-auto px-6 lg:px-12 grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-7 space-y-8">
          <div className="w-48 h-6 bg-zinc-200 rounded mb-8" />
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="flex gap-4">
              <div className="w-8 h-8 rounded-full bg-zinc-200 shrink-0" />
              <div className="w-full h-32 bg-zinc-200 rounded-xl" />
            </div>
          ))}
        </div>
        <div className="lg:col-span-5 space-y-8">
          <div className="w-full h-40 bg-zinc-200 rounded-2xl" />
          <div className="w-full h-64 bg-zinc-200 rounded-xl" />
          <div className="space-y-6 pt-4 border-t border-zinc-200">
            <div className="w-32 h-6 bg-zinc-200 rounded" />
            {[1, 2, 3].map(i => (
              <div key={i} className="space-y-2">
                <div className="flex justify-between">
                  <div className="w-24 h-4 bg-zinc-200 rounded" />
                  <div className="w-12 h-4 bg-zinc-200 rounded" />
                </div>
                <div className="w-full h-2 bg-zinc-200 rounded-full" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
