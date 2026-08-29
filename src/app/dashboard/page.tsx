"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ROADMAPS, RoadmapPath, RoadmapNode } from '@/data/roadmapsData';
import { Header, ActiveTab } from '@/components/roadmap/Header';
import { DAGVisualizer } from '@/components/roadmap/DAGVisualizer';
import { KnowledgeGraph } from '@/components/roadmap/KnowledgeGraph';
import { RagVsOkfView } from '@/components/roadmap/RagVsOkfView';
import { VisualizationPlanView } from '@/components/roadmap/VisualizationPlanView';
import { SchemaEnricher } from '@/components/roadmap/SchemaEnricher';
import { TeamMatrixView } from '@/components/roadmap/TeamMatrixView';
import { PlaybookView } from '@/components/roadmap/PlaybookView';
import { DesignSystemView } from '@/components/roadmap/DesignSystemView';
import { NodeDetailDrawer } from '@/components/roadmap/NodeDetailDrawer';
import { AiAssistantModal } from '@/components/chat/AiAssistantModal';
import { Sparkles, AlertCircle, Loader2, Bot } from 'lucide-react';

interface LearnerProfile {
  userId?: string;
  goal?: string;
  weeklyHours?: number;
  learningStyle?: string;
  experienceLevel?: string;
}

interface MilestoneResource {
  title?: string;
  durationHours?: number;
  format?: string;
  skillsTaught?: string[];
  prerequisiteSkills?: string[];
}

interface MilestoneItem {
  id: string;
  title?: string;
  phase?: string;
  status?: string;
  reason?: string;
  resource?: MilestoneResource;
  score?: number;
  scoreBreakdown?: Record<string, number | undefined>;
  recommendation_status?: string;
}

interface RecommendationData {
  goal?: string;
  weeklyHours?: number;
  timeToGoalWeeks?: number;
  bottleneck?: string | null;
  aiInsight?: string;
  skillGaps?: Array<{
    skillName: string;
    current: number;
    target: number;
    gap: number;
    confidence?: number;
  }>;
  activePath?: {
    id?: string;
    version?: number;
    triggerReason?: string;
    generatedAt?: string | Date;
    milestones?: MilestoneItem[];
  };
  recommendations?: unknown[];
  reason?: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const [roadmaps, setRoadmaps] = useState<RoadmapPath[]>(ROADMAPS);
  const [selectedRoadmap, setSelectedRoadmap] = useState<RoadmapPath>(ROADMAPS[0]);
  const [activeTab, setActiveTab] = useState<ActiveTab>('dag');
  const [selectedNode, setSelectedNode] = useState<RoadmapNode | null>(null);
  
  const [learnerProfile, setLearnerProfile] = useState<LearnerProfile | null>(null);
  const [activeRecommendation, setActiveRecommendation] = useState<RecommendationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [provider, setProvider] = useState<string | null>(null);
  const [adaptationBanner, setAdaptationBanner] = useState<string | null>(null);
  const [apiWarning, setApiWarning] = useState<string | null>(null);
  const [aiModalOpen, setAiModalOpen] = useState(false);

  const fallbackToStaticRoadmap = useCallback((profile: LearnerProfile | null) => {
    const goalLower = (profile?.goal || '').toLowerCase();
    let matched = ROADMAPS[0];
    
    if (goalLower.includes('full') || goalLower.includes('stack') || goalLower.includes('web')) {
      matched = ROADMAPS.find(r => r.id === 'fullstack-engineer') || ROADMAPS[0];
    } else if (goalLower.includes('front') || goalLower.includes('react') || goalLower.includes('ui')) {
      matched = ROADMAPS.find(r => r.id === 'frontend-developer') || ROADMAPS[0];
    } else if (goalLower.includes('back') || goalLower.includes('system') || goalLower.includes('api')) {
      matched = ROADMAPS.find(r => r.id === 'backend-systems') || ROADMAPS[0];
    } else if (goalLower.includes('ai') || goalLower.includes('ml') || goalLower.includes('machine') || goalLower.includes('deep')) {
      matched = ROADMAPS.find(r => r.id === 'ai-ml-engineer') || ROADMAPS[0];
    } else if (goalLower.includes('devops') || goalLower.includes('cloud') || goalLower.includes('docker') || goalLower.includes('k8s')) {
      matched = ROADMAPS.find(r => r.id === 'devops-engineer') || ROADMAPS[0];
    } else if (goalLower.includes('sec') || goalLower.includes('cyber') || goalLower.includes('auth')) {
      matched = ROADMAPS.find(r => r.id === 'cyber-security') || ROADMAPS[0];
    } else if (goalLower.includes('data') || goalLower.includes('sql') || goalLower.includes('analyst')) {
      matched = ROADMAPS.find(r => r.id === 'cloud-data-architect') || ROADMAPS[0];
    } else if (goalLower.includes('python')) {
      matched = ROADMAPS.find(r => r.id === 'python-developer') || ROADMAPS[0];
    }

    setSelectedRoadmap(matched);
  }, []);

