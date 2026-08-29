"use client";

import React from 'react';
import { Network, Layers, FileCode2, Users2, Sparkles, BookOpen, GitBranch, Compass } from 'lucide-react';

export type ActiveTab = 
  | 'dag' 
  | 'knowledge-graph' 
  | 'rag-vs-okf' 
  | 'visualization-plan' 
  | 'schema-enricher' 
  | 'team-matrix' 
  | 'playbook'
  | 'design-system';

interface HeaderProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  selectedTrackTitle: string;
}

export const Header: React.FC<HeaderProps> = ({ activeTab, setActiveTab, selectedTrackTitle }) => {
  const tabs = [
    { id: 'dag' as ActiveTab, label: '01 / DAG Engine', icon: GitBranch, badge: 'Interactive Graph' },
    { id: 'knowledge-graph' as ActiveTab, label: '02 / Knowledge Graph', icon: Network, badge: 'Cross-Discipline' },
    { id: 'rag-vs-okf' as ActiveTab, label: '03 / RAG Strategy & OKF', icon: Layers, badge: 'Architecture' },
    { id: 'visualization-plan' as ActiveTab, label: '04 / Visualization Plan', icon: Compass, badge: '5 Paradigms' },
    { id: 'schema-enricher' as ActiveTab, label: '05 / Schema Enricher', icon: FileCode2, badge: 'JSON Studio' },
    { id: 'team-matrix' as ActiveTab, label: '06 / Team Matrix', icon: Users2, badge: 'Integration Map' },
    { id: 'playbook' as ActiveTab, label: '07 / Engineering Playbook', icon: BookOpen, badge: 'Scripts & CI' },
    { id: 'design-system' as ActiveTab, label: '08 / Design Theme', icon: Sparkles, badge: 'Spec & Guidelines' }
  ];

  return (
    <header className="border-b-2 border-[#1A1A1A] bg-[#FDFCFB] pt-6 pb-0 px-4 sm:px-8 lg:px-12 shrink-0">
      {/* Top Editorial Metadata Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-[#1A1A1A]/15 pb-3 mb-6 gap-2 text-xs font-mono tracking-wider uppercase text-[#1A1A1A]/70">
        <div className="flex items-center gap-3">
          <span className="bg-[#1A1A1A] text-white px-2 py-0.5 text-[10px] font-bold tracking-widest">SPECIFICATION</span>
          <span>DEV-ROADMAP ARCHITECTURE &amp; DAG RUNTIME</span>
        </div>
        <div className="flex items-center gap-4 text-[11px]">
          <span className="hidden md:inline">INDEX: GITHUB/KAMRANAHMEDSE</span>
          <span className="hidden lg:inline">•</span>
          <span className="text-[#1A1A1A] font-semibold flex items-center gap-1.5">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-600 animate-pulse"></span>
            ACTIVE TRACK: {selectedTrackTitle}
          </span>
        </div>
      </div>

      {/* Main Masthead Title */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6 pb-6 border-b border-[#1A1A1A]/10">
        <div className="max-w-4xl">
          <p className="text-[11px] font-mono uppercase tracking-[0.25em] text-[#555] mb-1.5 flex items-center gap-2">
            <Network className="w-3.5 h-3.5" />
            Topological Knowledge &amp; Career Progression Framework
          </p>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-serif italic tracking-tight text-[#1A1A1A] leading-[1.05]">
            Roadmap Engine &amp; DAG Architecture
          </h1>
          <p className="mt-3 text-sm sm:text-base text-[#555] font-serif leading-relaxed max-w-3xl">
            Transforming structured skill ontologies and goal templates into deterministic Directed Acyclic Graphs, 
            production JSON schemas, cross-discipline knowledge graphs, and hybrid <span className="font-semibold text-[#1A1A1A]">GraphRAG + OKF</span> architectures for enterprise engineering teams.
          </p>
        </div>

        {/* Quick KPI Badge */}
        <div className="bg-[#F8F7F4] border border-[#1A1A1A]/15 p-4 rounded-none min-w-[240px] text-right">
          <div className="text-[10px] font-mono uppercase tracking-widest text-[#777]">Architecture Paradigm</div>
          <div className="text-xl font-serif font-bold text-[#1A1A1A] mt-0.5">Hybrid GraphRAG + OKF</div>
          <div className="text-[11px] font-mono text-emerald-800 mt-1 flex items-center justify-end gap-1">
            <Sparkles className="w-3 h-3" />
            <span>Topologically Safe • Hallucination Free</span>
          </div>
        </div>
      </div>

      {/* Navigation Tab Bar */}
      <nav className="flex overflow-x-auto gap-1 sm:gap-2 pt-2 -mb-[2px] scrollbar-none" aria-label="Main Navigation">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`group flex items-center gap-2.5 px-4 sm:px-6 py-3.5 text-xs sm:text-sm font-mono tracking-wide uppercase transition-all whitespace-nowrap border-b-2 cursor-pointer ${
                isActive
                  ? 'border-[#1A1A1A] bg-[#F8F7F4] text-[#1A1A1A] font-bold shadow-[inset_0_-2px_0_#1A1A1A]'
                  : 'border-transparent text-[#666] hover:text-[#1A1A1A] hover:bg-[#F8F7F4]/60'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-[#1A1A1A]' : 'text-[#888] group-hover:text-[#1A1A1A]'}`} />
              <span>{tab.label}</span>
              <span className={`text-[9px] px-1.5 py-0.5 font-mono ${
                isActive ? 'bg-[#1A1A1A] text-white' : 'bg-[#EAE8E1] text-[#666]'
              }`}>
                {tab.badge}
              </span>
            </button>
          );
        })}
      </nav>
    </header>
  );
};
