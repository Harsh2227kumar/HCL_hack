"use client";

import React, { useState } from 'react';
import { 
  GitBranch, 
  Layers, 
  Clock, 
  Network, 
  Target, 
  Code2, 
  Users2, 
  CheckCircle2, 
  Sparkles, 
  ArrowRight, 
  Sliders, 
  Calendar, 
  BarChart3, 
  Compass, 
  FileJson, 
  Play,
  RotateCcw
} from 'lucide-react';
import { VISUALIZATION_METHODS, VisualizationMethod } from '@/data/visualizationPlanData';
import { ROADMAPS, RoadmapNode } from '@/data/roadmapsData';

export const VisualizationPlanView: React.FC = () => {
  const [selectedMethodId, setSelectedMethodId] = useState<string>('flowchart-dag');
  const [activeRoadmapId, setActiveRoadmapId] = useState<string>('python-developer');
  
  // Interactive Timeline state
  const [hoursPerWeek, setHoursPerWeek] = useState<number>(10);
  
  // Interactive Radar Benchmark state
  const [selectedLevelBenchmark, setSelectedLevelBenchmark] = useState<'Mid' | 'Senior' | 'Staff'>('Senior');

  const selectedMethod = VISUALIZATION_METHODS.find(m => m.id === selectedMethodId) || VISUALIZATION_METHODS[0];
  const activeRoadmap = ROADMAPS.find(r => r.id === activeRoadmapId) || ROADMAPS[0];

  // Calculate cumulative timeline for the active roadmap
  const timelineNodes = activeRoadmap.nodes.map((node, index) => {
    const prevHours = activeRoadmap.nodes.slice(0, index).reduce((acc, n) => acc + n.estimatedHours, 0);
    const startWeek = Math.floor(prevHours / hoursPerWeek) + 1;
    const durationWeeks = Math.max(1, Math.ceil(node.estimatedHours / hoursPerWeek));
    const endWeek = startWeek + durationWeeks;
    return {
      ...node,
      startWeek,
      durationWeeks,
      endWeek
    };
  });

  const totalCalculatedWeeks = Math.ceil(activeRoadmap.totalHours / hoursPerWeek);

  // Group nodes by category for Mind Map
  const categoryGroups = activeRoadmap.nodes.reduce((acc, node) => {
    if (!acc[node.category]) acc[node.category] = [];
    acc[node.category].push(node);
    return acc;
  }, {} as Record<string, RoadmapNode[]>);

  const categories = Object.keys(categoryGroups);

  return (
    <div className="flex-1 overflow-y-auto bg-[#FDFCFB] p-4 sm:p-8 lg:p-12 space-y-10">
      {/* Editorial Header Section */}
      <section className="max-w-5xl mx-auto border-b-2 border-[#1A1A1A] pb-8 space-y-4">
        <div className="flex items-center gap-3 text-xs font-mono uppercase tracking-[0.3em] text-[#666]">
          <span className="bg-[#1A1A1A] text-white px-2 py-0.5 font-bold">ARCHITECTURE BLUEPRINT</span>
          <span>DATA VISUALIZATION FRAMEWORK</span>
        </div>

        <h2 className="text-3xl sm:text-5xl font-serif italic text-[#1A1A1A] leading-tight">
          Roadmap Visualization Planning &amp; Generation Matrix
        </h2>

        <p className="text-base sm:text-lg font-serif text-[#333] leading-relaxed">
          Comprehensive blueprint for transforming raw developer roadmap JSON schemas into multi-perspective interactive representations: <span className="font-semibold text-[#1A1A1A]">Topological DAGs, Radial Mind Maps, Milestone Timelines, Chord Matrices, and Radar Diagnostics</span>.
        </p>

        {/* Method Selector Tabs */}
        <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-2 pt-4 border-t border-[#1A1A1A]/15 font-mono text-xs">
          {VISUALIZATION_METHODS.map((method, idx) => {
            const isSelected = selectedMethodId === method.id;
            return (
              <button
                key={method.id}
                onClick={() => setSelectedMethodId(method.id)}
                className={`p-3 text-left border transition-all cursor-pointer space-y-1 ${
                  isSelected
                    ? 'border-[#1A1A1A] bg-[#1A1A1A] text-white shadow-sm font-bold'
                    : 'border-[#1A1A1A]/20 bg-white text-[#555] hover:border-[#1A1A1A]'
                }`}
              >
                <div className={`text-[10px] ${isSelected ? 'text-emerald-400' : 'text-[#888]'}`}>
                  METHOD 0{idx + 1}
                </div>
                <div className="text-xs leading-snug line-clamp-2">{method.title.split('&')[0]}</div>
              </button>
            );
          })}
        </div>
      </section>

      {/* Main Method Deep-Dive and Live Preview */}
      <section className="max-w-5xl mx-auto space-y-8">
        {/* Method Specification Header */}
        <div className="p-6 bg-white border-2 border-[#1A1A1A] shadow-[4px_4px_0px_#1A1A1A] space-y-4">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 border-b border-[#1A1A1A]/10 pb-3">
            <div>
              <span className="text-xs font-mono uppercase tracking-widest text-[#777] font-bold">
                Paradigm: {selectedMethod.paradigm}
              </span>
              <h3 className="text-2xl font-serif italic text-[#1A1A1A] mt-0.5">
                {selectedMethod.title}
              </h3>
            </div>
            <span className="text-xs font-mono bg-emerald-100 text-emerald-900 px-2.5 py-1 font-bold self-start sm:self-auto">
              BEST FOR: {selectedMethod.bestFor.split(',')[0]}
            </span>
          </div>

          <p className="text-sm font-serif text-[#333] leading-relaxed">
            {selectedMethod.description}
          </p>

          {/* Active Track Switcher for the Live Generator */}
          <div className="flex items-center gap-2 pt-2 border-t border-[#1A1A1A]/10 text-xs font-mono">
            <span className="text-[10px] uppercase font-bold text-[#777]">Render Track Data:</span>
            <select
              value={activeRoadmapId}
              onChange={(e) => setActiveRoadmapId(e.target.value)}
              className="px-2 py-1 bg-[#F8F7F4] border border-[#1A1A1A]/30 text-xs font-mono font-bold focus:outline-none"
            >
              {ROADMAPS.map(r => (
                <option key={r.id} value={r.id}>
                  {r.title} ({r.nodes.length} nodes, {r.totalHours} hrs)
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* LIVE GENERATED VISUALIZATION PREVIEW */}
        <div className="p-6 bg-white border-2 border-[#1A1A1A] space-y-6">
          <div className="flex justify-between items-center border-b border-[#1A1A1A]/10 pb-3">
            <span className="font-mono text-xs uppercase tracking-widest text-[#1A1A1A] font-bold flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-emerald-700" />
              <span>Live Generated Render: {selectedMethod.title}</span>
            </span>
            <span className="text-[10px] font-mono bg-[#1A1A1A] text-white px-2 py-0.5 font-bold">
              SOURCE: {activeRoadmap.id}.json
            </span>
          </div>

          {/* PREVIEW 1: Topological Flowchart / DAG */}
          {selectedMethod.id === 'flowchart-dag' && (
            <div className="p-4 bg-[#FAF9F6] border border-[#1A1A1A]/20 space-y-6">
              <div className="flex justify-between items-center text-xs font-mono text-[#777]">
                <span>Topological In-Degree Ordering</span>
                <span>{activeRoadmap.nodes.length} Nodes Rendered</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {activeRoadmap.nodes.map((node, nIdx) => (
                  <div key={node.id} className="p-3 bg-white border border-[#1A1A1A] shadow-sm space-y-1.5">
                    <div className="flex justify-between items-center text-[10px] font-mono">
                      <span className="font-bold text-[#1A1A1A]">#{nIdx + 1} [{node.level}]</span>
                      <span className="bg-[#EAE8E1] px-1.5 py-0.2 text-[#444]">{node.estimatedHours}h</span>
                    </div>
                    <strong className="text-xs font-serif text-[#1A1A1A] block">{node.label}</strong>
                    <div className="text-[9px] font-mono text-[#666] truncate">
                      Prereqs: {node.prerequisites.length ? node.prerequisites.join(', ') : 'None (Root)'}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* PREVIEW 2: Mind Map & Radial Competency Tree */}
          {selectedMethod.id === 'mind-map-radial' && (
            <div className="p-6 bg-[#FAF9F6] border border-[#1A1A1A]/20 space-y-6 text-center">
              <div className="inline-block p-3 bg-[#1A1A1A] text-white font-serif font-bold text-sm shadow-sm">
                HUB: {activeRoadmap.title}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-left">
                {categories.map((cat, cIdx) => (
                  <div key={cat} className="p-4 bg-white border border-[#1A1A1A] space-y-2">
                    <div className="text-[11px] font-mono uppercase font-bold text-emerald-800 border-b border-[#EAE8E1] pb-1">
                      Branch 0{cIdx + 1}: {cat}
                    </div>
                    <ul className="space-y-1 text-xs font-serif text-[#333]">
                      {categoryGroups[cat].map(n => (
                        <li key={n.id} className="flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#1A1A1A]"></span>
                          <span>{n.label}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* PREVIEW 3: Interactive Timeline & Sprint Milestones */}
          {selectedMethod.id === 'timeline-milestones' && (
            <div className="p-6 bg-[#FAF9F6] border border-[#1A1A1A]/20 space-y-6">
              {/* Pacing Controller */}
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 bg-white p-4 border border-[#1A1A1A]">
                <div className="space-y-0.5">
                  <span className="text-xs font-mono uppercase font-bold text-[#1A1A1A] block">
                    Weekly Learning Hours Commitment:
                  </span>
                  <p className="text-[11px] font-serif text-[#666]">
                    Adjust slider to project milestone dates and total completion velocity.
                  </p>
                </div>
                <div className="flex items-center gap-3 font-mono text-xs">
                  <input
                    type="range"
                    min="5"
                    max="30"
                    step="5"
                    value={hoursPerWeek}
                    onChange={(e) => setHoursPerWeek(Number(e.target.value))}
                    className="cursor-pointer"
                  />
                  <span className="font-bold text-[#1A1A1A] w-20 text-right">
                    {hoursPerWeek} hrs/week
                  </span>
                </div>
              </div>

              {/* Pacing Metrics Summary */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono">
                <div className="p-3 bg-white border border-[#1A1A1A] text-center">
                  <span className="text-[10px] text-[#777] uppercase block">Total Roadmap Hours</span>
                  <strong className="text-lg font-bold text-[#1A1A1A]">{activeRoadmap.totalHours} hrs</strong>
                </div>
                <div className="p-3 bg-white border border-[#1A1A1A] text-center">
                  <span className="text-[10px] text-[#777] uppercase block">Estimated Calendar Duration</span>
                  <strong className="text-lg font-bold text-emerald-700">{totalCalculatedWeeks} Weeks (~{Math.ceil(totalCalculatedWeeks / 4.3)} Mos)</strong>
                </div>
                <div className="p-3 bg-white border border-[#1A1A1A] text-center">
                  <span className="text-[10px] text-[#777] uppercase block">Sprint Allocation</span>
                  <strong className="text-lg font-bold text-[#1A1A1A]">{Math.ceil(totalCalculatedWeeks / 2)} Agile Sprints</strong>
                </div>
              </div>

              {/* Gantt Style Progression Bar */}
              <div className="space-y-2">
                <span className="text-[11px] font-mono uppercase font-bold text-[#777] block">
                  Topological Milestone Progression (Week 01 to Week {totalCalculatedWeeks}):
                </span>
                <div className="space-y-2">
                  {timelineNodes.slice(0, 6).map((item) => (
                    <div key={item.id} className="p-2.5 bg-white border border-[#1A1A1A]/30 text-xs font-mono space-y-1">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-[#1A1A1A]">{item.label}</span>
                        <span className="text-[10px] text-[#666]">Week {item.startWeek} - {item.endWeek} ({item.estimatedHours}h)</span>
                      </div>
                      {/* Bar */}
                      <div className="w-full bg-[#EAE8E1] h-2.5 relative overflow-hidden">
                        <div 
                          className="bg-[#1A1A1A] h-full"
                          style={{
                            marginLeft: `${(item.startWeek / totalCalculatedWeeks) * 100}%`,
                            width: `${Math.max(4, (item.durationWeeks / totalCalculatedWeeks) * 100)}%`
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* PREVIEW 4: Cross-Discipline Knowledge Matrix */}
          {selectedMethod.id === 'cross-discipline-matrix' && (
            <div className="p-6 bg-[#FAF9F6] border border-[#1A1A1A]/20 space-y-4">
              <p className="text-xs font-serif text-[#444]">
                Shows direct inter-domain integration edges connecting {activeRoadmap.title} with peer disciplines (DevOps, Security, Backend, AI).
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs font-mono">
                <div className="p-3 bg-white border border-[#1A1A1A]">
                  <strong className="text-emerald-800 uppercase text-[10px] block mb-1">
                    Python $\to$ DevOps Interface:
                  </strong>
                  <div>• py-packaging-dist $\to$ devops-docker-containers [CONTAINERIZES]</div>
                  <div>• py-frameworks-web $\to$ devops-k8s-orchestration [DEPLOYS_TO]</div>
                </div>
                <div className="p-3 bg-white border border-[#1A1A1A]">
                  <strong className="text-blue-800 uppercase text-[10px] block mb-1">
                    Python $\to$ AI/ML Interface:
                  </strong>
                  <div>• py-data-tooling $\to$ ai-data-feature-engineering [FEEDS_DATA_TO]</div>
                  <div>• py-frameworks-web $\to$ ai-llm-rag-orchestration [SERVES_MODELS]</div>
                </div>
              </div>
            </div>
          )}

          {/* PREVIEW 5: Skill Radar & Competency Gap Diagnostic */}
          {selectedMethod.id === 'skill-radar-gap' && (
            <div className="p-6 bg-[#FAF9F6] border border-[#1A1A1A]/20 space-y-6">
              <div className="flex justify-between items-center bg-white p-3 border border-[#1A1A1A]">
                <span className="text-xs font-mono uppercase font-bold text-[#1A1A1A]">
                  Target Level Benchmark:
                </span>
                <div className="flex gap-1 text-xs font-mono">
                  {(['Mid', 'Senior', 'Staff'] as const).map(lvl => (
                    <button
                      key={lvl}
                      onClick={() => setSelectedLevelBenchmark(lvl)}
                      className={`px-3 py-1 cursor-pointer font-bold ${
                        selectedLevelBenchmark === lvl
                          ? 'bg-[#1A1A1A] text-white'
                          : 'bg-[#EAE8E1] text-[#666]'
                      }`}
                    >
                      {lvl}
                    </button>
                  ))}
                </div>
              </div>

              {/* Radar Bar Breakdown */}
              <div className="space-y-3">
                {categories.slice(0, 5).map((cat, idx) => {
                  const targetScore = selectedLevelBenchmark === 'Staff' ? 95 : selectedLevelBenchmark === 'Senior' ? 85 : 65;
                  const currentScore = Math.min(100, 50 + (idx * 12) % 45);
                  const isGap = currentScore < targetScore;

                  return (
                    <div key={cat} className="p-3 bg-white border border-[#1A1A1A]/30 text-xs font-mono space-y-1.5">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-[#1A1A1A]">{cat}</span>
                        <span className="text-[10px] text-[#666]">
                          Score: <strong className={isGap ? 'text-amber-800' : 'text-emerald-800'}>{currentScore}%</strong> / Target: {targetScore}%
                        </span>
                      </div>
                      <div className="w-full bg-[#EAE8E1] h-3 relative">
                        <div className="bg-[#1A1A1A] h-full" style={{ width: `${currentScore}%` }} />
                        {/* Target Marker */}
                        <div 
                          className="absolute top-0 bottom-0 w-1 bg-emerald-600 z-10"
                          style={{ left: `${targetScore}%` }}
                          title={`Target: ${targetScore}%`}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* ALGORITHMIC GENERATION PIPELINE BREAKDOWN */}
        <div className="p-6 sm:p-8 bg-white border-2 border-[#1A1A1A] space-y-6">
          <div className="border-b border-[#1A1A1A]/10 pb-3">
            <span className="font-mono text-xs uppercase tracking-widest text-[#777] font-bold">
              Technical Implementation Specification
            </span>
            <h4 className="text-xl font-serif italic text-[#1A1A1A] mt-0.5">
              Algorithmic Generation Pipeline: From JSON to Rendered Canvas
            </h4>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs font-mono">
            {/* Input Data Structure */}
            <div className="p-4 bg-[#F8F7F4] border border-[#1A1A1A]/20 space-y-2">
              <strong className="text-xs uppercase text-[#1A1A1A] block border-b border-[#E5E3DC] pb-1">
                01 / Input JSON Schema Contract:
              </strong>
              <p className="font-serif text-[#555] leading-relaxed">
                {selectedMethod.algorithmicGeneration.inputStructure}
              </p>
              <pre className="p-2.5 bg-[#1A1A1A] text-emerald-400 font-mono text-[10px] overflow-x-auto">
                {selectedMethod.sampleJsonSnippet}
              </pre>
            </div>

            {/* Layout Algorithm & Math */}
            <div className="p-4 bg-[#F8F7F4] border border-[#1A1A1A]/20 space-y-2">
              <strong className="text-xs uppercase text-[#1A1A1A] block border-b border-[#E5E3DC] pb-1">
                02 / Layout Algorithm &amp; Mathematics:
              </strong>
              <div className="text-emerald-800 font-bold text-[11px]">
                {selectedMethod.algorithmicGeneration.layoutAlgorithm}
              </div>
              <div className="font-serif text-[#555] leading-relaxed text-[11px]">
                {selectedMethod.algorithmicGeneration.outputFormat}
              </div>
            </div>
          </div>

          {/* Transformation Step Sequence */}
          <div className="space-y-2">
            <strong className="text-xs font-mono uppercase text-[#1A1A1A] block">
              03 / Step-by-Step Data Transformation Pipeline:
            </strong>
            <div className="space-y-2">
              {selectedMethod.algorithmicGeneration.transformationSteps.map((step, sIdx) => (
                <div key={sIdx} className="p-3 bg-[#FDFCFB] border border-[#1A1A1A]/10 text-xs font-serif text-[#333] flex items-start gap-2.5">
                  <span className="font-mono text-[10px] font-bold text-[#1A1A1A] mt-0.5">[{sIdx + 1}]</span>
                  <span>{step}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* TEAM UTILITY & IMPACT MATRIX */}
        <div className="p-6 sm:p-8 bg-white border-2 border-[#1A1A1A] space-y-6">
          <div className="border-b border-[#1A1A1A]/10 pb-3">
            <span className="font-mono text-xs uppercase tracking-widest text-[#777] font-bold">
              Organizational Value
            </span>
            <h4 className="text-xl font-serif italic text-[#1A1A1A] mt-0.5">
              How This Visualization Empowers Team Stakeholders
            </h4>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            {/* Engineers */}
            <div className="p-4 bg-[#F8F7F4] border border-[#1A1A1A] space-y-1.5">
              <div className="flex items-center gap-2 font-mono text-xs font-bold text-[#1A1A1A]">
                <Code2 className="w-3.5 h-3.5 text-blue-700" />
                <span>Individual Engineers</span>
              </div>
              <p className="font-serif text-[#444] leading-relaxed text-[11.5px]">
                {selectedMethod.teamUtility.engineers}
              </p>
            </div>

            {/* Managers & Leads */}
            <div className="p-4 bg-[#F8F7F4] border border-[#1A1A1A] space-y-1.5">
              <div className="flex items-center gap-2 font-mono text-xs font-bold text-[#1A1A1A]">
                <Users2 className="w-3.5 h-3.5 text-emerald-700" />
                <span>Engineering Managers &amp; Tech Leads</span>
              </div>
              <p className="font-serif text-[#444] leading-relaxed text-[11.5px]">
                {selectedMethod.teamUtility.managers}
              </p>
            </div>

            {/* Recruiters */}
            <div className="p-4 bg-[#F8F7F4] border border-[#1A1A1A] space-y-1.5">
              <div className="flex items-center gap-2 font-mono text-xs font-bold text-[#1A1A1A]">
                <Target className="w-3.5 h-3.5 text-amber-700" />
                <span>Technical Recruiters &amp; Interviewers</span>
              </div>
              <p className="font-serif text-[#444] leading-relaxed text-[11.5px]">
                {selectedMethod.teamUtility.recruiters}
              </p>
            </div>

            {/* Cross-Functional Squads */}
            <div className="p-4 bg-[#F8F7F4] border border-[#1A1A1A] space-y-1.5">
              <div className="flex items-center gap-2 font-mono text-xs font-bold text-[#1A1A1A]">
                <Network className="w-3.5 h-3.5 text-purple-700" />
                <span>Cross-Functional Squads &amp; PMs</span>
              </div>
              <p className="font-serif text-[#444] leading-relaxed text-[11.5px]">
                {selectedMethod.teamUtility.crossFunctional}
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