  const buildAndSetPersonalizedRoadmap = useCallback((recData: RecommendationData, profile: LearnerProfile | null) => {
    const milestones = recData.activePath?.milestones || [];
    
    if (milestones.length === 0) {
      setActiveRecommendation(null);
      fallbackToStaticRoadmap(profile);
      return;
    }

    // Convert real backend recommendation milestones into DAG RoadmapNode objects
    const dynamicNodes: RoadmapNode[] = milestones.map((m: MilestoneItem, idx: number) => {
      // Create dependency chain based on topological position
      const prereqs: string[] = [];
      if (idx > 0 && milestones[idx - 1]) {
        prereqs.push(milestones[idx - 1].id);
      }

      return {
        id: m.id || `node_${idx + 1}`,
        label: m.resource?.title || m.title || `Module ${idx + 1}`,
        category: m.phase || (idx === 0 ? 'Foundations' : idx < 3 ? 'Core Competency' : 'Applied Specialization'),
        level: m.phase === 'Foundations' ? 'Fundamentals' : m.phase === 'Core' ? 'Intermediate' : 'Advanced',
        prerequisites: prereqs,
        estimatedHours: m.resource?.durationHours || 10,
        importance: idx < 2 ? 'Required' : 'Recommended',
        description: m.reason || `Recommended based on your ${recData.goal || 'engineering'} goal and BKT skill gaps.`,
        keyTopics: [
          m.resource?.format ? `Format: ${m.resource.format.toUpperCase()}` : 'Curated Course Material',
          `Estimated: ${m.resource?.durationHours || 10} hours`,
          `Phase: ${m.phase || 'Foundations'}`,
          'Hands-on Lab Verification'
        ],
        teamApplication: `Crucial milestone in the personalized ${recData.goal || 'learning'} sequence.`,
        companyStandardStack: m.resource?.title || 'Production Engineering Standard',
        evaluationRubric: `Complete the ${m.resource?.title || 'module'} project challenge and verify all test assertions.`,
        status: m.status === 'completed' ? 'mastered' : m.status === 'started' ? 'in-progress' : 'not-started',
        sourceResourceId: m.id,
        scoreBreakdown: m.scoreBreakdown || {},
        skillsTaught: m.resource?.skillsTaught || [],
        prerequisiteSkills: m.resource?.prerequisiteSkills || [],
        reason: m.reason,
        recommendation_status: m.recommendation_status,
      };
    });

    const personalizedTrack: RoadmapPath = {
      id: 'personalized-engine-path',
      title: `${recData.goal || profile?.goal || 'Personalized Engine'} (Active Path)`,
      role: recData.goal || 'Software Engineer',
      category: 'Adaptive Recommendation Engine',
      description: recData.aiInsight || `Personalized path tailored for ${recData.weeklyHours || 10}h/week commitment.`,
      totalHours: dynamicNodes.reduce((acc, n) => acc + n.estimatedHours, 0),
      nodeCount: dynamicNodes.length,
      githubSource: 'engine/active-recommendation',
      nodes: dynamicNodes,
    };

    // Prepend personalized track as the first and active roadmap
    setRoadmaps([personalizedTrack, ...ROADMAPS]);
    setSelectedRoadmap(personalizedTrack);
  }, [fallbackToStaticRoadmap]);

