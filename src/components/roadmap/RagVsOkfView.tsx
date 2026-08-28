"use client";

import React, { useState } from 'react';
import { 
  Layers, 
  GitBranch, 
  Sparkles, 
  AlertTriangle, 
  CheckCircle2, 
  ArrowRight, 
  HelpCircle, 
  Database, 
  Cpu, 
  Bot, 
  ShieldAlert,
  Send,
  RefreshCw,
  Code2,
  FileCode,
  Check,
  X,
  Zap,
  BookOpen,
  Filter,
  Terminal,
  Binary
} from 'lucide-react';
import { ARCHITECTURE_COMPARISONS, SIMULATION_QUERIES, SimulationQuery } from '@/data/architecturalComparison';
import { RAG_INTEGRATION_PIPELINE, SYSTEM_COMPARISON_TABLE } from '@/data/ragStrategyData';

type SubView = 'strategy' | 'comparison' | 'simulator';

export const RagVsOkfView: React.FC = () => {
  const [subView, setSubView] = useState<SubView>('strategy');
  const [activeStepIndex, setActiveStepIndex] = useState<number>(0);
  const [selectedQueryId, setSelectedQueryId] = useState<string>(SIMULATION_QUERIES[0].id);
  const [customPrompt, setCustomPrompt] = useState('');
  const [customResponse, setCustomResponse] = useState<SimulationQuery | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  const activeSimulation = customResponse || SIMULATION_QUERIES.find(q => q.id === selectedQueryId) || SIMULATION_QUERIES[0];
  const currentPipelineStep = RAG_INTEGRATION_PIPELINE[activeStepIndex];

  const handleRunCustomQuery = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customPrompt.trim()) return;

    setIsSimulating(true);
    setTimeout(() => {
      setCustomResponse({
        id: 'custom-' + Date.now(),
        query: customPrompt,
        category: 'Prerequisite Traversal',
        ragResponse: {
          approach: 'Vector search retrieves highest cosine similarity chunks from markdown files for query keywords.',
          pros: 'Gathers related text fragments rapidly without database schema setup.',
          cons: 'Lacks topological edge awareness; cannot guarantee prerequisite ordering.',
          simulatedOutput: `Based on semantic similarity, here are recommended topics related to "${customPrompt}": You should review the core concepts, frameworks, and deployment practices mentioned across the notes. Note that steps may not be in chronological prerequisite order.`,
          failureMode: 'Possible sequencing inversion and missing foundational dependencies.'
        },
        okfResponse: {
          approach: 'Graph traversal (BFS/Dijkstra) identifies topological predecessor nodes and direct prerequisites.',
          pros: 'Strict, mathematically guaranteed dependency order with zero hallucinations.',
          cons: 'Returns structured node IDs and edge lists without conversational explanations.',
          simulatedOutput: `CYPHER RESOLUTION: MATCH (n:SkillNode)-[:PREREQUISITE_FOR*]->(target) RETURN n.id, n.level, n.hours ORDER BY n.tier ASC;`,
          failureMode: 'Terse raw data dump lacking contextual study guidance or company wiki resources.'
        },
        hybridResponse: {
          approach: 'Step 1 (OKF Graph): Resolves exact prerequisite DAG subgraph.\nStep 2 (RAG): Populates each node with verified company notes and practical rubrics.',
          pros: 'Combines 100% prerequisite integrity with rich, personalized markdown study guides.',
          simulatedOutput: `### Verified Hybrid Solution for: "${customPrompt}"\n\n1. **Prerequisite Foundation (OKF Validated):** Verified root competencies required before proceeding.\n2. **Target Application:** Detailed breakdown using internal company stack standards.\n3. **Practical Rubric:** Concrete CI/CD verification challenge assigned for milestone sign-off.`,
          whyItWins: 'Zero sequence hallucination + rich contextual learning materials.'
        }
      });
      setIsSimulating(false);
    }, 500);
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <div className="flex-1 overflow-y-auto bg-[#FDFCFB] p-4 sm:p-8 lg:p-12 space-y-10">
      {/* Editorial Top Title & Header */}
      <section className="max-w-5xl mx-auto border-b-2 border-[#1A1A1A] pb-8 space-y-4">
        <div className="flex items-center gap-3 text-xs font-mono uppercase tracking-[0.3em] text-[#666]">
          <span className="bg-[#1A1A1A] text-white px-2 py-0.5 font-bold">TECHNICAL SPECIFICATION</span>
          <span>DATA ENGINEERING &amp; KNOWLEDGE ARCHITECTURE</span>
        </div>

        <h2 className="text-3xl sm:text-5xl font-serif italic text-[#1A1A1A] leading-tight">
          RAG Strategy &amp; OKF Knowledge Architecture
        </h2>

        <p className="text-base sm:text-lg font-serif text-[#333] leading-relaxed">
          Comprehensive implementation blueprint for transforming community roadmap JSON files into production-grade <span className="font-semibold text-[#1A1A1A]">Vector RAG Pipelines</span> and <span className="font-semibold text-[#1A1A1A]">Ontological Knowledge Frameworks (OKF)</span>.
        </p>

        {/* Sub-View Navigation Tabs */}
        <div className="flex flex-wrap gap-2 pt-4 border-t border-[#1A1A1A]/15 font-mono text-xs">
          <button
            onClick={() => setSubView('strategy')}
            className={`px-4 py-2.5 uppercase font-bold border transition-all cursor-pointer flex items-center gap-2 ${
              subView === 'strategy'
                ? 'border-[#1A1A1A] bg-[#1A1A1A] text-white shadow-sm'
                : 'border-[#1A1A1A]/20 bg-white text-[#555] hover:border-[#1A1A1A]'
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>01 / RAG Integration Strategy (Pipeline)</span>
          </button>

          <button
            onClick={() => setSubView('comparison')}
            className={`px-4 py-2.5 uppercase font-bold border transition-all cursor-pointer flex items-center gap-2 ${
              subView === 'comparison'
                ? 'border-[#1A1A1A] bg-[#1A1A1A] text-white shadow-sm'
                : 'border-[#1A1A1A]/20 bg-white text-[#555] hover:border-[#1A1A1A]'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>02 / RAG vs. OKF Comparative Analysis</span>
          </button>

          <button
            onClick={() => setSubView('simulator')}
            className={`px-4 py-2.5 uppercase font-bold border transition-all cursor-pointer flex items-center gap-2 ${
              subView === 'simulator'
                ? 'border-[#1A1A1A] bg-[#1A1A1A] text-white shadow-sm'
                : 'border-[#1A1A1A]/20 bg-white text-[#555] hover:border-[#1A1A1A]'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>03 / Interactive 3-Way Query Simulator</span>
          </button>
        </div>
      </section>

      {/* VIEW 1: RAG INTEGRATION STRATEGY (DATA PREPROCESSING, EMBEDDING, INDEXING, RETRIEVAL) */}
      {subView === 'strategy' && (
        <section className="max-w-5xl mx-auto space-y-8">
          <div className="p-6 bg-white border-2 border-[#1A1A1A] shadow-[4px_4px_0px_#1A1A1A] space-y-4">
            <div className="flex items-center justify-between border-b border-[#1A1A1A]/10 pb-3">
              <span className="font-mono text-xs uppercase tracking-widest text-[#777] font-bold">
                End-to-End Pipeline Architecture
              </span>
              <span className="font-mono text-xs bg-emerald-100 text-emerald-900 px-2 py-0.5 font-bold">
                4-STAGE INGESTION &amp; QUERY FLOW
              </span>
            </div>
            <p className="text-sm font-serif text-[#444] leading-relaxed">
              To ingest developer roadmaps into a vector search system without losing prerequisite relationships, raw JSON files must pass through a 4-step pipeline: <strong>AST Preprocessing</strong> $\to$ <strong>Hybrid Dense/Sparse Embedding</strong> $\to$ <strong>HNSW Vector Indexing</strong> $\to$ <strong>Topological Re-ranking Orchestration</strong>.
            </p>

            {/* Step Selection Tabs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 pt-2">
              {RAG_INTEGRATION_PIPELINE.map((step, idx) => (
                <button
                  key={step.stepNumber}
                  onClick={() => setActiveStepIndex(idx)}
                  className={`p-3 text-left border text-xs font-mono transition-all cursor-pointer space-y-1 ${
                    activeStepIndex === idx
                      ? 'border-[#1A1A1A] bg-[#F8F7F4] shadow-sm font-bold'
                      : 'border-[#E5E3DC] bg-white text-[#666] hover:border-[#1A1A1A]'
                  }`}
                >
                  <div className="text-[10px] text-[#888]">STEP 0{step.stepNumber}</div>
                  <div className="text-xs text-[#1A1A1A] leading-snug">{step.title.split('&')[0]}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Active Step Deep-Dive Card */}
          <div className="p-6 sm:p-8 bg-white border-2 border-[#1A1A1A] space-y-6">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 border-b border-[#1A1A1A]/15 pb-4">
              <div>
                <span className="text-xs font-mono uppercase tracking-widest text-[#777] block font-bold">
                  Stage 0{currentPipelineStep.stepNumber} of 04
                </span>
                <h3 className="text-2xl font-serif italic text-[#1A1A1A] mt-0.5">
                  {currentPipelineStep.title}
                </h3>
                <p className="text-xs font-mono text-emerald-800 font-semibold mt-0.5">
                  {currentPipelineStep.subtitle}
                </p>
              </div>
            </div>

            {/* Step Summary */}
            <p className="text-sm sm:text-base font-serif text-[#333] leading-relaxed bg-[#F8F7F4] p-4 border border-[#1A1A1A]/15">
              {currentPipelineStep.summary}
            </p>

            {/* Technical Specifications Checklist */}
            <div className="space-y-2">
              <h4 className="text-xs font-mono uppercase tracking-wider text-[#1A1A1A] font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                <span>Technical Implementation Checklist:</span>
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {currentPipelineStep.technicalDetails.map((detail, dIdx) => (
                  <div key={dIdx} className="p-3 bg-[#FDFCFB] border border-[#1A1A1A]/10 text-xs font-serif text-[#444] flex items-start gap-2.5">
                    <span className="font-mono text-[10px] font-bold text-[#1A1A1A] mt-0.5">[{dIdx + 1}]</span>
                    <span>{detail}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Code Implementation Box */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs font-mono">
                <span className="text-[11px] uppercase font-bold text-[#1A1A1A] flex items-center gap-1.5">
                  <Code2 className="w-3.5 h-3.5 text-blue-700" />
                  <span>Production Code Implementation ({currentPipelineStep.codeLanguage}):</span>
                </span>
                <button
                  onClick={() => copyCode(currentPipelineStep.codeSample)}
                  className="px-2.5 py-1 bg-[#1A1A1A] text-white text-[10px] hover:bg-[#333] transition-colors cursor-pointer flex items-center gap-1"
                >
                  {copiedCode ? <Check className="w-3 h-3 text-emerald-400" /> : null}
                  <span>{copiedCode ? 'Copied' : 'Copy Code'}</span>
                </button>
              </div>

              <pre className="p-4 bg-[#1A1A1A] text-[#EEE] font-mono text-[11px] overflow-x-auto leading-relaxed border border-black max-h-96">
                {currentPipelineStep.codeSample}
              </pre>
            </div>

            {/* Pitfalls Callout */}
            <div className="p-4 bg-rose-50 border border-rose-200 space-y-2">
              <h5 className="text-xs font-mono uppercase tracking-wider text-rose-900 font-bold flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-700" />
                <span>Anti-Patterns &amp; Pitfalls to Avoid:</span>
              </h5>
              <ul className="space-y-1 text-xs font-serif text-rose-950">
                {currentPipelineStep.pitfallsToAvoid.map((pitfall, pIdx) => (
                  <li key={pIdx} className="flex items-start gap-2">
                    <span className="text-rose-600 font-bold">•</span>
                    <span>{pitfall}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>
      )}

      {/* VIEW 2: DEEP RAG VS OKF COMPARATIVE ANALYSIS */}
      {subView === 'comparison' && (
        <section className="max-w-5xl mx-auto space-y-8">
          {/* Conceptual Essay Introduction */}
          <div className="p-6 bg-white border-2 border-[#1A1A1A] shadow-[4px_4px_0px_#1A1A1A] space-y-4">
            <h3 className="text-2xl font-serif italic text-[#1A1A1A]">
              Vector Space vs. Directed Topology: The Fundamental Mathematical Conflict
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs font-serif text-[#333] leading-relaxed">
              <div className="space-y-2 p-4 bg-[#F8F7F4] border border-[#1A1A1A]/10">
                <strong className="font-mono text-xs uppercase block text-[#1A1A1A] pb-1 border-b border-[#1A1A1A]/10">
                  RAG: Continuous Vector Space (R^d)
                </strong>
                <p className="space-y-1">
                  <span>Retrieval in standard RAG computes the dot product / cosine similarity between embeddings:</span>
                  <code className="block p-1.5 bg-white border border-[#1A1A1A]/20 font-mono text-[10px] my-1">
                    {'sim(q, d) = (q · d) / (||q|| * ||d||)'}
                  </code>
                  <span><strong>The Flaw:</strong> Cosine similarity is non-directional (sim(A, B) = sim(B, A)). It measures <em>topical relevance</em>, but is mathematically blind to <em>directed causal dependencies</em> (whether A must precede B).</span>
                </p>
              </div>

              <div className="space-y-2 p-4 bg-[#F8F7F4] border border-[#1A1A1A]/10">
                <strong className="font-mono text-xs uppercase block text-[#1A1A1A] pb-1 border-b border-[#1A1A1A]/10">
                  OKF: Directed Acyclic Graph (G = (V, E))
                </strong>
                <p className="space-y-1">
                  <span>Ontological Knowledge Frameworks store skill nodes V and directed prerequisite edges E. Prerequisite resolution computes topological sorting via Kahn's algorithm or adjacency matrix powers:</span>
                  <code className="block p-1.5 bg-white border border-[#1A1A1A]/20 font-mono text-[10px] my-1">
                    {'Prereqs(v) = { u ∈ V | (u, v) ∈ E+ }'}
                  </code>
                  <span><strong>The Power:</strong> 100% deterministic, cycle-free prerequisite guarantees with zero LLM hallucination.</span>
                </p>
              </div>
            </div>
          </div>

          {/* Deep Comparative Analysis Table */}
          <div className="space-y-4">
            <div className="flex justify-between items-baseline border-b border-[#1A1A1A]/20 pb-2">
              <h4 className="font-serif italic text-xl text-[#1A1A1A]">
                Comprehensive Architecture Comparison Matrix
              </h4>
              <span className="text-xs font-mono text-[#777]">5 CRITICAL EVALUATION VECTORS</span>
            </div>

            <div className="space-y-4">
              {SYSTEM_COMPARISON_TABLE.map((item, idx) => (
                <div key={idx} className="p-5 bg-white border-2 border-[#1A1A1A] space-y-4">
                  <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 border-b border-[#1A1A1A]/10 pb-2">
                    <span className="font-mono text-sm font-bold text-[#1A1A1A] flex items-center gap-2">
                      <span className="w-5 h-5 bg-[#1A1A1A] text-white text-[10px] flex items-center justify-center font-mono">
                        0{idx + 1}
                      </span>
                      <span>{item.dimension}</span>
                    </span>
                    <span className="text-[10px] font-mono bg-emerald-100 text-emerald-900 px-2 py-0.5 font-bold self-start sm:self-auto">
                      HYBRID WINNER: {item.hybridGraphRag.verdict}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                    {/* Pure RAG */}
                    <div className="p-3.5 bg-amber-50/50 border border-amber-200 space-y-2">
                      <div className="flex justify-between items-center font-mono">
                        <span className="font-bold text-amber-900 uppercase text-[10px]">Pure RAG Approach</span>
                        <span className="text-[10px] bg-amber-200 text-amber-900 px-1.5 py-0.5 font-bold">
                          {item.pureRag.score}/10
                        </span>
                      </div>
                      <p className="font-serif text-[#333] leading-relaxed text-[11px]">
                        {item.pureRag.details}
                      </p>
                      <div className="pt-2 border-t border-amber-200 text-[10px] font-mono space-y-1">
                        <div className="text-emerald-800 font-bold">✓ Pro: {item.pureRag.pros}</div>
                        <div className="text-rose-800 font-bold">✗ Con: {item.pureRag.cons}</div>
                      </div>
                    </div>

                    {/* Pure OKF */}
                    <div className="p-3.5 bg-blue-50/50 border border-blue-200 space-y-2">
                      <div className="flex justify-between items-center font-mono">
                        <span className="font-bold text-blue-900 uppercase text-[10px]">Pure OKF Approach</span>
                        <span className="text-[10px] bg-blue-200 text-blue-900 px-1.5 py-0.5 font-bold">
                          {item.pureOkf.score}/10
                        </span>
                      </div>
                      <p className="font-serif text-[#333] leading-relaxed text-[11px]">
                        {item.pureOkf.details}
                      </p>
                      <div className="pt-2 border-t border-blue-200 text-[10px] font-mono space-y-1">
                        <div className="text-emerald-800 font-bold">✓ Pro: {item.pureOkf.pros}</div>
                        <div className="text-rose-800 font-bold">✗ Con: {item.pureOkf.cons}</div>
                      </div>
                    </div>

                    {/* Hybrid GraphRAG */}
                    <div className="p-3.5 bg-emerald-50/50 border-2 border-emerald-600 space-y-2">
                      <div className="flex justify-between items-center font-mono">
                        <span className="font-bold text-emerald-950 uppercase text-[10px]">Hybrid GraphRAG</span>
                        <span className="text-[10px] bg-emerald-700 text-white px-1.5 py-0.5 font-bold">
                          {item.hybridGraphRag.score}/10
                        </span>
                      </div>
                      <p className="font-serif text-[#222] leading-relaxed text-[11px]">
                        {item.hybridGraphRag.details}
                      </p>
                      <div className="pt-2 border-t border-emerald-300 text-[10px] font-mono text-emerald-900 font-bold">
                        ★ Combines deterministic DAG sequencing with rich markdown context.
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* VIEW 3: INTERACTIVE 3-WAY QUERY SIMULATOR */}
      {subView === 'simulator' && (
        <section className="max-w-5xl mx-auto space-y-8">
          <div className="border-b border-[#1A1A1A]/20 pb-3 flex flex-col sm:flex-row justify-between sm:items-center gap-2">
            <div>
              <h3 className="text-2xl font-serif italic text-[#1A1A1A]">
                Interactive 3-Way Query Simulator
              </h3>
              <p className="text-xs font-mono text-[#666] mt-0.5">
                Observe how Pure RAG, Pure OKF, and Hybrid GraphRAG process the exact same developer query in real time
              </p>
            </div>
            <span className="text-xs font-mono bg-[#1A1A1A] text-white px-2 py-0.5 font-bold self-start sm:self-auto">
              TEST SUITE
            </span>
          </div>

          {/* Preset Queries Bar */}
          <div className="space-y-2">
            <span className="text-xs font-mono uppercase tracking-wider text-[#777] font-bold block">
              Select Sample Benchmark Query:
            </span>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              {SIMULATION_QUERIES.map((sq, idx) => (
                <button
                  key={sq.id}
                  onClick={() => { setSelectedQueryId(sq.id); setCustomResponse(null); }}
                  className={`p-3 text-left border text-xs font-serif transition-all cursor-pointer space-y-1 ${
                    selectedQueryId === sq.id && !customResponse
                      ? 'border-[#1A1A1A] bg-[#F8F7F4] shadow-sm font-bold'
                      : 'border-[#E5E3DC] bg-white text-[#555] hover:border-[#1A1A1A]'
                  }`}
                >
                  <div className="text-[10px] font-mono text-emerald-800 uppercase">
                    Test 0{idx + 1}: {sq.category}
                  </div>
                  <div className="text-xs text-[#1A1A1A] line-clamp-2">
                    "{sq.query}"
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Custom Query Prompt Input */}
          <form onSubmit={handleRunCustomQuery} className="p-4 bg-white border-2 border-[#1A1A1A] flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              placeholder="Or test a custom developer question (e.g. 'I want to learn Redis queues after FastAPI')..."
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              className="flex-1 px-3 py-2 bg-[#F8F7F4] border border-[#1A1A1A]/30 text-xs font-mono focus:outline-none focus:border-[#1A1A1A]"
            />
            <button
              type="submit"
              disabled={isSimulating}
              className="px-5 py-2 bg-[#1A1A1A] text-white text-xs font-mono font-bold uppercase hover:bg-[#333] transition-colors cursor-pointer flex items-center justify-center gap-2 shrink-0 disabled:opacity-50"
            >
              {isSimulating ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
              <span>{isSimulating ? 'Simulating...' : 'Run Simulation'}</span>
            </button>
          </form>

          {/* Active Query Display */}
          <div className="p-4 bg-[#F8F7F4] border border-[#1A1A1A]/20 text-xs font-mono flex items-center gap-2">
            <strong className="text-[#1A1A1A] uppercase">Active Test Query:</strong>
            <span className="text-[#333] font-serif italic">"{activeSimulation.query}"</span>
          </div>

          {/* 3-Column Simulator Output */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* 1. Pure RAG Output */}
            <div className="p-5 bg-white border-2 border-[#1A1A1A] space-y-3">
              <div className="flex justify-between items-center border-b border-[#1A1A1A]/10 pb-2">
                <span className="font-mono text-xs font-bold text-amber-900 uppercase">
                  01 / Pure RAG (Vector Only)
                </span>
                <span className="text-[10px] font-mono bg-amber-100 text-amber-900 px-1.5 py-0.5 font-bold">
                  Cosine Similarity
                </span>
              </div>
              <div className="text-[11px] font-serif text-[#555] space-y-1">
                <strong className="font-mono text-[10px] text-[#1A1A1A] block">Retrieval Mechanism:</strong>
                <p>{activeSimulation.ragResponse.approach}</p>
              </div>
              <div className="p-3 bg-amber-50/50 border border-amber-200 text-xs font-mono text-[#222] whitespace-pre-wrap leading-relaxed">
                {activeSimulation.ragResponse.simulatedOutput}
              </div>
              <div className="p-2.5 bg-rose-50 border border-rose-200 text-[10px] font-mono text-rose-900">
                <strong className="block text-rose-950 mb-0.5">Failure Vulnerability:</strong>
                {activeSimulation.ragResponse.failureMode}
              </div>
            </div>

            {/* 2. Pure OKF Output */}
            <div className="p-5 bg-white border-2 border-[#1A1A1A] space-y-3">
              <div className="flex justify-between items-center border-b border-[#1A1A1A]/10 pb-2">
                <span className="font-mono text-xs font-bold text-blue-900 uppercase">
                  02 / Pure OKF (Graph Only)
                </span>
                <span className="text-[10px] font-mono bg-blue-100 text-blue-900 px-1.5 py-0.5 font-bold">
                  Cypher / BFS
                </span>
              </div>
              <div className="text-[11px] font-serif text-[#555] space-y-1">
                <strong className="font-mono text-[10px] text-[#1A1A1A] block">Retrieval Mechanism:</strong>
                <p>{activeSimulation.okfResponse.approach}</p>
              </div>
              <div className="p-3 bg-blue-50/50 border border-blue-200 text-xs font-mono text-[#222] whitespace-pre-wrap leading-relaxed">
                {activeSimulation.okfResponse.simulatedOutput}
              </div>
              <div className="p-2.5 bg-amber-50 border border-amber-200 text-[10px] font-mono text-amber-900">
                <strong className="block text-amber-950 mb-0.5">Usability Constraint:</strong>
                {activeSimulation.okfResponse.failureMode}
              </div>
            </div>

            {/* 3. Hybrid GraphRAG Output */}
            <div className="p-5 bg-white border-2 border-emerald-700 shadow-[4px_4px_0px_#059669] space-y-3">
              <div className="flex justify-between items-center border-b border-emerald-200 pb-2">
                <span className="font-mono text-xs font-bold text-emerald-950 uppercase flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-700" />
                  <span>03 / Hybrid GraphRAG</span>
                </span>
                <span className="text-[10px] font-mono bg-emerald-700 text-white px-1.5 py-0.5 font-bold">
                  Optimal Standard
                </span>
              </div>
              <div className="text-[11px] font-serif text-[#555] space-y-1">
                <strong className="font-mono text-[10px] text-emerald-950 block">Retrieval Mechanism:</strong>
                <p>{activeSimulation.hybridResponse.approach}</p>
              </div>
              <div className="p-3 bg-emerald-50 border border-emerald-300 text-xs font-mono text-emerald-950 whitespace-pre-wrap leading-relaxed">
                {activeSimulation.hybridResponse.simulatedOutput}
              </div>
              <div className="p-2.5 bg-emerald-100 text-[10px] font-mono text-emerald-950">
                <strong className="block font-bold mb-0.5">Why It Wins:</strong>
                {activeSimulation.hybridResponse.whyItWins || 'Zero sequence hallucination + rich contextual learning materials.'}
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
};
