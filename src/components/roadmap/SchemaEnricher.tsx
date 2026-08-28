"use client";

import React, { useState } from 'react';
import { 
  FileCode2, 
  Download, 
  Copy, 
  Check, 
  Sparkles, 
  Database, 
  FileText, 
  Edit3, 
  CheckCircle2,
  ArrowRight,
  Code2
} from 'lucide-react';
import { RoadmapPath, RoadmapNode } from '@/data/roadmapsData';

interface SchemaEnricherProps {
  roadmap: RoadmapPath;
  onUpdateNode: (updatedNode: RoadmapNode) => void;
}

export const SchemaEnricher: React.FC<SchemaEnricherProps> = ({ roadmap, onUpdateNode }) => {
  const [selectedNodeId, setSelectedNodeId] = useState<string>(roadmap.nodes[0]?.id || '');
  const [copiedFormat, setCopiedFormat] = useState<string | null>(null);

  const activeNode = roadmap.nodes.find(n => n.id === selectedNodeId) || roadmap.nodes[0];

  // Raw GitHub JSON format sample
  const rawCommunityJsonSample = {
    title: activeNode?.label || 'Python Basics',
    description: activeNode?.description || 'Learn variables, loops, functions...',
    resources: [
      'https://docs.python.org/3/',
      'https://realpython.com/'
    ]
  };

  // Enriched Enterprise Schema format
  const enrichedEnterpriseJsonSample = {
    id: activeNode?.id,
    label: activeNode?.label,
    category: activeNode?.category,
    level: activeNode?.level,
    prerequisites: activeNode?.prerequisites,
    estimatedHours: activeNode?.estimatedHours,
    importance: activeNode?.importance,
    description: activeNode?.description,
    keyTopics: activeNode?.keyTopics,
    teamApplication: activeNode?.teamApplication,
    companyStandardStack: activeNode?.companyStandardStack || 'Company Approved Stack',
    evaluationRubric: activeNode?.evaluationRubric || 'Verifiable challenge for milestone sign-off',
    internalDocUrl: activeNode?.internalDocUrl || 'wiki.internal/engineering'
  };

  const handleCopy = (text: string, formatName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedFormat(formatName);
    setTimeout(() => setCopiedFormat(null), 2000);
  };

  const handleDownloadJson = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(roadmap, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `${roadmap.id}-enriched-schema.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleDownloadCypher = () => {
    let cypher = `// Neo4j Cypher Ingestion Script for ${roadmap.title}\n`;
    cypher += `CREATE CONSTRAINT unique_node_id IF NOT EXISTS FOR (n:SkillNode) REQUIRE n.id IS UNIQUE;\n\n`;
    
    roadmap.nodes.forEach(n => {
      cypher += `MERGE (n:SkillNode {id: "${n.id}"})\n`;
      cypher += `SET n.label = "${n.label.replace(/"/g, '\\"')}",\n`;
      cypher += `    n.category = "${n.category}",\n`;
      cypher += `    n.level = "${n.level}",\n`;
      cypher += `    n.hours = ${n.estimatedHours},\n`;
      cypher += `    n.companyStack = "${(n.companyStandardStack || '').replace(/"/g, '\\"')}";\n\n`;
    });

    roadmap.nodes.forEach(n => {
      n.prerequisites.forEach(prereqId => {
        cypher += `MATCH (p:SkillNode {id: "${prereqId}"}), (c:SkillNode {id: "${n.id}"})\n`;
        cypher += `MERGE (p)-[:PREREQUISITE_FOR]->(c);\n`;
      });
    });

    const dataStr = "data:text/plain;charset=utf-8," + encodeURIComponent(cypher);
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `${roadmap.id}-neo4j-graph.cql`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleDownloadMarkdown = () => {
    let md = `# Enterprise Engineering Roadmap: ${roadmap.title}\n\n`;
    md += `**Role:** ${roadmap.role} | **Total Hours:** ${roadmap.totalHours}h | **Modules:** ${roadmap.nodes.length}\n\n`;
    md += `## Topological Prerequisite Path\n\n`;

    roadmap.nodes.forEach((n, idx) => {
      md += `### ${idx + 1}. ${n.label} (${n.level} - ${n.estimatedHours}h)\n`;
      md += `- **Category:** ${n.category}\n`;
      md += `- **Prerequisites:** ${n.prerequisites.join(', ') || 'None (Root)'}\n`;
      md += `- **Company Approved Stack:** \`${n.companyStandardStack || 'Standard'}\`\n`;
      md += `- **Team Application:** ${n.teamApplication}\n`;
      md += `- **Practical Rubric:** *${n.evaluationRubric}*\n`;
      md += `- **Key Competencies:**\n`;
      n.keyTopics.forEach(t => {
        md += `  - [ ] ${t}\n`;
      });
      md += `\n---\n\n`;
    });

    const dataStr = "data:text/markdown;charset=utf-8," + encodeURIComponent(md);
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `${roadmap.id}-team-syllabus.md`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="flex-1 overflow-y-auto bg-[#FDFCFB] p-4 sm:p-8 lg:p-12 space-y-12">
      {/* Editorial Header */}
      <section className="max-w-5xl mx-auto border-b-2 border-[#1A1A1A] pb-8 space-y-4">
        <div className="flex items-center gap-3 text-xs font-mono uppercase tracking-[0.3em] text-[#666]">
          <span className="bg-[#1A1A1A] text-white px-2 py-0.5 font-bold">SCHEMA TRANSFORMATION STUDIO</span>
          <span>DATA ENGINEERING PIPELINE</span>
        </div>

        <h2 className="text-3xl sm:text-5xl font-serif italic text-[#1A1A1A] leading-tight">
          Transforming Raw Roadmap JSON into Enterprise-Ready Schemas
        </h2>

        <p className="text-base sm:text-lg font-serif text-[#333] leading-relaxed">
          Community JSON roadmaps downloaded from GitHub are designed for generic consumer visualizers. 
          To make them truly useful for engineering teams, you must enrich them with <span className="font-semibold text-[#1A1A1A]">topological prerequisite DAG edges, internal company tech stacks, hands-on evaluation rubrics, and documentation URLs</span>.
        </p>

        {/* 5-Step Action Checklist */}
        <div className="p-6 bg-[#F8F7F4] border-2 border-[#1A1A1A] space-y-4">
          <span className="text-xs font-mono uppercase tracking-widest font-bold text-[#1A1A1A] block">
            5 Critical Transformations to Apply to Downloaded JSONs:
          </span>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs font-sans">
            <div className="flex items-start gap-2 bg-white p-3 border border-[#1A1A1A]/15">
              <span className="font-mono font-bold text-[#1A1A1A] min-w-[20px]">01.</span>
              <div>
                <strong className="text-[#1A1A1A] font-serif block text-sm">Add Explicit Prerequisite DAG Edges</strong>
                <span className="text-[#555]">Replace flat arrays with <code>prerequisites: ["node-id"]</code> to guarantee topological integrity.</span>
              </div>
            </div>

            <div className="flex items-start gap-2 bg-white p-3 border border-[#1A1A1A]/15">
              <span className="font-mono font-bold text-[#1A1A1A] min-w-[20px]">02.</span>
              <div>
                <strong className="text-[#1A1A1A] font-serif block text-sm">Replace Generic Tech with Company Approved Stacks</strong>
                <span className="text-[#555]">Map "Web Framework" $\to$ "FastAPI + Pydantic v2" or "CSS Framework" $\to$ "Tailwind v4".</span>
              </div>
            </div>

            <div className="flex items-start gap-2 bg-white p-3 border border-[#1A1A1A]/15">
              <span className="font-mono font-bold text-[#1A1A1A] min-w-[20px]">03.</span>
              <div>
                <strong className="text-[#1A1A1A] font-serif block text-sm">Attach Practical Evaluation Rubrics</strong>
                <span className="text-[#555]">Provide verifiable coding challenge prompts for milestone verification.</span>
              </div>
            </div>

            <div className="flex items-start gap-2 bg-white p-3 border border-[#1A1A1A]/15">
              <span className="font-mono font-bold text-[#1A1A1A] min-w-[20px]">04.</span>
              <div>
                <strong className="text-[#1A1A1A] font-serif block text-sm">Embed Internal Wiki &amp; Starter Template URLs</strong>
                <span className="text-[#555]">Point learners directly to your company's internal repos and Confluence docs.</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Side-by-Side Visual Diff: Raw JSON vs Enriched JSON */}
      <section className="max-w-5xl mx-auto space-y-6">
        <div className="border-b border-[#1A1A1A]/20 pb-3 flex justify-between items-baseline">
          <div>
            <h3 className="text-2xl font-serif italic text-[#1A1A1A]">
              Schema Comparison: Raw GitHub vs. Enriched Enterprise
            </h3>
            <p className="text-xs font-mono text-[#666] mt-1">
              Active Node: <strong className="text-[#1A1A1A]">{activeNode?.label}</strong> ({activeNode?.id})
            </p>
          </div>
          {/* Node switcher */}
          <select
            value={selectedNodeId}
            onChange={(e) => setSelectedNodeId(e.target.value)}
            aria-label="Select Node for Schema Comparison"
            className="text-xs font-mono bg-white border border-[#1A1A1A] px-2 py-1 focus:outline-none"
          >
            {roadmap.nodes.map(n => (
              <option key={n.id} value={n.id}>
                {n.label} ({n.id})
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Raw GitHub JSON Box */}
          <div className="p-5 bg-white border border-[#1A1A1A]/30 space-y-3">
            <div className="flex justify-between items-center border-b border-[#1A1A1A]/10 pb-2">
              <span className="text-xs font-mono uppercase font-bold text-[#777] flex items-center gap-1.5">
                <Code2 className="w-4 h-4 text-[#777]" />
                <span>Raw GitHub Community Format</span>
              </span>
              <span className="text-[10px] font-mono bg-[#EAE8E1] text-[#666] px-2 py-0.5">
                Unstructured
              </span>
            </div>

            <pre className="p-4 bg-[#F8F7F4] border border-[#1A1A1A]/10 font-mono text-xs text-[#444] overflow-x-auto h-72">
              {JSON.stringify(rawCommunityJsonSample, null, 2)}
            </pre>

            <div className="text-[11px] font-mono text-rose-800 bg-rose-50 p-2.5 border border-rose-200">
              ⚠️ Missing prerequisite DAG edges, company approved stack, and evaluation rubric.
            </div>
          </div>

          {/* Enriched Enterprise Schema Box */}
          <div className="p-5 bg-white border-2 border-[#1A1A1A] shadow-[4px_4px_0px_#1A1A1A] space-y-3">
            <div className="flex justify-between items-center border-b border-[#1A1A1A]/15 pb-2">
              <span className="text-xs font-mono uppercase font-bold text-[#1A1A1A] flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-emerald-700" />
                <span>Enriched Team &amp; GraphRAG Schema</span>
              </span>
              <span className="text-[10px] font-mono bg-[#1A1A1A] text-white px-2 py-0.5 font-bold">
                Production Ready
              </span>
            </div>

            <pre className="p-4 bg-[#F8F7F4] border border-[#1A1A1A]/20 font-mono text-xs text-[#1A1A1A] overflow-x-auto h-72">
              {JSON.stringify(enrichedEnterpriseJsonSample, null, 2)}
            </pre>

            <div className="text-[11px] font-mono text-emerald-900 bg-emerald-50 p-2.5 border border-emerald-300">
              ✓ Ready for Neo4j Cypher ingestion, Vector DB indexing, and LMS progress tracking.
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Node Editor */}
      <section className="max-w-5xl mx-auto p-6 bg-[#F8F7F4] border-2 border-[#1A1A1A] space-y-6">
        <div className="border-b border-[#1A1A1A]/20 pb-3 flex justify-between items-baseline">
          <div>
            <h3 className="text-2xl font-serif italic text-[#1A1A1A] flex items-center gap-2">
              <Edit3 className="w-5 h-5 text-[#1A1A1A]" />
              <span>Interactive Enterprise Node Customizer</span>
            </h3>
            <p className="text-xs font-mono text-[#666] mt-1">
              Customize company parameters for: <strong>{activeNode?.label}</strong>
            </p>
          </div>
          <span className="text-xs font-mono bg-emerald-100 text-emerald-950 px-2 py-0.5 border border-emerald-300">
            Live Synchronized
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-[#444] uppercase block">
              Company Approved Standard Stack
            </label>
            <input
              type="text"
              value={activeNode?.companyStandardStack || ''}
              onChange={(e) => onUpdateNode({ ...activeNode, companyStandardStack: e.target.value })}
              className="w-full p-2.5 bg-white border border-[#1A1A1A]/30 focus:border-[#1A1A1A] focus:outline-none"
              placeholder="e.g. FastAPI, PostgreSQL 16, Poetry, Docker"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-bold text-[#444] uppercase block">
              Internal Team Application
            </label>
            <input
              type="text"
              value={activeNode?.teamApplication || ''}
              onChange={(e) => onUpdateNode({ ...activeNode, teamApplication: e.target.value })}
              className="w-full p-2.5 bg-white border border-[#1A1A1A]/30 focus:border-[#1A1A1A] focus:outline-none"
              placeholder="e.g. Primary backend framework for payments microservice"
            />
          </div>

          <div className="space-y-1 md:col-span-2">
            <label className="text-[11px] font-bold text-[#444] uppercase block">
              Practical Hands-On Evaluation Rubric (Milestone Sign-Off Challenge)
            </label>
            <textarea
              value={activeNode?.evaluationRubric || ''}
              onChange={(e) => onUpdateNode({ ...activeNode, evaluationRubric: e.target.value })}
              rows={2}
              className="w-full p-2.5 bg-white border border-[#1A1A1A]/30 focus:border-[#1A1A1A] focus:outline-none font-sans text-xs"
              placeholder="e.g. Build an authenticated CRUD microservice with structured JSON logging and health probes."
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-bold text-[#444] uppercase block">
              Internal Documentation / Confluence URL
            </label>
            <input
              type="text"
              value={activeNode?.internalDocUrl || ''}
              onChange={(e) => onUpdateNode({ ...activeNode, internalDocUrl: e.target.value })}
              className="w-full p-2.5 bg-white border border-[#1A1A1A]/30 focus:border-[#1A1A1A] focus:outline-none"
              placeholder="e.g. wiki.internal/python/style-guide"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-bold text-[#444] uppercase block">
              Estimated Effort (Hours)
            </label>
            <input
              type="number"
              value={activeNode?.estimatedHours || 20}
              onChange={(e) => onUpdateNode({ ...activeNode, estimatedHours: Number(e.target.value) || 10 })}
              className="w-full p-2.5 bg-white border border-[#1A1A1A]/30 focus:border-[#1A1A1A] focus:outline-none"
            />
          </div>
        </div>
      </section>

      {/* One-Click Multi-Format Exporters */}
      <section className="max-w-5xl mx-auto space-y-6">
        <div className="border-b border-[#1A1A1A]/20 pb-3 flex justify-between items-baseline">
          <div>
            <h3 className="text-2xl font-serif italic text-[#1A1A1A]">
              Export Production Artifacts
            </h3>
            <p className="text-xs font-mono text-[#666] mt-1">
              Download the complete enriched roadmap in your team's preferred format
            </p>
          </div>
          <span className="text-xs font-mono font-bold text-[#1A1A1A] bg-[#EAE8E1] px-2 py-0.5">
            3 FORMATS
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Format 1: JSON */}
          <div className="p-5 bg-white border-2 border-[#1A1A1A] flex flex-col justify-between space-y-4 hover:shadow-[4px_4px_0px_#1A1A1A] transition-shadow">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs font-mono uppercase font-bold text-[#1A1A1A]">
                <FileCode2 className="w-4 h-4 text-emerald-700" />
                <span>Enriched JSON Schema</span>
              </div>
              <p className="text-xs font-serif text-[#555] leading-relaxed">
                Complete structured dataset with DAG prerequisite edges, hours, rubrics, and company stacks for vector indexing and web applications.
              </p>
            </div>
            <div className="space-y-2 pt-2">
              <button
                onClick={handleDownloadJson}
                className="w-full py-2.5 bg-[#1A1A1A] text-white hover:bg-black text-xs font-mono uppercase font-bold tracking-wider flex items-center justify-center gap-2 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download .JSON</span>
              </button>
              <button
                onClick={() => handleCopy(JSON.stringify(roadmap, null, 2), 'json')}
                className="w-full py-2 bg-white text-[#1A1A1A] border border-[#1A1A1A] hover:bg-[#F8F7F4] text-xs font-mono uppercase font-semibold flex items-center justify-center gap-2 cursor-pointer"
              >
                {copiedFormat === 'json' ? <Check className="w-3.5 h-3.5 text-emerald-700" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedFormat === 'json' ? 'Copied!' : 'Copy to Clipboard'}</span>
              </button>
            </div>
          </div>

          {/* Format 2: Neo4j Cypher */}
          <div className="p-5 bg-white border-2 border-[#1A1A1A] flex flex-col justify-between space-y-4 hover:shadow-[4px_4px_0px_#1A1A1A] transition-shadow">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs font-mono uppercase font-bold text-[#1A1A1A]">
                <Database className="w-4 h-4 text-blue-700" />
                <span>Neo4j Cypher Graph Script</span>
              </div>
              <p className="text-xs font-serif text-[#555] leading-relaxed">
                Ready-to-run Cypher queries to instantiate the complete skill graph with <code>:PREREQUISITE_FOR</code> edges in Neo4j or Memgraph.
              </p>
            </div>
            <div className="space-y-2 pt-2">
              <button
                onClick={handleDownloadCypher}
                className="w-full py-2.5 bg-[#1A1A1A] text-white hover:bg-black text-xs font-mono uppercase font-bold tracking-wider flex items-center justify-center gap-2 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download .CQL</span>
              </button>
              <button
                onClick={() => handleCopy(`// Cypher script for ${roadmap.title}...`, 'cql')}
                className="w-full py-2 bg-white text-[#1A1A1A] border border-[#1A1A1A] hover:bg-[#F8F7F4] text-xs font-mono uppercase font-semibold flex items-center justify-center gap-2 cursor-pointer"
              >
                {copiedFormat === 'cql' ? <Check className="w-3.5 h-3.5 text-emerald-700" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedFormat === 'cql' ? 'Copied!' : 'Copy Cypher'}</span>
              </button>
            </div>
          </div>

          {/* Format 3: Markdown Syllabus */}
          <div className="p-5 bg-white border-2 border-[#1A1A1A] flex flex-col justify-between space-y-4 hover:shadow-[4px_4px_0px_#1A1A1A] transition-shadow">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs font-mono uppercase font-bold text-[#1A1A1A]">
                <FileText className="w-4 h-4 text-purple-700" />
                <span>Markdown Team Syllabus</span>
              </div>
              <p className="text-xs font-serif text-[#555] leading-relaxed">
                Formatted markdown checklist ready to paste into internal company Notion wikis, Confluence spaces, or GitHub repo READMEs.
              </p>
            </div>
            <div className="space-y-2 pt-2">
              <button
                onClick={handleDownloadMarkdown}
                className="w-full py-2.5 bg-[#1A1A1A] text-white hover:bg-black text-xs font-mono uppercase font-bold tracking-wider flex items-center justify-center gap-2 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download .MD</span>
              </button>
              <button
                onClick={() => handleCopy(`# ${roadmap.title} Syllabus...`, 'md')}
                className="w-full py-2 bg-white text-[#1A1A1A] border border-[#1A1A1A] hover:bg-[#F8F7F4] text-xs font-mono uppercase font-semibold flex items-center justify-center gap-2 cursor-pointer"
              >
                {copiedFormat === 'md' ? <Check className="w-3.5 h-3.5 text-emerald-700" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedFormat === 'md' ? 'Copied!' : 'Copy Markdown'}</span>
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