  useEffect(() => {
    async function loadDashboardData() {
      setLoading(true);
      setError(null);

      const rawProfile = sessionStorage.getItem('learnerProfile');
      const rawRec = sessionStorage.getItem('activeRecommendation');
      const aiProv = sessionStorage.getItem('aiProvider');
      if (aiProv) setProvider(aiProv);

      let profileObj: LearnerProfile | null = null;
      if (rawProfile) {
        try {
          profileObj = JSON.parse(rawProfile);
          setLearnerProfile(profileObj);
        } catch (e) {
          console.error("Failed to parse learnerProfile:", e);
        }
      }

      // 1. Check if activeRecommendation exists in sessionStorage
      if (rawRec) {
        try {
          const recObj: RecommendationData = JSON.parse(rawRec);
          if (recObj.activePath?.milestones && recObj.activePath.milestones.length > 0) {
            setActiveRecommendation(recObj);
            buildAndSetPersonalizedRoadmap(recObj, profileObj);
            setLoading(false);
            return;
          } else {
            sessionStorage.removeItem('activeRecommendation');
            setActiveRecommendation(null);
            setError("Saved recommendation had no valid milestones. Showing fallback curriculum.");
          }
        } catch (e) {
          console.error("Failed to parse activeRecommendation:", e);
        }
      }

      // 2. If not in sessionStorage but profile exists, call /api/recommend
      if (profileObj) {
        try {
          const userId = sessionStorage.getItem('userId') || profileObj.userId;
          const res = await fetch('/api/recommend', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId: userId || undefined,
              goal: profileObj.goal || 'Full Stack Web Development',
              learnerContext: {
                weeklyHours: profileObj.weeklyHours || 10,
                learningStyle: profileObj.learningStyle || 'Interactive Coding',
                experienceLevel: profileObj.experienceLevel || 'Intermediate',
              },
            }),
          });

          if (res.ok) {
            const recData: RecommendationData = await res.json();
            if (recData.activePath?.milestones && recData.activePath.milestones.length > 0) {
              setActiveRecommendation(recData);
              sessionStorage.setItem('activeRecommendation', JSON.stringify(recData));
              buildAndSetPersonalizedRoadmap(recData, profileObj);
              setLoading(false);
              return;
            } else {
              sessionStorage.removeItem('activeRecommendation');
              setActiveRecommendation(null);
              throw new Error(recData.reason || "Recommendation returned no active path milestones.");
            }
          } else {
            throw new Error(`Recommendation API responded with status ${res.status}`);
          }
        } catch (err: unknown) {
          const errMsg = err instanceof Error ? err.message : String(err);
          console.warn("Failed to fetch live recommendation, falling back to static roadmap:", errMsg);
          setError("Personalized path generation returned no milestones. Showing fallback curriculum.");
        }
      }

