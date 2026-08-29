"use client";

import React, { useState } from 'react';
import { 
  Users2, 
  Users, 
  Compass, 
  ShieldCheck, 
  Cpu, 
  CheckCircle2, 
  Share2, 
  Layers
} from 'lucide-react';
import { TEAM_STAKEHOLDERS } from '@/data/teamStakeholders';

export const TeamMatrixView: React.FC = () => {
  const [selectedStakeholderId, setSelectedStakeholderId] = useState<string>(TEAM_STAKEHOLDERS[0].id);

  const activeStakeholder = TEAM_STAKEHOLDERS.find(s => s.id === selectedStakeholderId) || TEAM_STAKEHOLDERS[0];

  const getPersonaIcon = (iconName: string) => {
    switch (iconName) {
      case 'Users':
        return <Users className="w-5 h-5" />;
      case 'Compass':
        return <Compass className="w-5 h-5" />;
      case 'ShieldCheck':
        return <ShieldCheck className="w-5 h-5" />;
      case 'Cpu':
        return <Cpu className="w-5 h-5" />;
      default:
        return <Users2 className="w-5 h-5" />;
    }
  };

  return (
    <div className="flex-1 overflow-y-auto bg-[#FDFCFB] p-4 sm:p-8 lg:p-12 space-y-12">
      {/* Editorial Header */}
      <section className="max-w-5xl mx-auto border-b-2 border-[#1A1A1A] pb-8 space-y-4">
        <div className="flex items-center gap-3 text-xs font-mono uppercase tracking-[0.3em] text-[#666]">
          <span className="bg-[#1A1A1A] text-white px-2 py-0.5 font-bold">ORGANIZATIONAL INTEGRATION</span>
          <span>ENTERPRISE TEAM BLUEPRINT</span>
        </div>

        <h2 className="text-3xl sm:text-5xl font-serif italic text-[#1A1A1A] leading-tight">
          How the Roadmap is Taken in Use, Connected, and With Whom
        </h2>

        <p className="text-base sm:text-lg font-serif text-[#333] leading-relaxed">
          A personalized learning path is not a static document to be admired once and forgotten. 
          It is an <span className="font-semibold text-[#1A1A1A]">active operating contract</span> that synchronizes four key organizational stakeholders: 
          Engineering Leads, Individual Developers, Technical Recruiters, and AI Automation Systems.
        </p>

        {/* High-Level Overview Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2">
          {TEAM_STAKEHOLDERS.map((s) => {
            const isSelected = s.id === selectedStakeholderId;
            return (
              <button
                key={s.id}
                onClick={() => setSelectedStakeholderId(s.id)}
                className={`p-4 text-left border-2 transition-all cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? 'border-[#1A1A1A] bg-[#1A1A1A] text-white shadow-[4px_4px_0px_rgba(0,0,0,0.2)]'
                    : 'border-[#1A1A1A]/30 bg-white text-[#1A1A1A] hover:border-[#1A1A1A]'
                }`}
              >
                <div className="flex justify-between items-start mb-3">
                  <div className={`p-2 border ${isSelected ? 'border-white/30 bg-white/10 text-white' : 'border-[#1A1A1A]/20 bg-[#F8F7F4] text-[#1A1A1A]'}`}>
                    {getPersonaIcon(s.iconName)}
                  </div>
                  <span className={`text-[9px] font-mono px-1.5 py-0.5 ${isSelected ? 'bg-white text-[#1A1A1A] font-bold' : 'bg-[#EAE8E1] text-[#666]'}`}>
                    {s.badge}
                  </span>
                </div>

                <div>
                  <h3 className="font-serif font-bold text-sm leading-snug">
                    {s.title}
                  </h3>
                  <span className={`text-[10px] font-mono block mt-1 ${isSelected ? 'text-[#CCC]' : 'text-[#777]'}`}>
                    {s.audience.split(',')[0]}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* Deep-Dive on Active Stakeholder */}
      <section className="max-w-5xl mx-auto p-6 sm:p-8 bg-[#F8F7F4] border-2 border-[#1A1A1A] space-y-8">
        <div className="flex flex-col sm:flex-row justify-between sm:items-baseline border-b border-[#1A1A1A]/20 pb-4 gap-2">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-[#777]">
              <span>Stakeholder Profile</span>
              <span>•</span>
              <span className="font-bold text-[#1A1A1A]">{activeStakeholder.badge}</span>
            </div>
            <h3 className="text-2xl sm:text-3xl font-serif italic font-bold text-[#1A1A1A] mt-1">
              {activeStakeholder.title}
            </h3>
          </div>
          <span className="text-xs font-mono text-[#555] bg-white px-3 py-1 border border-[#1A1A1A]/20">
            Target: {activeStakeholder.audience}
          </span>
        </div>

        {/* 3-Column Persona Breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Column 1: How They Use It */}
          <div className="bg-white p-5 border border-[#1A1A1A]/20 space-y-3">
            <span className="text-xs font-mono uppercase tracking-widest font-bold text-[#1A1A1A] border-b border-[#1A1A1A]/10 pb-1 block">
              01 / Core Purpose &amp; Usage
            </span>
            <ul className="space-y-2.5 text-xs font-sans">
              {activeStakeholder.howTheyUseIt.map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-[#333]">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700 shrink-0 mt-0.5" />
                  <span className="leading-relaxed">{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 2: Connected Systems */}
          <div className="bg-white p-5 border border-[#1A1A1A]/20 space-y-3">
            <span className="text-xs font-mono uppercase tracking-widest font-bold text-[#1A1A1A] border-b border-[#1A1A1A]/10 pb-1 block">
              02 / Connected Platforms &amp; APIs
            </span>
            <ul className="space-y-2.5 text-xs font-sans">
              {activeStakeholder.connectedSystems.map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-[#333]">
                  <Share2 className="w-3.5 h-3.5 text-blue-700 shrink-0 mt-0.5" />
                  <span className="leading-relaxed font-mono text-[11px]">{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3: Tangible Outputs */}
          <div className="bg-white p-5 border border-[#1A1A1A]/20 space-y-3">
            <span className="text-xs font-mono uppercase tracking-widest font-bold text-[#1A1A1A] border-b border-[#1A1A1A]/10 pb-1 block">
              03 / Tangible Key Outputs
            </span>
            <ul className="space-y-2.5 text-xs font-sans">
              {activeStakeholder.keyOutputs.map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-[#333]">
                  <Layers className="w-3.5 h-3.5 text-purple-700 shrink-0 mt-0.5" />
                  <span className="leading-relaxed font-semibold text-[#1A1A1A]">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Step-by-Step Actionable Workflows */}
        <div className="space-y-4 pt-2">
          <span className="text-xs font-mono uppercase tracking-widest font-bold text-[#1A1A1A] block">
            Actionable Production Workflows for {activeStakeholder.title}:
          </span>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {activeStakeholder.actionableWorkflows.map((flow, i) => (
              <div key={i} className="p-4 bg-white border border-[#1A1A1A] space-y-2">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 bg-[#1A1A1A] text-white text-[10px] font-mono flex items-center justify-center font-bold">
                    0{i + 1}
                  </span>
                  <h4 className="font-serif font-bold text-sm text-[#1A1A1A]">
                    {flow.stepTitle}
                  </h4>
                </div>
                <p className="text-xs font-sans text-[#555] leading-relaxed">
                  {flow.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Enterprise End-to-End System Connection Topology */}
      <section className="max-w-5xl mx-auto space-y-6">
        <div className="border-b border-[#1A1A1A]/20 pb-3">
          <h3 className="text-2xl font-serif italic text-[#1A1A1A]">
            Organizational Data Exchange Architecture
          </h3>
          <p className="text-xs font-mono text-[#666] mt-1">
            How skills, evaluations, and progress events synchronize across company infrastructure
          </p>
        </div>

        <div className="p-6 bg-white border-2 border-[#1A1A1A] space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-4 bg-[#F8F7F4] border border-[#1A1A1A]/20 space-y-2">
              <span className="text-[10px] font-mono uppercase tracking-wider text-[#777] font-bold block">
                [INPUT] Upstream Sources
              </span>
              <p className="text-xs font-serif text-[#333] leading-relaxed">
                • GitHub Roadmap JSONs<br/>
                • Internal Confluence Specs<br/>
                • Architecture RFC Decisions
              </p>
            </div>

            <div className="p-4 bg-[#1A1A1A] text-white space-y-2">
              <span className="text-[10px] font-mono uppercase tracking-wider text-amber-400 font-bold block">
                [CORE] Skill DAG Engine
              </span>
              <p className="text-xs font-serif text-[#DDD] leading-relaxed">
                • Graph Dependency Resolver<br/>
                • Vector Index (Qdrant)<br/>
                • GraphQL Skill Schema API
              </p>
            </div>

            <div className="p-4 bg-[#F8F7F4] border border-[#1A1A1A]/20 space-y-2">
              <span className="text-[10px] font-mono uppercase tracking-wider text-[#777] font-bold block">
                [OUTPUT] Synchronized Consumers
              </span>
              <p className="text-xs font-serif text-[#333] leading-relaxed">
                • Backstage.io Developer Portal<br/>
                • JIRA / Linear Sprint Backlogs<br/>
                • Slack Bot Daily Mentorship
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
