"use client";

import React, { useState, useMemo } from 'react';
import { 
  Network, 
  GitBranch, 
  Layers, 
  ArrowRight, 
  Search, 
  Sparkles, 
  Code2, 
  RotateCcw, 
  ZoomIn, 
  ZoomOut, 
  CheckCircle2, 
  Info
} from 'lucide-react';
import { 
  DISCIPLINES, 
  CROSS_DISCIPLINE_EDGES, 
  DisciplineId, 
  CrossDisciplineEdge, 
  RelationshipType, 
  findCrossDisciplinePath
} from '@/data/crossDisciplineGraph';
import { ROADMAPS } from '@/data/roadmapsData';

type ViewMode = 'graph' | 'matrix' | 'pathfinder' | 'contracts';

export const KnowledgeGraph: React.FC = () => {
  const [selectedDisciplines, setSelectedDisciplines] = useState<DisciplineId[]>(
    DISCIPLINES.map(d => d.id)
  );
  const [selectedRelationship, setSelectedRelationship] = useState<RelationshipType | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEdge, setSelectedEdge] = useState<CrossDisciplineEdge | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('graph');
  
  // Path finder states
  const [pathStartNode, setPathStartNode] = useState<string>('py-packaging-dist');
  const [pathTargetNode, setPathTargetNode] = useState<string>('devops-k8s-orchestration');

  // Zoom & Pan for SVG graph
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Toggle discipline filter
  const handleToggleDiscipline = (discId: DisciplineId) => {
    setSelectedDisciplines(prev => 
      prev.includes(discId)
        ? prev.filter(id => id !== discId)
        : [...prev, discId]
    );
  };

  const handleSelectAllDisciplines = () => {
    setSelectedDisciplines(DISCIPLINES.map(d => d.id));
  };

  const handleClearDisciplines = () => {
    setSelectedDisciplines(['python-developer', 'devops-engineer']);
  };

  // Filtered edges
  const filteredEdges = useMemo(() => {
    return CROSS_DISCIPLINE_EDGES.filter(edge => {
      const matchSourceDisc = selectedDisciplines.includes(edge.sourceDiscipline);
      const matchTargetDisc = selectedDisciplines.includes(edge.targetDiscipline);
      const matchRel = selectedRelationship === 'ALL' || edge.relationship === selectedRelationship;
      const matchSearch = !searchQuery.trim() || 
        edge.sourceLabel.toLowerCase().includes(searchQuery.toLowerCase()) ||
        edge.targetLabel.toLowerCase().includes(searchQuery.toLowerCase()) ||
        edge.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        edge.relationship.toLowerCase().includes(searchQuery.toLowerCase());

      return matchSourceDisc && matchTargetDisc && matchRel && matchSearch;
    });
  }, [selectedDisciplines, selectedRelationship, searchQuery]);

  // Extract unique nodes from filtered edges
  const graphNodes = useMemo(() => {
    const nodeMap = new Map<string, { id: string; label: string; discipline: DisciplineId }>();
    filteredEdges.forEach(edge => {
      if (!nodeMap.has(edge.sourceNodeId)) {
        nodeMap.set(edge.sourceNodeId, {
          id: edge.sourceNodeId,
          label: edge.sourceLabel,
          discipline: edge.sourceDiscipline
        });
      }
      if (!nodeMap.has(edge.targetNodeId)) {
        nodeMap.set(edge.targetNodeId, {
          id: edge.targetNodeId,
          label: edge.targetLabel,
          discipline: edge.targetDiscipline
        });
      }
    });
    return Array.from(nodeMap.values());
  }, [filteredEdges]);

  // Coordinate layout for nodes grouped by discipline rings / columns
  const nodePositions = useMemo(() => {
    const positions: Record<string, { x: number; y: number }> = {};
    const discMap: Record<DisciplineId, { id: string; label: string; discipline: DisciplineId }[]> = {
      'python-developer': [],
      'frontend-developer': [],
      'devops-engineer': [],
      'backend-systems': [],
      'cyber-security': [],
      'ai-ml-engineer': [],
      'fullstack-developer': [],
      'cloud-architect': []
    };

    graphNodes.forEach(node => {
      if (discMap[node.discipline]) {
        discMap[node.discipline].push(node);
      }
    });

    // Arrange in a 2-column or circular multi-orbit architecture
    const discOrder: DisciplineId[] = [
      'python-developer',
      'devops-engineer',
      'backend-systems',
      'ai-ml-engineer',
      'frontend-developer',
      'cyber-security',
      'cloud-architect',
      'fullstack-developer'
    ];

    const centerX = 500;
    const centerY = 360;
    const radiusX = 380;
    const radiusY = 240;

    let totalActiveDiscs = discOrder.filter(d => discMap[d]?.length > 0);
    if (totalActiveDiscs.length === 0) totalActiveDiscs = discOrder;

    totalActiveDiscs.forEach((dId, dIdx) => {
      const angle = (dIdx / totalActiveDiscs.length) * 2 * Math.PI - Math.PI / 2;
      const clusterCenterX = centerX + radiusX * Math.cos(angle);
      const clusterCenterY = centerY + radiusY * Math.sin(angle);

      const nodesInDisc = discMap[dId] || [];
      nodesInDisc.forEach((node, nIdx) => {
        const offsetAngle = (nIdx - (nodesInDisc.length - 1) / 2) * 0.45;
        const dist = 55 + (nIdx % 2) * 25;
        positions[node.id] = {
          x: clusterCenterX + dist * Math.cos(angle + offsetAngle + Math.PI / 2),
          y: clusterCenterY + dist * Math.sin(angle + offsetAngle + Math.PI / 2)
        };
      });
    });

    return positions;
  }, [graphNodes]);

  // Path between selected nodes
  const calculatedPath = useMemo(() => {
    if (!pathStartNode || !pathTargetNode) return null;
    return findCrossDisciplinePath(pathStartNode, pathTargetNode);
  }, [pathStartNode, pathTargetNode]);

  // Mouse drag handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Get discipline styling
  const getDiscColor = (dId: DisciplineId) => {
    const meta = DISCIPLINES.find(d => d.id === dId);
    return meta?.color || '#1A1A1A';
  };

  const getDiscShort = (dId: DisciplineId) => {
    const meta = DISCIPLINES.find(d => d.id === dId);
    return meta?.shortCode || 'SKILL';
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#FDFCFB] overflow-hidden">
      {/* Top Knowledge Graph Toolbar */}
      <div className="border-b border-[#1A1A1A]/15 bg-white p-4 sm:px-8 space-y-4 shrink-0">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-[#777]">
              <span className="bg-[#1A1A1A] text-white px-2 py-0.5 font-bold">CROSS-DISCIPLINE ONTOLOGY</span>
              <span>INTER-ROLE GRAPH TOPOLOGY</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-serif italic text-[#1A1A1A] mt-1">
              Multi-Discipline Knowledge Graph &amp; Interface Matrix
            </h2>
            <p className="text-xs sm:text-sm font-serif text-[#555] max-w-3xl mt-0.5">
              Visualizing how core competencies bridge across roles — revealing how a <span className="font-semibold text-[#1A1A1A]">Python Developer</span> connects directly to <span className="font-semibold text-[#1A1A1A]">DevOps, Backend Systems, AI/ML, and Cyber Security</span>.
            </p>
          </div>

          {/* Mode Switcher */}
          <div className="flex flex-wrap gap-1 p-1 bg-[#F8F7F4] border border-[#1A1A1A]/20">
            <button
              onClick={() => setViewMode('graph')}
              className={`px-3 py-1.5 text-xs font-mono uppercase font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                viewMode === 'graph'
                  ? 'bg-[#1A1A1A] text-white shadow-sm'
                  : 'text-[#666] hover:text-[#1A1A1A]'
              }`}
            >
              <Network className="w-3.5 h-3.5" />
              <span>01 / 2D Graph</span>
            </button>
            <button
              onClick={() => setViewMode('matrix')}
              className={`px-3 py-1.5 text-xs font-mono uppercase font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                viewMode === 'matrix'
                  ? 'bg-[#1A1A1A] text-white shadow-sm'
                  : 'text-[#666] hover:text-[#1A1A1A]'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>02 / Interface Matrix</span>
            </button>
            <button
              onClick={() => setViewMode('pathfinder')}
              className={`px-3 py-1.5 text-xs font-mono uppercase font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                viewMode === 'pathfinder'
                  ? 'bg-[#1A1A1A] text-white shadow-sm'
                  : 'text-[#666] hover:text-[#1A1A1A]'
              }`}
            >
              <GitBranch className="w-3.5 h-3.5" />
              <span>03 / Path Finder</span>
            </button>
            <button
              onClick={() => setViewMode('contracts')}
              className={`px-3 py-1.5 text-xs font-mono uppercase font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                viewMode === 'contracts'
                  ? 'bg-[#1A1A1A] text-white shadow-sm'
                  : 'text-[#666] hover:text-[#1A1A1A]'
              }`}
            >
              <Code2 className="w-3.5 h-3.5" />
              <span>04 / Contracts</span>
            </button>
          </div>
        </div>

        {/* Discipline & Relationship Filter Bar */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 pt-2 border-t border-[#1A1A1A]/10 text-xs font-mono">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[10px] uppercase tracking-wider text-[#777] font-bold mr-1">
              Filter Disciplines:
            </span>
            {DISCIPLINES.map(d => {
              const isSelected = selectedDisciplines.includes(d.id);
              return (
                <button
                  key={d.id}
                  onClick={() => handleToggleDiscipline(d.id)}
                  className={`px-2.5 py-1 border transition-all cursor-pointer flex items-center gap-1.5 text-[11px] ${
                    isSelected
                      ? 'border-[#1A1A1A] bg-[#1A1A1A] text-white font-bold'
                      : 'border-[#D5D2C9] bg-white text-[#777] hover:border-[#1A1A1A]'
                  }`}
                  style={{
                    borderLeftColor: isSelected ? undefined : d.color,
                    borderLeftWidth: isSelected ? undefined : '3px'
                  }}
                >
                  <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: d.color }}></span>
                  <span>{d.label.split(' ')[0]}</span>
                  <span className="text-[9px] opacity-70">({d.shortCode})</span>
                </button>
              );
            })}
            <div className="flex items-center gap-1 ml-2">
              <button
                onClick={handleSelectAllDisciplines}
                className="text-[10px] text-[#555] hover:text-[#1A1A1A] underline cursor-pointer"
              >
                All
              </button>
              <span className="text-[#AAA]">•</span>
              <button
                onClick={handleClearDisciplines}
                className="text-[10px] text-[#555] hover:text-[#1A1A1A] underline cursor-pointer"
              >
                Reset
              </button>
            </div>
          </div>

          {/* Search & Relationship Selector */}
          <div className="flex items-center gap-2 w-full md:w-auto">
            <div className="relative flex-1 md:w-48">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-[#888]" />
              <input
                type="text"
                placeholder="Search nodes or edges..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-2 py-1 bg-[#F8F7F4] border border-[#1A1A1A]/30 text-xs font-mono focus:outline-none focus:border-[#1A1A1A]"
              />
            </div>

            <select
              value={selectedRelationship}
              onChange={(e) => setSelectedRelationship(e.target.value as RelationshipType | 'ALL')}
              className="px-2 py-1 bg-white border border-[#1A1A1A]/30 text-xs font-mono focus:outline-none"
              aria-label="Filter by relationship type"
            >
              <option value="ALL">All Relations ({CROSS_DISCIPLINE_EDGES.length})</option>
              <option value="CONTAINERIZES">CONTAINERIZES</option>
              <option value="DEPLOYS_TO">DEPLOYS_TO</option>
              <option value="FEEDS_DATA_TO">FEEDS_DATA_TO</option>
              <option value="CONSUMES_API">CONSUMES_API</option>
              <option value="HARDENS_SECURITY">HARDENS_SECURITY</option>
              <option value="TELEMETRY_PIPELINE">TELEMETRY_PIPELINE</option>
              <option value="ORCHESTRATES_INFRA">ORCHESTRATES_INFRA</option>
              <option value="SERVES_MODELS">SERVES_MODELS</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Content Area Based on Mode */}
      <div className="flex-1 relative overflow-hidden flex flex-col">
        {/* MODE 1: Interactive 2D Graph Visualizer */}
        {viewMode === 'graph' && (
          <div className="flex-1 relative overflow-hidden flex">
            {/* Graph Canvas Container */}
            <div 
              className="flex-1 h-full cursor-grab active:cursor-grabbing relative overflow-hidden select-none bg-[#FAF9F6]"
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
            >
              {/* Grid Background Pattern */}
              <div 
                className="absolute inset-0 opacity-40 pointer-events-none"
                style={{
                  backgroundImage: `radial-gradient(#1A1A1A 0.75px, transparent 0.75px)`,
                  backgroundSize: '24px 24px'
                }}
              />

              {/* Floating Canvas Controls */}
              <div className="absolute top-4 left-4 z-10 flex items-center gap-1.5 bg-white border border-[#1A1A1A]/20 p-1 shadow-sm text-xs font-mono">
                <button
                  onClick={() => setZoom(z => Math.min(z + 0.15, 2.2))}
                  className="p-1.5 hover:bg-[#F8F7F4] text-[#1A1A1A] cursor-pointer"
                  title="Zoom In"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setZoom(z => Math.max(z - 0.15, 0.4))}
                  className="p-1.5 hover:bg-[#F8F7F4] text-[#1A1A1A] cursor-pointer"
                  title="Zoom Out"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
                <button
                  onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); }}
                  className="p-1.5 hover:bg-[#F8F7F4] text-[#1A1A1A] cursor-pointer"
                  title="Reset Viewport"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
                <span className="px-2 text-[10px] text-[#777] border-l border-[#E5E3DC]">
                  {Math.round(zoom * 100)}%
                </span>
              </div>

              {/* Quick Graph Statistics Tag */}
              <div className="absolute top-4 right-4 z-10 bg-white border-2 border-[#1A1A1A] p-2.5 shadow-[3px_3px_0px_#1A1A1A] text-xs font-mono space-y-1">
                <div className="flex justify-between items-center gap-4">
                  <span className="text-[#777] uppercase text-[10px]">Active Nodes:</span>
                  <strong className="text-[#1A1A1A]">{graphNodes.length}</strong>
                </div>
                <div className="flex justify-between items-center gap-4">
                  <span className="text-[#777] uppercase text-[10px]">Inter-Domain Edges:</span>
                  <strong className="text-emerald-700 font-bold">{filteredEdges.length}</strong>
                </div>
              </div>

              {/* SVG Renderer */}
              <svg
                className="w-full h-full"
                viewBox="0 0 1000 720"
                style={{
                  transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                  transformOrigin: '50% 50%'
                }}
              >
                <defs>
                  {/* Arrow markers for each relationship */}
                  <marker
                    id="arrow-default"
                    viewBox="0 0 10 10"
                    refX="18"
                    refY="5"
                    markerWidth="6"
                    markerHeight="6"
                    orient="auto-start-reverse"
                  >
                    <path d="M 0 0 L 10 5 L 0 10 z" fill="#1A1A1A" />
                  </marker>
                  <marker
                    id="arrow-highlight"
                    viewBox="0 0 10 10"
                    refX="18"
                    refY="5"
                    markerWidth="7"
                    markerHeight="7"
                    orient="auto-start-reverse"
                  >
                    <path d="M 0 0 L 10 5 L 0 10 z" fill="#059669" />
                  </marker>
                </defs>

                {/* Render Inter-Discipline Edge Lines */}
                <g className="edges">
                  {filteredEdges.map((edge) => {
                    const sourcePos = nodePositions[edge.sourceNodeId];
                    const targetPos = nodePositions[edge.targetNodeId];
                    if (!sourcePos || !targetPos) return null;

                    const isSelected = selectedEdge?.id === edge.id;
                    const isConnectedToSelectedNode = 
                      selectedNodeId === edge.sourceNodeId || selectedNodeId === edge.targetNodeId;

                    // Curvature calculation
                    const midX = (sourcePos.x + targetPos.x) / 2;
                    const midY = (sourcePos.y + targetPos.y) / 2;
                    const dx = targetPos.x - sourcePos.x;
                    const dy = targetPos.y - sourcePos.y;
                    const curveOffset = Math.sin(edge.id.length) * 35;
                    const ctrlX = midX - dy * 0.15 + curveOffset * 0.2;
                    const ctrlY = midY + dx * 0.15 + curveOffset * 0.2;

                    const pathD = `M ${sourcePos.x} ${sourcePos.y} Q ${ctrlX} ${ctrlY} ${targetPos.x} ${targetPos.y}`;

                    return (
                      <g 
                        key={edge.id} 
                        className="cursor-pointer group"
                        onClick={() => setSelectedEdge(edge)}
                      >
                        {/* Fat transparent hover line */}
                        <path
                          d={pathD}
                          fill="none"
                          stroke="transparent"
                          strokeWidth="20"
                        />
                        {/* Actual edge line */}
                        <path
                          d={pathD}
                          fill="none"
                          stroke={isSelected ? '#059669' : isConnectedToSelectedNode ? '#1A1A1A' : '#999'}
                          strokeWidth={isSelected ? 3 : isConnectedToSelectedNode ? 2.5 : 1.5}
                          strokeDasharray={edge.relationship === 'SHARED_PREREQUISITE' ? '4 4' : 'none'}
                          markerEnd={isSelected ? 'url(#arrow-highlight)' : 'url(#arrow-default)'}
                          className="transition-all"
                        />
                        {/* Edge Label on Midpoint */}
                        <g transform={`translate(${ctrlX}, ${ctrlY})`}>
                          <rect
                            x="-45"
                            y="-9"
                            width="90"
                            height="18"
                            fill={isSelected ? '#1A1A1A' : '#FFFFFF'}
                            stroke={isSelected ? '#1A1A1A' : '#CCCCCC'}
                            strokeWidth="1"
                            rx="2"
                          />
                          <text
                            x="0"
                            y="3"
                            textAnchor="middle"
                            fontSize="8"
                            fontFamily="monospace"
                            fontWeight="bold"
                            fill={isSelected ? '#FFFFFF' : '#444444'}
                          >
                            {edge.relationship.replace('_', ' ')}
                          </text>
                        </g>
                      </g>
                    );
                  })}
                </g>

                {/* Render Nodes */}
                <g className="nodes">
                  {graphNodes.map((node) => {
                    const pos = nodePositions[node.id];
                    if (!pos) return null;

                    const isSelected = selectedNodeId === node.id;
                    const isPartOfSelectedEdge = 
                      selectedEdge?.sourceNodeId === node.id || selectedEdge?.targetNodeId === node.id;
                    const color = getDiscColor(node.discipline);
                    const short = getDiscShort(node.discipline);

                    return (
                      <g
                        key={node.id}
                        transform={`translate(${pos.x}, ${pos.y})`}
                        className="cursor-pointer transition-transform"
                        onClick={() => {
                          setSelectedNodeId(node.id);
                          const matchingEdge = filteredEdges.find(e => e.sourceNodeId === node.id || e.targetNodeId === node.id);
                          if (matchingEdge) setSelectedEdge(matchingEdge);
                        }}
                      >
                        {/* Outer Glow / Ring for Selection */}
                        {(isSelected || isPartOfSelectedEdge) && (
                          <circle
                            r="34"
                            fill="none"
                            stroke="#1A1A1A"
                            strokeWidth="2"
                            strokeDasharray="3 3"
                            className="animate-spin-slow"
                          />
                        )}

                        {/* Node Background */}
                        <rect
                          x="-80"
                          y="-20"
                          width="160"
                          height="40"
                          fill="#FFFFFF"
                          stroke={isSelected ? '#1A1A1A' : color}
                          strokeWidth={isSelected ? 3 : 1.5}
                          className="shadow-sm hover:stroke-black transition-colors"
                        />

                        {/* Top discipline strip */}
                        <rect
                          x="-80"
                          y="-20"
                          width="160"
                          height="5"
                          fill={color}
                        />

                        {/* Discipline Tag */}
                        <text
                          x="-72"
                          y="-4"
                          fontSize="8"
                          fontFamily="monospace"
                          fontWeight="bold"
                          fill={color}
                        >
                          [{short}]
                        </text>

                        {/* Node Title */}
                        <text
                          x="-72"
                          y="10"
                          fontSize="10"
                          fontFamily="sans-serif"
                          fontWeight="bold"
                          fill="#1A1A1A"
                          className="select-none"
                        >
                          {node.label.length > 20 ? node.label.substring(0, 19) + '…' : node.label}
                        </text>
                      </g>
                    );
                  })}
                </g>
              </svg>
            </div>

            {/* Right-Hand Architectural Edge / Node Inspector Drawer */}
            <div className="w-80 sm:w-96 border-l-2 border-[#1A1A1A] bg-[#F8F7F4] p-5 flex flex-col justify-between overflow-y-auto space-y-6 shrink-0">
              {selectedEdge ? (
                <div className="space-y-4">
                  <div className="flex justify-between items-center border-b border-[#1A1A1A]/20 pb-2">
                    <span className="text-xs font-mono uppercase tracking-widest text-[#777] font-bold flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-emerald-700" />
                      <span>Interface Contract</span>
                    </span>
                    <span className="text-[10px] font-mono bg-[#1A1A1A] text-white px-2 py-0.5 font-bold">
                      {selectedEdge.relationship}
                    </span>
                  </div>

                  {/* Visual Connection Card */}
                  <div className="p-3.5 bg-white border border-[#1A1A1A] space-y-3">
                    <div className="space-y-1">
                      <span className="text-[9px] font-mono uppercase text-[#777] block font-bold">
                        Source Node ({getDiscShort(selectedEdge.sourceDiscipline)}):
                      </span>
                      <strong className="text-xs font-serif text-[#1A1A1A] block">
                        {selectedEdge.sourceLabel}
                      </strong>
                    </div>

                    <div className="flex items-center justify-center text-[#777] py-1 border-y border-[#E5E3DC]">
                      <ArrowRight className="w-4 h-4 text-[#1A1A1A]" />
                      <span className="text-[10px] font-mono uppercase ml-2 text-[#1A1A1A] font-bold">
                        {selectedEdge.relationship}
                      </span>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[9px] font-mono uppercase text-[#777] block font-bold">
                        Target Node ({getDiscShort(selectedEdge.targetDiscipline)}):
                      </span>
                      <strong className="text-xs font-serif text-[#1A1A1A] block">
                        {selectedEdge.targetLabel}
                      </strong>
                    </div>
                  </div>

                  {/* Why this connection exists in production */}
                  <div className="space-y-1 text-xs font-sans">
                    <span className="font-mono text-[10px] uppercase font-bold text-[#777] block">
                      Production Engineering Context:
                    </span>
                    <p className="text-[#333] font-serif leading-relaxed bg-white p-3 border border-[#1A1A1A]/20">
                      {selectedEdge.description}
                    </p>
                  </div>

                  {/* Production Architectural Contract */}
                  <div className="space-y-1 text-xs font-mono">
                    <span className="text-[10px] uppercase font-bold text-[#1A1A1A] flex items-center gap-1.5">
                      <Code2 className="w-3.5 h-3.5 text-blue-700" />
                      <span>Verifiable Technical Contract:</span>
                    </span>
                    <div className="p-3 bg-[#1A1A1A] text-[#EEE] text-[11px] font-mono whitespace-pre-wrap leading-relaxed border border-black">
                      {selectedEdge.productionContract}
                    </div>
                  </div>

                  {/* Stakeholder Impact */}
                  <div className="p-3 bg-emerald-50 border border-emerald-300 text-xs font-sans space-y-1 text-emerald-950">
                    <span className="font-mono text-[10px] uppercase font-bold text-emerald-900 block">
                      Inter-Team Alignment Impact:
                    </span>
                    <p className="text-[11px]">
                      Prevents cross-functional friction between {selectedEdge.sourceDiscipline.split('-')[0]} and {selectedEdge.targetDiscipline.split('-')[0]} teams by establishing shared interface specifications.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 space-y-3">
                  <div className="w-12 h-12 border-2 border-[#1A1A1A] bg-white mx-auto flex items-center justify-center text-[#1A1A1A]">
                    <Network className="w-6 h-6" />
                  </div>
                  <h4 className="font-serif italic font-bold text-base text-[#1A1A1A]">
                    Select Any Node or Edge
                  </h4>
                  <p className="text-xs font-serif text-[#666] max-w-xs mx-auto leading-relaxed">
                    Click on any node or connection in the graph to inspect the production contract, API schemas, and inter-discipline integration specs.
                  </p>
                </div>
              )}

              {/* Bottom Quick Help */}
              <div className="p-3 bg-white border border-[#1A1A1A]/15 text-[11px] font-mono text-[#666] space-y-1">
                <span className="font-bold text-[#1A1A1A] uppercase text-[10px] block">Graph Navigation:</span>
                <div>• Drag canvas to pan; scroll or buttons to zoom.</div>
                <div>• Filter by role or relationship above.</div>
              </div>
            </div>
          </div>
        )}

        {/* MODE 2: Cross-Discipline Interface Matrix */}
        {viewMode === 'matrix' && (
          <div className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-8 bg-[#FDFCFB]">
            <div className="max-w-5xl mx-auto space-y-6">
              <div className="border-b border-[#1A1A1A]/20 pb-3 flex justify-between items-baseline">
                <div>
                  <h3 className="text-2xl font-serif italic text-[#1A1A1A]">
                    Cross-Discipline Interface Matrix
                  </h3>
                  <p className="text-xs font-mono text-[#666] mt-1">
                    Structured grid showing how each engineering role coordinates with other specializations
                  </p>
                </div>
                <span className="text-xs font-mono font-bold text-[#1A1A1A] bg-[#EAE8E1] px-2 py-0.5">
                  {CROSS_DISCIPLINE_EDGES.length} INTERFACES
                </span>
              </div>

              {/* Matrix Table */}
              <div className="space-y-4">
                {CROSS_DISCIPLINE_EDGES.map((edge) => (
                  <div 
                    key={edge.id}
                    className="p-5 bg-white border-2 border-[#1A1A1A] shadow-[3px_3px_0px_#1A1A1A] space-y-3"
                  >
                    <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 border-b border-[#1A1A1A]/10 pb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono px-2 py-0.5 text-white font-bold" style={{ backgroundColor: getDiscColor(edge.sourceDiscipline) }}>
                          {getDiscShort(edge.sourceDiscipline)}: {edge.sourceLabel}
                        </span>
                        <ArrowRight className="w-4 h-4 text-[#777]" />
                        <span className="text-[10px] font-mono px-2 py-0.5 text-white font-bold" style={{ backgroundColor: getDiscColor(edge.targetDiscipline) }}>
                          {getDiscShort(edge.targetDiscipline)}: {edge.targetLabel}
                        </span>
                      </div>
                      <span className="text-[10px] font-mono bg-[#1A1A1A] text-white px-2 py-0.5 uppercase font-bold self-start sm:self-auto">
                        {edge.relationship}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-sans">
                      <div className="space-y-1">
                        <span className="font-mono text-[10px] uppercase text-[#777] font-bold block">
                          Why This Interface Matters:
                        </span>
                        <p className="text-[#333] font-serif leading-relaxed">
                          {edge.description}
                        </p>
                      </div>

                      <div className="space-y-1">
                        <span className="font-mono text-[10px] uppercase text-[#777] font-bold block">
                          Architectural &amp; Code Contract:
                        </span>
                        <pre className="p-2.5 bg-[#F8F7F4] border border-[#1A1A1A]/20 font-mono text-[10.5px] text-[#1A1A1A] whitespace-pre-wrap leading-relaxed">
                          {edge.productionContract}
                        </pre>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* MODE 3: Cross-Discipline Path Finder */}
        {viewMode === 'pathfinder' && (
          <div className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-8 bg-[#FDFCFB]">
            <div className="max-w-5xl mx-auto space-y-6">
              <div className="border-b border-[#1A1A1A]/20 pb-3 flex justify-between items-baseline">
                <div>
                  <h3 className="text-2xl font-serif italic text-[#1A1A1A]">
                    Cross-Discipline Dependency Path Finder
                  </h3>
                  <p className="text-xs font-mono text-[#666] mt-1">
                    Trace the multi-hop dependency bridge between any two skills across different engineering disciplines
                  </p>
                </div>
                <span className="text-xs font-mono bg-[#1A1A1A] text-white px-2 py-0.5 font-bold">
                  BFS GRAPH SOLVER
                </span>
              </div>

              {/* Selector Controls */}
              <div className="p-6 bg-[#F8F7F4] border-2 border-[#1A1A1A] space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Start Node */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-mono uppercase font-bold text-[#1A1A1A] block">
                      Origin Skill Node:
                    </label>
                    <select
                      value={pathStartNode}
                      onChange={(e) => setPathStartNode(e.target.value)}
                      className="w-full p-2.5 bg-white border border-[#1A1A1A] text-xs font-mono focus:outline-none"
                    >
                      {ROADMAPS.flatMap(r => r.nodes.map(n => ({ ...n, roadmapTitle: r.title }))).map(n => (
                        <option key={n.id} value={n.id}>
                          [{n.roadmapTitle.split(' ')[0]}] {n.label} ({n.id})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Target Node */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-mono uppercase font-bold text-[#1A1A1A] block">
                      Target Destination Skill:
                    </label>
                    <select
                      value={pathTargetNode}
                      onChange={(e) => setPathTargetNode(e.target.value)}
                      className="w-full p-2.5 bg-white border border-[#1A1A1A] text-xs font-mono focus:outline-none"
                    >
                      {ROADMAPS.flatMap(r => r.nodes.map(n => ({ ...n, roadmapTitle: r.title }))).map(n => (
                        <option key={n.id} value={n.id}>
                          [{n.roadmapTitle.split(' ')[0]}] {n.label} ({n.id})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Path Calculation Output */}
              {calculatedPath && calculatedPath.length > 0 ? (
                <div className="p-6 bg-white border-2 border-[#1A1A1A] shadow-[4px_4px_0px_#1A1A1A] space-y-6">
                  <div className="flex justify-between items-center border-b border-[#1A1A1A]/10 pb-3">
                    <span className="text-xs font-mono uppercase font-bold text-emerald-800 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                      <span>Optimal Path Discovered ({calculatedPath.length} Hop{calculatedPath.length > 1 ? 's' : ''})</span>
                    </span>
                    <span className="text-xs font-mono text-[#777]">TOPOLOGICALLY VERIFIED</span>
                  </div>

                  {/* Step-by-step path chain */}
                  <div className="space-y-4">
                    {calculatedPath.map((step, idx) => (
                      <div key={step.id} className="p-4 bg-[#F8F7F4] border border-[#1A1A1A] space-y-3">
                        <div className="flex items-center gap-2 text-xs font-mono">
                          <span className="w-6 h-6 bg-[#1A1A1A] text-white flex items-center justify-center font-bold text-[10px]">
                            0{idx + 1}
                          </span>
                          <span className="font-bold text-[#1A1A1A]">
                            {step.sourceLabel}
                          </span>
                          <span className="text-[10px] bg-[#1A1A1A] text-white px-2 py-0.5 uppercase">
                            {step.relationship}
                          </span>
                          <ArrowRight className="w-3.5 h-3.5 text-[#666]" />
                          <span className="font-bold text-[#1A1A1A]">
                            {step.targetLabel}
                          </span>
                        </div>

                        <p className="text-xs font-serif text-[#444] leading-relaxed">
                          {step.description}
                        </p>

                        <div className="p-2.5 bg-[#1A1A1A] text-white text-[10px] font-mono">
                          <strong className="text-emerald-400 block mb-0.5">Contract:</strong>
                          {step.productionContract}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="p-8 bg-white border border-[#1A1A1A]/30 text-center space-y-3">
                  <Info className="w-6 h-6 mx-auto text-[#777]" />
                  <h4 className="font-serif italic font-bold text-[#1A1A1A]">
                    Direct Inter-Discipline Bridge
                  </h4>
                  <p className="text-xs font-serif text-[#666] max-w-md mx-auto leading-relaxed">
                    Try selecting <strong>Python: Packaging &amp; CI/CD</strong> to <strong>DevOps: Containerization</strong>, or <strong>Python: Web Frameworks</strong> to <strong>AI/ML: LLM Orchestration</strong>.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* MODE 4: Production Architectural Contracts */}
        {viewMode === 'contracts' && (
          <div className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-8 bg-[#FDFCFB]">
            <div className="max-w-5xl mx-auto space-y-6">
              <div className="border-b border-[#1A1A1A]/20 pb-3 flex justify-between items-baseline">
                <div>
                  <h3 className="text-2xl font-serif italic text-[#1A1A1A]">
                    Production Architectural Interface Contracts
                  </h3>
                  <p className="text-xs font-mono text-[#666] mt-1">
                    Concrete technical implementations that bind cross-functional roadmaps together
                  </p>
                </div>
                <span className="text-xs font-mono bg-[#1A1A1A] text-white px-2 py-0.5 font-bold">
                  CODE RECIPES
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Contract 1: Python -> DevOps (Dockerfile) */}
                <div className="p-5 bg-white border-2 border-[#1A1A1A] space-y-3">
                  <div className="flex justify-between items-center border-b border-[#1A1A1A]/10 pb-2">
                    <span className="font-mono text-xs font-bold text-[#1A1A1A]">
                      01 / Python ↔ DevOps (Multi-Stage OCI)
                    </span>
                    <span className="text-[10px] font-mono bg-amber-100 text-amber-900 px-1.5 py-0.5 font-bold">
                      CONTAINERIZES
                    </span>
                  </div>
                  <p className="text-xs font-serif text-[#555]">
                    How Python build artifacts are packaged into hardened production containers with non-root security.
                  </p>
                  <pre className="p-3 bg-[#1A1A1A] text-emerald-400 font-mono text-[10px] overflow-x-auto leading-relaxed">
{`# syntax=docker/dockerfile:1.7
FROM python:3.12-slim-bookworm AS builder
WORKDIR /app
RUN pip install uv
COPY pyproject.toml uv.lock ./
RUN uv export --frozen --no-dev -o requirements.txt
RUN uv pip install -r requirements.txt --target /app/site-packages

FROM python:3.12-slim-bookworm AS runner
WORKDIR /app
COPY --from=builder /app/site-packages /usr/local/lib/python3.12/site-packages
COPY ./src ./src
USER 10001:10001
CMD ["uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "8000"]`}
                  </pre>
                </div>

                {/* Contract 2: Frontend ↔ Backend (OpenAPI/gRPC) */}
                <div className="p-5 bg-white border-2 border-[#1A1A1A] space-y-3">
                  <div className="flex justify-between items-center border-b border-[#1A1A1A]/10 pb-2">
                    <span className="font-mono text-xs font-bold text-[#1A1A1A]">
                      02 / Frontend ↔ Backend (Type-Safe RPC)
                    </span>
                    <span className="text-[10px] font-mono bg-blue-100 text-blue-900 px-1.5 py-0.5 font-bold">
                      CONSUMES_API
                    </span>
                  </div>
                  <p className="text-xs font-serif text-[#555]">
                    How TypeScript UI hooks are synchronized with Backend OpenAPI or gRPC Protobuf schemas.
                  </p>
                  <pre className="p-3 bg-[#1A1A1A] text-blue-300 font-mono text-[10px] overflow-x-auto leading-relaxed">
{`// Shared Proto Contract: service.proto
syntax = "proto3";
package telemetry.v1;

service RoadmapService {
  rpc GetPrerequisiteDAG (DAGRequest) returns (DAGResponse);
}

// Frontend React Query Generated Hook:
import { useQuery } from '@tanstack/react-query';
import { createClient } from '@connectrpc/connect';
import { RoadmapService } from '@/components/roadmap/gen/service_connect';

export function useDAG(trackId: string) {
  return useQuery({
    queryKey: ['dag', trackId],
    queryFn: () => client.getPrerequisiteDAG({ trackId })
  });
}`}
                  </pre>
                </div>

                {/* Contract 3: Cyber Security ↔ Cloud & DevOps (Workload Identity) */}
                <div className="p-5 bg-white border-2 border-[#1A1A1A] space-y-3">
                  <div className="flex justify-between items-center border-b border-[#1A1A1A]/10 pb-2">
                    <span className="font-mono text-xs font-bold text-[#1A1A1A]">
                      03 / Security ↔ DevOps (OIDC Federated Auth)
                    </span>
                    <span className="text-[10px] font-mono bg-rose-100 text-rose-900 px-1.5 py-0.5 font-bold">
                      HARDENS_SECURITY
                    </span>
                  </div>
                  <p className="text-xs font-serif text-[#555]">
                    Eliminating static credentials by authenticating CI/CD runners with short-lived STS tokens.
                  </p>
                  <pre className="p-3 bg-[#1A1A1A] text-rose-300 font-mono text-[10px] overflow-x-auto leading-relaxed">
{`# GitHub Actions CI Workflow
jobs:
  deploy:
    runs-on: ubuntu-latest
    permissions:
      id-token: write # Required for OIDC token JWT
      contents: read
    steps:
      - name: Authenticate to Google Cloud
        uses: google-github-actions/auth@v2
        with:
          workload_identity_provider: 'projects/123/locations/global/workloadIdentityPools/github-pool/providers/github-provider'
          service_account: 'ci-runner@company-prod.iam.gserviceaccount.com'`}
                  </pre>
                </div>

                {/* Contract 4: Python Data ↔ AI/ML (Zero-Copy Arrow Buffers) */}
                <div className="p-5 bg-white border-2 border-[#1A1A1A] space-y-3">
                  <div className="flex justify-between items-center border-b border-[#1A1A1A]/10 pb-2">
                    <span className="font-mono text-xs font-bold text-[#1A1A1A]">
                      04 / Python Data ↔ AI/ML (Arrow &amp; Tensors)
                    </span>
                    <span className="text-[10px] font-mono bg-purple-100 text-purple-900 px-1.5 py-0.5 font-bold">
                      FEEDS_DATA_TO
                    </span>
                  </div>
                  <p className="text-xs font-serif text-[#555]">
                    Vectorized feature engineering pipelines transferring zero-copy memory into PyTorch training batches.
                  </p>
                  <pre className="p-3 bg-[#1A1A1A] text-purple-300 font-mono text-[10px] overflow-x-auto leading-relaxed">
{`import polars as pl
import torch
import pyarrow as pa

# Zero-copy Polars LazyFrame batch transformation
def load_feature_batch(file_path: str) -> torch.Tensor:
    df = (
        pl.scan_parquet(file_path)
        .filter(pl.col("importance") == "Required")
        .select(["vector_feature_a", "vector_feature_b"])
        .collect()
    )
    # Convert Arrow array directly to PyTorch tensor without copying memory
    arrow_table = df.to_arrow()
    return torch.from_numpy(arrow_table.to_pandas().to_numpy())`}
                  </pre>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