      // 3. Fallback: select static roadmap matching keyword
      setActiveRecommendation(null);
      fallbackToStaticRoadmap(profileObj);
      setLoading(false);
    }

    loadDashboardData();
  }, [buildAndSetPersonalizedRoadmap, fallbackToStaticRoadmap]);

  // Handle status toggle (Not Started, In Progress, Mastered, Skip, Too Hard)
  const handleToggleStatus = (nodeId: string, status: 'not-started' | 'in-progress' | 'mastered' | 'too-hard' | 'skipped') => {
    setRoadmaps(prevRoadmaps => {
      return prevRoadmaps.map(r => {
        if (r.id === selectedRoadmap.id) {
          const updatedNodes = r.nodes.map(n => {
            if (n.id === nodeId) {
              return { ...n, status };
            }
            return n;
          });
          const updatedRoadmap = { ...r, nodes: updatedNodes };
          setSelectedRoadmap(updatedRoadmap);
          if (selectedNode && selectedNode.id === nodeId) {
            setSelectedNode({ ...selectedNode, status });
          }
          return updatedRoadmap;
        }
        return r;
      });
    });

    const isPersonalized = selectedRoadmap.id === 'personalized-engine-path';
    const targetNode = selectedRoadmap.nodes.find(n => n.id === nodeId);
    const sourceResourceId = targetNode?.sourceResourceId;

    const shouldSync = isPersonalized || !!sourceResourceId;

    if (shouldSync) {
      const userId = sessionStorage.getItem('userId') || learnerProfile?.userId;
      if (userId) {
        let eventType = 'started';
        if (status === 'mastered') eventType = 'completed';
        else if (status === 'too-hard') eventType = 'too_hard';
        else if (status === 'skipped') eventType = 'skipped';
        else if (status === 'in-progress') eventType = 'started';
        else if (status === 'not-started') eventType = 'started';

        fetch('/api/progress', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId,
            resourceId: sourceResourceId || nodeId,
            eventType
          })
        })
        .then(async (res) => {
          if (!res.ok) {
            throw new Error(`Progress API responded with status ${res.status}`);
          }
          const data = await res.json();
          if (data.replanned) {
            // Re-fetch the updated path/dashboard state from the database
            const dashRes = await fetch(`/api/dashboard?userId=${userId}`);
            if (dashRes.ok) {
              const recData = await dashRes.json();
              setActiveRecommendation(recData);
              sessionStorage.setItem('activeRecommendation', JSON.stringify(recData));
              buildAndSetPersonalizedRoadmap(recData, learnerProfile);
              setAdaptationBanner(data.adaptationReason || "Your learning path has been adapted based on your latest activity.");
              setApiWarning(null);
            } else {
              throw new Error(`Failed to load updated dashboard data (Status ${dashRes.status})`);
            }
          } else {
            // Not replanned, but since we updated status on DB LearningPathItem when replanned is false,
            // we should also update sessionStorage to make sure it matches if user refreshes.
            const storedRecRaw = sessionStorage.getItem('activeRecommendation');
            if (storedRecRaw) {
              try {
                const storedRec = JSON.parse(storedRecRaw);
                if (storedRec?.activePath?.milestones) {
                  storedRec.activePath.milestones = storedRec.activePath.milestones.map((m: MilestoneItem) => {
                    if (m.id === (sourceResourceId || nodeId)) {
                      return { ...m, status: status === 'mastered' ? 'completed' : status === 'too-hard' ? 'too-hard' : status === 'skipped' ? 'skipped' : status === 'in-progress' ? 'started' : 'pending' };
                    }
                    return m;
                  });
                  sessionStorage.setItem('activeRecommendation', JSON.stringify(storedRec));
                  setActiveRecommendation(storedRec);
                }
              } catch (err) {
                console.error("Failed to update cached milestones status:", err);
              }
            }
            setApiWarning(null);
          }
        })
        .catch(err => {
          console.warn('Progress update error:', err);
          setApiWarning(`Offline warning: Failed to sync status update to backend server. Event was cached locally.`);
        });
      }
    } else {
      console.warn(`Skipped backend progress sync for static fallback node: ${nodeId}`);
    }
  };

  // Handle node parameter update from Schema Enricher
  const handleUpdateNode = (updatedNode: RoadmapNode) => {
    setRoadmaps(prevRoadmaps => {
      return prevRoadmaps.map(r => {
        if (r.id === selectedRoadmap.id) {
          const updatedNodes = r.nodes.map(n => {
            if (n.id === updatedNode.id) {
              return updatedNode;
            }
            return n;
          });
          const updatedRoadmap = { ...r, nodes: updatedNodes };
          setSelectedRoadmap(updatedRoadmap);
          if (selectedNode && selectedNode.id === updatedNode.id) {
            setSelectedNode(updatedNode);
          }
          return updatedRoadmap;
        }
        return r;
      });
    });
  };

  // Select node by ID (for intra-drawer navigation)
  const handleSelectNodeById = (nodeId: string) => {
    const found = selectedRoadmap.nodes.find(n => n.id === nodeId);
    if (found) {
      setSelectedNode(found);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FDFCFB] flex flex-col items-center justify-center p-6 text-[#1A1A1A]">
        <div className="max-w-md w-full p-8 border border-[#1A1A1A]/15 bg-[#F8F7F4] rounded-2xl shadow-xl text-center space-y-4">
          <Loader2 className="w-10 h-10 animate-spin text-[#1A1A1A] mx-auto" />
          <h2 className="text-xl font-serif font-bold italic">Loading Personalized Curriculum...</h2>
          <p className="text-xs font-mono text-[#666]">
            Fetching Bayesian Knowledge Tracing scores, resolving prerequisite dependencies, and compiling topological DAG.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen h-full bg-[#FDFCFB] text-[#1A1A1A]">
      {/* Top Banner with User's Personalized Context */}
      {(activeRecommendation || learnerProfile) && (
        <div className="bg-[#1A1A1A] text-white px-4 sm:px-8 py-2.5 flex flex-wrap items-center justify-between text-xs font-mono tracking-wider border-b border-black">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 text-emerald-400 font-bold">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              {activeRecommendation ? 'ACTIVE RECOMMENDATION ENGINE' : 'ADAPTIVE PROFILE ACTIVE'}
            </span>
            <span className="text-[#888]">•</span>
            <span>GOAL: <strong className="text-white">{activeRecommendation?.goal || learnerProfile?.goal}</strong></span>
            <span className="hidden md:inline text-[#888]">•</span>
            <span className="hidden md:inline">
              EST. TIME: {activeRecommendation?.timeToGoalWeeks || 12} WEEKS ({activeRecommendation?.weeklyHours || learnerProfile?.weeklyHours || 10}H/WK)
            </span>
            {activeRecommendation?.bottleneck && (
              <>
                <span className="hidden lg:inline text-[#888]">•</span>
                <span className="hidden lg:inline text-amber-300 font-semibold">
                  BOTTLENECK: {activeRecommendation.bottleneck}
                </span>
              </>
            )}
          </div>
          <div className="flex items-center gap-3 mt-1 sm:mt-0">
            <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded text-zinc-300">
              AI: {provider || 'Gemini 2.5 Flash'}
            </span>
            <button
              onClick={() => router.push('/onboarding')}
              className="text-[11px] underline hover:text-emerald-400 transition-colors cursor-pointer"
            >
              Re-take Diagnostic / Change Goal
            </button>
          </div>
        </div>
      )}

      {/* AI Recommendation Insight Bar if active */}
      {activeRecommendation?.aiInsight && (
        <div className="bg-[#F8F7F4] border-b border-[#1A1A1A]/15 px-4 sm:px-8 py-3 flex items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-2.5">
            <Sparkles className="w-4 h-4 text-emerald-700 shrink-0" />
            <span className="font-serif italic text-sm text-[#222]">
              <strong>AI Recommendation Trace:</strong> &quot;{activeRecommendation.aiInsight}&quot;
            </span>
          </div>
          {activeRecommendation.bottleneck && (
            <span className="text-[11px] font-mono uppercase px-2.5 py-1 bg-amber-100 border border-amber-300 text-amber-900 font-bold shrink-0">
              ⚡ Bottleneck: {activeRecommendation.bottleneck}
            </span>
          )}
        </div>
      )}

      {/* Error notice if fallback was activated */}
      {error && (
        <div className="bg-amber-50 border-b border-amber-300 px-4 sm:px-8 py-2 text-xs font-mono text-amber-900 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-amber-700 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Editorial Masthead Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        selectedTrackTitle={selectedRoadmap.title}
      />

      {/* Main Tab Content Display */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        {activeTab === 'dag' && (
          <>
            {/* Engine Summary Panel / Fallback Banner */}
            {activeRecommendation ? (
              <div className="bg-[#E8F5E9] border-b border-[#2E7D32]/30 px-4 sm:px-8 py-3.5 text-xs font-mono text-[#1B5E20] flex flex-wrap gap-x-6 gap-y-2 items-center justify-between shadow-sm shrink-0">
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                  <span className="font-bold uppercase tracking-wider text-emerald-800 bg-emerald-200 px-2 py-0.5 rounded text-[10px] animate-pulse">
                    Generated by hybrid recommendation engine
                  </span>
                  <span><strong>Goal:</strong> {activeRecommendation.goal}</span>
                  <span><strong>Weekly Hours:</strong> {activeRecommendation.weeklyHours || 10}h/wk</span>
                  <span><strong>Est. Weeks:</strong> {activeRecommendation.timeToGoalWeeks || 12}</span>
                  <span><strong>Milestones Count:</strong> {activeRecommendation.activePath?.milestones?.length || 0}</span>
                  {activeRecommendation.bottleneck && (
                    <span className="text-[#B71C1C] font-semibold bg-red-100 px-1.5 py-0.5 rounded">
                      <strong>Bottleneck:</strong> {activeRecommendation.bottleneck}
                    </span>
                  )}
                </div>
                {activeRecommendation.activePath?.milestones && activeRecommendation.activePath.milestones.length > 0 && (
                  <div className="text-[11px] font-sans text-emerald-950 font-medium">
                    🎯 <strong>Next Best Action:</strong> {activeRecommendation.activePath.milestones[0].resource?.title || activeRecommendation.activePath.milestones[0].title || 'Start path'}
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-[#FFF8E1] border-b border-[#F57F17]/30 px-4 sm:px-8 py-2.5 text-xs font-mono text-[#F57F17] flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2">
                  <span className="font-bold uppercase bg-amber-200 text-amber-900 px-2 py-0.5 rounded text-[10px]">
                    Fallback static curriculum
                  </span>
                  <span>This curriculum is a standardized template. Take a diagnostic to generate a personalized learning path.</span>
                </div>
              </div>
            )}

            {adaptationBanner && (
              <div className="bg-indigo-50 border-b border-indigo-200 px-4 sm:px-8 py-3 text-xs font-mono text-indigo-900 flex items-center justify-between shrink-0 animate-in slide-in-from-top duration-300">
                <div className="flex items-center gap-2">
                  <span className="font-bold uppercase bg-indigo-100 text-indigo-900 border border-indigo-300 px-2 py-0.5 rounded text-[10px] flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-650" /> Path Adapted
                  </span>
                  <span>{adaptationBanner}</span>
                </div>
                <button
                  onClick={() => setAdaptationBanner(null)}
                  className="text-indigo-500 hover:text-indigo-800 font-bold ml-4 cursor-pointer"
                >
                  ✕
                </button>
              </div>
            )}

            {apiWarning && (
              <div className="bg-rose-50 border-b border-rose-200 px-4 sm:px-8 py-3 text-xs font-mono text-rose-950 flex items-center justify-between shrink-0 animate-in slide-in-from-top duration-300">
                <div className="flex items-center gap-2">
                  <span className="font-bold uppercase bg-rose-200 text-rose-900 px-2 py-0.5 rounded text-[10px] flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5 text-rose-700" /> Offline Mode
                  </span>
                  <span>{apiWarning}</span>
                </div>
                <button
                  onClick={() => setApiWarning(null)}
                  className="text-rose-500 hover:text-rose-800 font-bold ml-4 cursor-pointer"
                >
                  ✕
                </button>
              </div>
            )}

            <DAGVisualizer
              roadmaps={roadmaps}
              selectedRoadmap={selectedRoadmap}
              onSelectRoadmap={(r) => {
                setSelectedRoadmap(r);
                setSelectedNode(null);
              }}
              selectedNode={selectedNode}
              onSelectNode={setSelectedNode}
              onToggleStatus={handleToggleStatus}
              activeRecommendation={activeRecommendation || undefined}
            />
          </>
        )}

        {activeTab === 'knowledge-graph' && <KnowledgeGraph />}

        {activeTab === 'rag-vs-okf' && <RagVsOkfView />}

        {activeTab === 'visualization-plan' && <VisualizationPlanView />}

        {activeTab === 'schema-enricher' && (
          <SchemaEnricher
            roadmap={selectedRoadmap}
            onUpdateNode={handleUpdateNode}
          />
        )}

        {activeTab === 'team-matrix' && <TeamMatrixView />}

        {activeTab === 'playbook' && <PlaybookView />}

        {activeTab === 'design-system' && <DesignSystemView />}
      </main>

      {/* Node Inspector Drawer */}
      {selectedNode && (
        <NodeDetailDrawer
          node={selectedNode}
          roadmap={selectedRoadmap}
          pathId={activeRecommendation?.activePath?.id}
          userId={learnerProfile?.userId || undefined}
          onClose={() => setSelectedNode(null)}
          onSelectNode={handleSelectNodeById}
          onToggleStatus={handleToggleStatus}
        />
      )}

      {/* Floating AI Academic Advisor Launcher Button */}
      <button
        onClick={() => setAiModalOpen(true)}
        className="fixed bottom-6 right-6 z-40 px-4 py-3 bg-[#1A1A1A] hover:bg-black text-white rounded-full shadow-2xl border border-white/20 flex items-center gap-2.5 font-mono text-xs uppercase font-bold tracking-wider hover:scale-105 transition-all cursor-pointer group"
      >
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping group-hover:animate-none"></span>
        <Bot className="w-4 h-4 text-emerald-400" />
        <span>Ask AI Advisor</span>
      </button>

      {/* AI Assistant Modal */}
      <AiAssistantModal
        isOpen={aiModalOpen}
        onClose={() => setAiModalOpen(false)}
        currentGoal={activeRecommendation?.goal || learnerProfile?.goal || "AI Engineering & Machine Learning"}
        bottleneckSkill={activeRecommendation?.bottleneck}
        activeModuleTitle={selectedNode?.label}
      />

      {/* Editorial Minimalist Footer */}
      <footer className="border-t border-[#1A1A1A]/15 bg-[#F8F7F4] py-3 px-4 sm:px-8 flex flex-col sm:flex-row justify-between items-center text-[10px] font-mono text-[#666] tracking-wider uppercase gap-2 shrink-0">
        <div className="flex items-center gap-3">
          <span>DEVELOPER ROADMAP TOPOLOGICAL RUNTIME</span>
          <span>•</span>
          <span>SKILL ONTOLOGY ENGINE V2.4</span>
        </div>
        <div className="flex items-center gap-4">
          <span>DAG ENGINE V2.4</span>
          <span>•</span>
          <span className="text-[#1A1A1A] font-bold">
            {activeRecommendation ? 'ACTIVE RECOMMENDATION ENGINE CONNECTED' : 'HYBRID GRAPHRAG + OKF ACTIVE'}
          </span>
        </div>
      </footer>
    </div>
  );
}
