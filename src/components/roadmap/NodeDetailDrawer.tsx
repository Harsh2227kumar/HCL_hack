"use client";

import React from 'react';
import { X, CheckCircle2, Clock, AlertCircle, ArrowRight, ArrowLeft, ExternalLink, ShieldCheck, Terminal, Award } from 'lucide-react';
import { RoadmapNode, RoadmapPath } from '@/data/roadmapsData';

interface NodeDetailDrawerProps {
  node: RoadmapNode | null;
  roadmap: RoadmapPath;
  onClose: () => void;
  onSelectNode: (nodeId: string) => void;
  onToggleStatus: (nodeId: string, status: 'not-started' | 'in-progress' | 'mastered') => void;
}

export const NodeDetailDrawer: React.FC<NodeDetailDrawerProps> = ({
  node,
  roadmap,
  onClose,
  onSelectNode,
  onToggleStatus
}) => {
  if (!node) return null;

  // Find prerequisite nodes
  const prerequisiteNodes = roadmap.nodes.filter(n => node.prerequisites.includes(n.id));
  
  // Find downstream dependent nodes (nodes that list this node as a prerequisite)
  const dependentNodes = roadmap.nodes.filter(n => n.prerequisites.includes(node.id));

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'mastered':
        return <span className="bg-emerald-100 text-emerald-900 border border-emerald-300 text-xs px-2.5 py-1 font-mono uppercase font-bold flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" /> Mastered</span>;
      case 'in-progress':
        return <span className="bg-amber-100 text-amber-900 border border-amber-300 text-xs px-2.5 py-1 font-mono uppercase font-bold flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-amber-700" /> In Progress</span>;
      default:
        return <span className="bg-[#EAE8E1] text-[#555] border border-[#D5D2C9] text-xs px-2.5 py-1 font-mono uppercase font-bold flex items-center gap-1.5"><AlertCircle className="w-3.5 h-3.5 text-[#777]" /> Not Started</span>;
    }
  };

  return (
    <aside 
      className="fixed inset-y-0 right-0 w-full sm:w-[540px] md:w-[600px] bg-[#FDFCFB] border-l-2 border-[#1A1A1A] shadow-2xl z-50 flex flex-col overflow-hidden animate-in slide-in-from-right duration-200"
      aria-label="Roadmap Node Inspector"
    >
      {/* Header */}
      <div className="p-6 border-b border-[#1A1A1A]/15 bg-[#F8F7F4] flex justify-between items-start">
        <div className="space-y-1 max-w-[80%]">
          <div className="flex flex-wrap items-center gap-2 text-[10px] font-mono uppercase tracking-widest text-[#666]">
            <span className="bg-[#1A1A1A] text-white px-2 py-0.5 font-bold">NODE ID: {node.id}</span>
            <span>{node.category}</span>
            <span>•</span>
            <span className="font-semibold text-[#1A1A1A]">{node.level}</span>
          </div>
          <h2 className="text-2xl font-serif font-bold italic text-[#1A1A1A] leading-tight">
            {node.label}
          </h2>
        </div>
        <button
          onClick={onClose}
          className="p-2 hover:bg-[#1A1A1A] hover:text-white border border-[#1A1A1A] transition-colors cursor-pointer"
          title="Close Inspector"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Body scrollable content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 text-[#1A1A1A]">
        {/* Status and quick metrics banner */}
        <div className="grid grid-cols-3 gap-3 p-4 bg-[#F8F7F4] border border-[#1A1A1A]/10">
          <div>
            <span className="text-[10px] font-mono uppercase tracking-wider text-[#777] block">Status</span>
            <div className="mt-1">{getStatusBadge(node.status)}</div>
          </div>
          <div>
            <span className="text-[10px] font-mono uppercase tracking-wider text-[#777] block">Estimated Time</span>
            <div className="text-base font-serif font-bold text-[#1A1A1A] mt-1 flex items-center gap-1">
              <Clock className="w-4 h-4 text-[#555]" />
              <span>{node.estimatedHours} Hours</span>
            </div>
          </div>
          <div>
            <span className="text-[10px] font-mono uppercase tracking-wider text-[#777] block">Requirement</span>
            <div className="text-sm font-mono font-bold mt-1 text-[#1A1A1A]">
              <span className={`px-2 py-0.5 text-xs ${
                node.importance === 'Required' ? 'bg-[#1A1A1A] text-white' : 'bg-[#EAE8E1] text-[#444]'
              }`}>
                {node.importance}
              </span>
            </div>
          </div>
        </div>

        {/* Status Switcher Action Bar */}
        <div className="border border-[#1A1A1A] p-4 bg-white space-y-2">
          <span className="text-[11px] font-mono uppercase tracking-wider text-[#555] block font-bold">Update Skill Status:</span>
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => onToggleStatus(node.id, 'not-started')}
              className={`py-2 px-2 text-xs font-mono uppercase border transition-all cursor-pointer ${
                node.status === 'not-started' || !node.status
                  ? 'bg-[#1A1A1A] text-white border-[#1A1A1A] font-bold'
                  : 'bg-white text-[#555] border-[#D5D2C9] hover:border-[#1A1A1A]'
              }`}
            >
              Not Started
            </button>
            <button
              onClick={() => onToggleStatus(node.id, 'in-progress')}
              className={`py-2 px-2 text-xs font-mono uppercase border transition-all cursor-pointer ${
                node.status === 'in-progress'
                  ? 'bg-amber-700 text-white border-amber-800 font-bold'
                  : 'bg-white text-[#555] border-[#D5D2C9] hover:border-[#1A1A1A]'
              }`}
            >
              In Progress
            </button>
            <button
              onClick={() => onToggleStatus(node.id, 'mastered')}
              className={`py-2 px-2 text-xs font-mono uppercase border transition-all cursor-pointer ${
                node.status === 'mastered'
                  ? 'bg-emerald-800 text-white border-emerald-900 font-bold'
                  : 'bg-white text-[#555] border-[#D5D2C9] hover:border-[#1A1A1A]'
              }`}
            >
              Mastered ✓
            </button>
          </div>
        </div>

        {/* Concept Description */}
        <div className="space-y-2">
          <h3 className="text-xs font-mono uppercase tracking-widest text-[#777] border-b border-[#1A1A1A]/10 pb-1">
            01 / Concept & Theoretical Scope
          </h3>
          <p className="text-sm sm:text-base font-serif leading-relaxed text-[#222]">
            {node.description}
          </p>
        </div>

        {/* Key Topics checklist */}
        <div className="space-y-2">
          <h3 className="text-xs font-mono uppercase tracking-widest text-[#777] border-b border-[#1A1A1A]/10 pb-1">
            02 / Core Competency Checklist
          </h3>
          <ul className="grid grid-cols-1 gap-2 pt-1">
            {node.keyTopics.map((topic, i) => (
              <li key={i} className="flex items-start gap-2.5 text-xs sm:text-sm font-sans bg-[#F8F7F4] p-2.5 border border-[#1A1A1A]/10">
                <span className="font-mono text-[11px] font-bold text-[#777] min-w-[20px]">0{i + 1}.</span>
                <span className="font-medium text-[#1A1A1A]">{topic}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* DAG Prerequisite Lineage */}
        <div className="space-y-4">
          <h3 className="text-xs font-mono uppercase tracking-widest text-[#777] border-b border-[#1A1A1A]/10 pb-1">
            03 / DAG Prerequisite Lineage
          </h3>
          
          {/* Prerequisites (Parents) */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-mono uppercase text-[#666] flex items-center gap-1.5">
              <ArrowLeft className="w-3.5 h-3.5 text-amber-700" />
              <span>Direct Prerequisites (Must Complete First):</span>
            </span>
            {prerequisiteNodes.length === 0 ? (
              <div className="text-xs font-mono italic text-emerald-800 bg-emerald-50 border border-emerald-200 p-2.5">
                ★ Root Entry Point node — No prior prerequisites required.
              </div>
            ) : (
              <div className="space-y-1.5">
                {prerequisiteNodes.map(prereq => (
                  <button
                    key={prereq.id}
                    onClick={() => onSelectNode(prereq.id)}
                    className="w-full text-left p-2.5 bg-white hover:bg-[#F8F7F4] border border-[#1A1A1A]/30 flex justify-between items-center group transition-colors cursor-pointer"
                  >
                    <div>
                      <span className="text-[10px] font-mono text-[#777] block">{prereq.id}</span>
                      <span className="text-xs sm:text-sm font-serif font-bold text-[#1A1A1A] group-hover:underline">{prereq.label}</span>
                    </div>
                    <span className="text-xs font-mono text-[#666] group-hover:text-[#1A1A1A] flex items-center gap-1">
                      {prereq.estimatedHours}h <ArrowRight className="w-3 h-3" />
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Downstream Dependents (Children) */}
          <div className="space-y-1.5 pt-2">
            <span className="text-[11px] font-mono uppercase text-[#666] flex items-center gap-1.5">
              <ArrowRight className="w-3.5 h-3.5 text-blue-700" />
              <span>Unlocks Downstream Nodes:</span>
            </span>
            {dependentNodes.length === 0 ? (
              <div className="text-xs font-mono italic text-[#666] bg-[#F8F7F4] border border-[#E0DDD5] p-2.5">
                Terminal leaf node or track capstone.
              </div>
            ) : (
              <div className="space-y-1.5">
                {dependentNodes.map(child => (
                  <button
                    key={child.id}
                    onClick={() => onSelectNode(child.id)}
                    className="w-full text-left p-2.5 bg-white hover:bg-[#F8F7F4] border border-[#1A1A1A]/30 flex justify-between items-center group transition-colors cursor-pointer"
                  >
                    <div>
                      <span className="text-[10px] font-mono text-[#777] block">{child.id}</span>
                      <span className="text-xs sm:text-sm font-serif font-bold text-[#1A1A1A] group-hover:underline">{child.label}</span>
                    </div>
                    <span className="text-xs font-mono text-[#666] group-hover:text-[#1A1A1A] flex items-center gap-1">
                      {child.estimatedHours}h <ArrowRight className="w-3 h-3" />
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Team Application & Company Stack */}
        <div className="space-y-3 p-4 bg-[#F8F7F4] border border-[#1A1A1A]/20">
          <h3 className="text-xs font-mono uppercase tracking-widest text-[#1A1A1A] font-bold flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#1A1A1A]" />
            <span>04 / Enterprise Team Application</span>
          </h3>
          <p className="text-xs sm:text-sm text-[#333] font-serif leading-relaxed">
            {node.teamApplication}
          </p>
          {node.companyStandardStack && (
            <div className="pt-2 border-t border-[#1A1A1A]/10">
              <span className="text-[10px] font-mono uppercase tracking-wider text-[#666] block">Company Approved Standard Stack:</span>
              <span className="font-mono text-xs font-bold text-[#1A1A1A] bg-white px-2 py-1 border border-[#1A1A1A]/20 inline-block mt-1">
                {node.companyStandardStack}
              </span>
            </div>
          )}
        </div>

        {/* Practical Evaluation Rubric */}
        {node.evaluationRubric && (
          <div className="space-y-2 p-4 bg-[#1A1A1A] text-white">
            <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-[#DDD]">
              <Award className="w-4 h-4 text-amber-400" />
              <span>05 / Hands-On Evaluation Rubric</span>
            </div>
            <p className="text-xs sm:text-sm font-serif italic text-[#EEE] leading-relaxed">
              "{node.evaluationRubric}"
            </p>
            <div className="pt-2 flex items-center gap-2 text-[10px] font-mono text-[#AAA]">
              <Terminal className="w-3 h-3 text-emerald-400" />
              <span>Verified via automated CI/CD challenge repository or Lead code pairing.</span>
            </div>
          </div>
        )}

        {/* Internal Doc link */}
        {node.internalDocUrl && (
          <div className="pt-2">
            <a
              href={`https://${node.internalDocUrl}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-xs font-mono text-[#1A1A1A] border-b border-[#1A1A1A] hover:bg-[#1A1A1A] hover:text-white px-1 py-0.5 transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Internal Wiki: {node.internalDocUrl}</span>
            </a>
          </div>
        )}
      </div>

      {/* Footer Navigation */}
      <div className="p-4 border-t border-[#1A1A1A]/15 bg-[#F8F7F4] flex justify-between items-center text-xs font-mono">
        <span className="text-[#777]">SOURCE: {roadmap.githubSource}</span>
        <button
          onClick={onClose}
          className="px-4 py-2 bg-[#1A1A1A] text-white hover:bg-black uppercase font-bold tracking-wider cursor-pointer"
        >
          Done
        </button>
      </div>
    </aside>
  );
};
