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

export default function DashboardPage() {
  const router = useRouter();
  const [roadmaps, setRoadmaps] = useState<RoadmapPath[]>(ROADMAPS);
  const [selectedRoadmap, setSelectedRoadmap] = useState<RoadmapPath>(ROADMAPS[0]);
  const [activeTab, setActiveTab] = useState<ActiveTab>('dag');
  const [selectedNode, setSelectedNode] = useState<RoadmapNode | null>(null);
  
  const [learnerProfile, setLearnerProfile] = useState<any>(null);
  const [provider, setProvider] = useState<string | null>(null);

  useEffect(() => {
    const raw = sessionStorage.getItem('learnerProfile');
    const aiProv = sessionStorage.getItem('aiProvider');
    if (aiProv) setProvider(aiProv);

    if (raw) {
      try {
        const profile = JSON.parse(raw);
        setLearnerProfile(profile);
        
        // Match user's goal with the best roadmap track
        const goalLower = (profile.goal || '').toLowerCase();
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
      } catch (e) {
        console.error('Error parsing learner profile:', e);
      }
    }
  }, []);

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

  return (
    <div className="flex flex-col min-h-screen h-full bg-[#FDFCFB] text-[#1A1A1A]">
      {/* Top Banner with User's Personalized Context if available */}
      {learnerProfile && (
        <div className="bg-[#1A1A1A] text-white px-4 sm:px-8 py-2.5 flex flex-wrap items-center justify-between text-xs font-mono tracking-wider">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 text-emerald-400 font-bold">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              ADAPTIVE PROFILE ACTIVE
            </span>
            <span className="text-[#888]">•</span>
            <span>GOAL: <strong className="text-white">{learnerProfile.goal}</strong></span>
            <span className="hidden md:inline text-[#888]">•</span>
            <span className="hidden md:inline">TIME BUDGET: {learnerProfile.weeklyHours || 10}H/WK</span>
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
          <span className="text-[#1A1A1A] font-bold">HYBRID GRAPHRAG + OKF ACTIVE</span>
        </div>
      </footer>
    </div>
  );
}
