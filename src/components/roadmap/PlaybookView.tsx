"use client";

import React, { useState } from 'react';
import { 
  BookOpen, 
  Terminal, 
  Copy, 
  Check, 
  CheckCircle2, 
  Code2, 
  Sparkles, 
  Lightbulb, 
  ArrowRight,
  ShieldCheck
} from 'lucide-react';
import { PLAYBOOK_STEPS, PlaybookStep } from '@/data/bestPractices';

export const PlaybookView: React.FC = () => {
  const [selectedStepIndex, setSelectedStepIndex] = useState<number>(0);
  const [copiedCode, setCopiedCode] = useState<boolean>(false);

  const activeStep = PLAYBOOK_STEPS[selectedStepIndex] || PLAYBOOK_STEPS[0];

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <div className="flex-1 overflow-y-auto bg-[#FDFCFB] p-4 sm:p-8 lg:p-12 space-y-12">
      {/* Editorial Header */}
      <section className="max-w-5xl mx-auto border-b-2 border-[#1A1A1A] pb-8 space-y-4">
        <div className="flex items-center gap-3 text-xs font-mono uppercase tracking-[0.3em] text-[#666]">
          <span className="bg-[#1A1A1A] text-white px-2 py-0.5 font-bold">ENGINEERING PLAYBOOK</span>
          <span>PRODUCTION RECIPES &amp; CI/CD AUTOMATION</span>
        </div>

        <h2 className="text-3xl sm:text-5xl font-serif italic text-[#1A1A1A] leading-tight">
          6 High-Leverage Ways to Make Your Roadmap Work Exceptional
        </h2>

        <p className="text-base sm:text-lg font-serif text-[#333] leading-relaxed">
          Beyond downloading raw JSON files, here are the <span className="font-semibold text-[#1A1A1A]">6 concrete technical initiatives</span> that turn your roadmap project into a world-class enterprise competency engine.
        </p>

        {/* Step Selector Horizontal Pills */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2 pt-4">
          {PLAYBOOK_STEPS.map((step, idx) => {
            const isSelected = idx === selectedStepIndex;
            return (
              <button
                key={step.stepNumber}
                onClick={() => setSelectedStepIndex(idx)}
                className={`p-3 text-left border-2 transition-all cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? 'border-[#1A1A1A] bg-[#1A1A1A] text-white shadow-[3px_3px_0px_#1A1A1A]'
                    : 'border-[#1A1A1A]/30 bg-white text-[#1A1A1A] hover:border-[#1A1A1A]'
                }`}
              >
                <span className={`text-[10px] font-mono font-bold block ${isSelected ? 'text-amber-400' : 'text-[#777]'}`}>
                  STEP {step.stepNumber}
                </span>
                <span className="font-serif font-bold text-xs leading-snug line-clamp-2 mt-1">
                  {step.subtitle}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* Active Step Deep Dive & Code Terminal */}
      <section className="max-w-5xl mx-auto space-y-6">
        <div className="p-6 sm:p-8 bg-[#F8F7F4] border-2 border-[#1A1A1A] space-y-6">
          <div className="flex flex-col sm:flex-row justify-between sm:items-baseline border-b border-[#1A1A1A]/20 pb-4 gap-2">
            <div>
              <span className="text-xs font-mono uppercase tracking-widest text-[#777] font-bold">
                INITIATIVE {activeStep.stepNumber} / {activeStep.subtitle}
              </span>
              <h3 className="text-2xl sm:text-3xl font-serif italic font-bold text-[#1A1A1A] mt-1">
                {activeStep.title}
              </h3>
            </div>
            <span className="text-xs font-mono bg-[#1A1A1A] text-white px-2.5 py-1 font-bold">
              {activeStep.codeLanguage.toUpperCase()} IMPLEMENTATION
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs sm:text-sm font-sans">
            <div className="space-y-2">
              <span className="font-mono text-[11px] font-bold uppercase text-[#777] block">The Problem &amp; Summary:</span>
              <p className="text-[#333] font-serif leading-relaxed text-sm sm:text-base">
                {activeStep.summary}
              </p>
            </div>
            <div className="space-y-2">
              <span className="font-mono text-[11px] font-bold uppercase text-[#777] block">Why This Matters to Your Team:</span>
              <p className="text-[#333] font-serif leading-relaxed text-sm sm:text-base bg-white p-3 border border-[#1A1A1A]/15">
                {activeStep.whyItMatters}
              </p>
            </div>
          </div>

          {/* Code Snippet Box */}
          <div className="border-2 border-[#1A1A1A] bg-[#1A1A1A] text-white space-y-2">
            <div className="p-3 bg-[#242424] border-b border-white/10 flex justify-between items-center text-xs font-mono">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-emerald-400" />
                <span className="text-[#CCC] font-bold">Production Code Reference</span>
                <span className="text-[#777]">({activeStep.codeLanguage})</span>
              </div>
              <button
                onClick={() => handleCopyCode(activeStep.codeSnippet)}
                className="px-3 py-1 bg-white/10 hover:bg-white/20 border border-white/20 text-xs font-mono uppercase font-bold flex items-center gap-1.5 cursor-pointer text-white transition-colors"
              >
                {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedCode ? 'Copied' : 'Copy Code'}</span>
              </button>
            </div>

            <pre className="p-4 font-mono text-xs text-[#EAEAEA] overflow-x-auto leading-relaxed max-h-[380px] selection:bg-white selection:text-black">
              {activeStep.codeSnippet}
            </pre>
          </div>

          {/* Pro Tips */}
          <div className="p-4 bg-amber-50/70 border border-amber-300 space-y-2">
            <span className="text-xs font-mono uppercase tracking-wider font-bold text-amber-950 flex items-center gap-1.5">
              <Lightbulb className="w-4 h-4 text-amber-700" />
              <span>Pro Engineering Tips:</span>
            </span>
            <ul className="space-y-1.5 text-xs font-sans text-amber-950">
              {activeStep.tips.map((tip, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="font-mono text-amber-800 font-bold">•</span>
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Summary Recap Checklist */}
      <section className="max-w-5xl mx-auto p-6 bg-white border-2 border-[#1A1A1A] space-y-4">
        <h4 className="font-serif italic font-bold text-xl text-[#1A1A1A] border-b border-[#1A1A1A]/10 pb-2">
          Your Immediate Next Steps Checklist:
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs font-sans">
          <div className="flex items-start gap-2 p-2.5 bg-[#F8F7F4] border border-[#1A1A1A]/10">
            <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
            <span>1. Run the Python DAG Cycle Validator script on your 8 roadmap JSON files.</span>
          </div>
          <div className="flex items-start gap-2 p-2.5 bg-[#F8F7F4] border border-[#1A1A1A]/10">
            <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
            <span>2. Enrich node definitions with internal company stack standards and Confluence URLs.</span>
          </div>
          <div className="flex items-start gap-2 p-2.5 bg-[#F8F7F4] border border-[#1A1A1A]/10">
            <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
            <span>3. Export the Neo4j Cypher graph script to populate your internal skill ontology.</span>
          </div>
          <div className="flex items-start gap-2 p-2.5 bg-[#F8F7F4] border border-[#1A1A1A]/10">
            <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
            <span>4. Implement the Hybrid GraphRAG pipeline: Graph for DAG paths, Vector DB for notes.</span>
          </div>
        </div>
      </section>
    </div>
  );
};
