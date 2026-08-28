"use client";

import React from 'react';
import Link from 'next/link';
import { 
  GitBranch, 
  Network, 
  Layers, 
  Compass, 
  Sparkles, 
  CheckCircle2, 
  ArrowRight, 
  ShieldCheck, 
  Zap, 
  BookOpen, 
  BrainCircuit,
  Cpu
} from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#FDFCFB] text-[#1A1A1A] font-sans flex flex-col selection:bg-[#1A1A1A] selection:text-white">
      {/* Top Editorial Banner */}
      <div className="border-b border-[#1A1A1A]/15 bg-[#F8F7F4] py-2 px-4 sm:px-8 text-center text-xs font-mono tracking-wider uppercase text-[#555] flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>HCLTECH HACKATHON 2026 • AI-POWERED PERSONALIZED LEARNING ENGINE</span>
        </div>
        <div className="flex items-center gap-4 text-[11px]">
          <span>BAYESIAN KNOWLEDGE TRACING (BKT)</span>
          <span>•</span>
          <span>HYBRID GRAPHRAG + OKF</span>
        </div>
      </div>

      {/* Hero Section */}
      <header className="px-6 sm:px-12 lg:px-20 pt-16 pb-20 border-b border-[#1A1A1A]/10 bg-gradient-to-b from-[#FDFCFB] to-[#F8F7F4]">
        <div className="max-w-5xl mx-auto space-y-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#1A1A1A] text-white text-xs font-mono uppercase tracking-widest">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            <span>Topological Knowledge Runtime</span>
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-serif italic tracking-tight leading-[1.08] text-[#1A1A1A]">
            Adaptive Learning Intelligence Engine
          </h1>

          <p className="text-lg sm:text-xl text-[#555] font-serif leading-relaxed max-w-3xl">
            Instead of trusting what learners claim they know, our system measures empirical mastery with <strong className="text-[#1A1A1A]">Bayesian Knowledge Tracing</strong>, identifies graph bottlenecks, and generates prerequisite-safe <strong className="text-[#1A1A1A]">Directed Acyclic Graphs (DAG)</strong> under real-world time constraints.
          </p>

          {/* Action CTAs */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-4">
            <Link
              href="/onboarding"
              className="px-8 py-4 bg-[#1A1A1A] hover:bg-black text-white rounded-xl font-mono text-xs uppercase tracking-widest font-bold flex items-center justify-center gap-3 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 cursor-pointer"
            >
              <span>Launch Conversational Onboarding</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              href="/dashboard"
              className="px-8 py-4 bg-white border-2 border-[#1A1A1A] text-[#1A1A1A] hover:bg-[#F8F7F4] rounded-xl font-mono text-xs uppercase tracking-widest font-bold flex items-center justify-center gap-3 transition-all cursor-pointer"
            >
              <GitBranch className="w-4 h-4" />
              <span>Explore DAG Roadmaps</span>
            </Link>
          </div>

          {/* Core Architectural Pillars */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-10 border-t border-[#1A1A1A]/10 text-xs font-mono">
            <div className="p-4 bg-white border border-[#1A1A1A]/10 rounded-lg">
              <div className="text-[#888] uppercase text-[10px]">Deterministic Core</div>
              <div className="text-base font-bold text-[#1A1A1A] mt-1">100% Pure TS</div>
              <div className="text-[#666] text-[11px] mt-0.5">Topological sort & BKT</div>
            </div>

            <div className="p-4 bg-white border border-[#1A1A1A]/10 rounded-lg">
              <div className="text-[#888] uppercase text-[10px]">Anti-Hallucination</div>
              <div className="text-base font-bold text-[#1A1A1A] mt-1">Grounded RAG</div>
              <div className="text-[#666] text-[11px] mt-0.5">Supabase pgvector (768-d)</div>
            </div>

            <div className="p-4 bg-white border border-[#1A1A1A]/10 rounded-lg">
              <div className="text-[#888] uppercase text-[10px]">Multi-AI Failover</div>
              <div className="text-base font-bold text-[#1A1A1A] mt-1">Gemini + Groq</div>
              <div className="text-[#666] text-[11px] mt-0.5">Dual LLM Circuit Breaker</div>
            </div>

            <div className="p-4 bg-white border border-[#1A1A1A]/10 rounded-lg">
              <div className="text-[#888] uppercase text-[10px]">Adaptive replanning</div>
              <div className="text-base font-bold text-[#1A1A1A] mt-1">BKT Calibration</div>
              <div className="text-[#666] text-[11px] mt-0.5">Evidence-driven updates</div>
            </div>
          </div>
        </div>
      </header>

      {/* Feature Showcase Grid */}
      <section className="max-w-6xl mx-auto px-6 sm:px-12 py-20">
        <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
          <p className="text-xs font-mono uppercase tracking-[0.2em] text-[#777]">Architecture & System Design</p>
          <h2 className="text-3xl sm:text-4xl font-serif italic text-[#1A1A1A]">
            Engineered for Top-Tier Evaluation Rubric
          </h2>
          <p className="text-sm text-[#666] font-serif leading-relaxed">
            Every module is auditable, deterministic, and free of arbitrary LLM hallucination.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1 */}
          <div className="p-8 bg-white border border-[#1A1A1A]/15 rounded-2xl shadow-sm space-y-4 hover:border-[#1A1A1A] transition-all">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center justify-center font-mono">
              <BrainCircuit className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-serif font-bold text-[#1A1A1A]">Bayesian Knowledge Tracing</h3>
            <p className="text-xs text-[#666] leading-relaxed font-sans">
              Calculates probability of skill acquisition P(known) with slip, guess, and transition learning rates across diagnostics and course completions.
            </p>
          </div>

          {/* Card 2 */}
          <div className="p-8 bg-white border border-[#1A1A1A]/15 rounded-2xl shadow-sm space-y-4 hover:border-[#1A1A1A] transition-all">
            <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-800 border border-indigo-200 flex items-center justify-center font-mono">
              <GitBranch className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-serif font-bold text-[#1A1A1A]">Topological DAG Visualizer</h3>
            <p className="text-xs text-[#666] leading-relaxed font-sans">
              Layered graph layout resolving transitive prerequisites, automatic cycle detection, and bottleneck blocking score calculations.
            </p>
          </div>

          {/* Card 3 */}
          <div className="p-8 bg-white border border-[#1A1A1A]/15 rounded-2xl shadow-sm space-y-4 hover:border-[#1A1A1A] transition-all">
            <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-800 border border-purple-200 flex items-center justify-center font-mono">
              <Layers className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-serif font-bold text-[#1A1A1A]">Cross-Discipline Knowledge Graph</h3>
            <p className="text-xs text-[#666] leading-relaxed font-sans">
              Connects Frontend, Backend, AI/ML, DevOps, and Cybersecurity into a unified skill ontology powered by kamranahmedse/developer-roadmap.
            </p>
          </div>
        </div>
      </section>

      {/* Minimal Editorial Footer */}
      <footer className="border-t border-[#1A1A1A]/15 bg-[#F8F7F4] py-6 px-6 sm:px-12 flex flex-col sm:flex-row justify-between items-center text-xs font-mono text-[#666] tracking-wider uppercase gap-4 mt-auto">
        <div className="flex items-center gap-3">
          <span>HCLTECH HACKATHON 2026</span>
          <span>•</span>
          <span>ADAPTIVE LEARNING INTELLIGENCE ENGINE</span>
        </div>
        <div className="flex items-center gap-6">
          <Link href="/onboarding" className="hover:text-[#1A1A1A] underline">Onboarding</Link>
          <Link href="/dashboard" className="hover:text-[#1A1A1A] underline">DAG Dashboard</Link>
        </div>
      </footer>
    </div>
  );
}
