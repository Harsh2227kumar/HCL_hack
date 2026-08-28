"use client";

import React, { useState, useEffect } from 'react';
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
import { Sparkles, Target, AlertCircle, Clock, CheckCircle2, Zap, ArrowRight, Loader2, RefreshCw } from 'lucide-react';

export default function DashboardPage() {
  const router = useRouter();
  const [roadmaps, setRoadmaps] = useState<RoadmapPath[]>(ROADMAPS);
  const [selectedRoadmap, setSelectedRoadmap] = useState<RoadmapPath>(ROADMAPS[0]);
  const [activeTab, setActiveTab] = useState<ActiveTab>('dag');
  const [selectedNode, setSelectedNode] = useState<RoadmapNode | null>(null);
  
  const [learnerProfile, setLearnerProfile] = useState<any>(null);
  const [activeRecommendation, setActiveRecommendation] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [provider, setProvider] = useState<string | null>(null);

  useEffect(() => {
    async function loadDashboardData() {
      setLoading(true);
      setError(null);

      const rawProfile = sessionStorage.getItem('learnerProfile');
      const rawRec = sessionStorage.getItem('activeRecommendation');
      const aiProv = sessionStorage.getItem('aiProvider');
      if (aiProv) setProvider(aiProv);

      let profileObj = null;
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
          const recObj = JSON.parse(rawRec);
          setActiveRecommendation(recObj);
          buildAndSetPersonalizedRoadmap(recObj, profileObj);
          setLoading(false);
          return;
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
            const recData = await res.json();
            setActiveRecommendation(recData);
            sessionStorage.setItem('activeRecommendation', JSON.stringify(recData));
            buildAndSetPersonalizedRoadmap(recData, profileObj);
            setLoading(false);
            return;
          } else {
            throw new Error(`Recommendation API responded with status ${res.status}`);
          }
        } catch (err: any) {
          console.warn("Failed to fetch live recommendation, falling back to static roadmap:", err.message);
          setError("Personalized path generation timed out. Showing fallback curriculum.");
        }
      }

      // 3. Fallback: select static roadmap matching keyword
      fallbackToStaticRoadmap(profileObj);
      setLoading(false);
    }

    loadDashboardData();
  }, []);

  const buildAndSetPersonalizedRoadmap = (recData: any, profile: any) => {
    const milestones = recData.activePath?.milestones || [];
    
    if (milestones.length === 0) {
      fallbackToStaticRoadmap(profile);
      return;
    }

    // Convert real backend recommendation milestones into DAG RoadmapNode objects
    const dynamicNodes: RoadmapNode[] = milestones.map((m: any, idx: number) => {
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
  };

  const fallbackToStaticRoadmap = (profile: any) => {
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
  };

  // Handle status toggle (Not Started, In Progress, Mastered)
  const handleToggleStatus = (nodeId: string, status: 'not-started' | 'in-progress' | 'mastered') => {
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

    // Record progress event to backend if user is authenticated
    const userId = sessionStorage.getItem('userId');
    if (userId) {
      fetch('/api/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          resourceId: nodeId,
          eventType: status === 'mastered' ? 'completed' : 'started'
        })
      }).catch(err => console.warn('Progress update logged locally:', err));
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
              <strong>AI Recommendation Trace:</strong> "{activeRecommendation.aiInsight}"
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
          />
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
          onClose={() => setSelectedNode(null)}
          onSelectNode={handleSelectNodeById}
          onToggleStatus={handleToggleStatus}
        />
      )}

      {/* Editorial Minimalist Footer */}
      <footer className="border-t border-[#1A1A1A]/15 bg-[#F8F7F4] py-3 px-4 sm:px-8 flex flex-col sm:flex-row justify-between items-center text-[10px] font-mono text-[#666] tracking-wider uppercase gap-2 shrink-0">
        <div className="flex items-center gap-3">
          <span>DEVELOPER ROADMAP TOPOLOGICAL RUNTIME</span>
          <span>•</span>
          <span>BASED ON KAMRANAHMEDSE/DEVELOPER-ROADMAP</span>
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
