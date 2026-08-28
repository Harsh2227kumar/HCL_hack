"use client";

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  GitBranch, 
  Search, 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  ListTree, 
  LayoutGrid, 
  CheckCircle2, 
  Clock, 
  ArrowRight,
  Info,
  SlidersHorizontal,
  ChevronRight,
  Download
} from 'lucide-react';
import { RoadmapPath, RoadmapNode } from '@/data/roadmapsData';

interface DAGVisualizerProps {
  roadmaps: RoadmapPath[];
  selectedRoadmap: RoadmapPath;
  onSelectRoadmap: (roadmap: RoadmapPath) => void;
  selectedNode: RoadmapNode | null;
  onSelectNode: (node: RoadmapNode | null) => void;
  onToggleStatus: (nodeId: string, status: 'not-started' | 'in-progress' | 'mastered' | 'too-hard' | 'skipped') => void;
  activeRecommendation?: any;
}

interface LayoutNode extends RoadmapNode {
  tier: number; // Topological column/layer
  orderInTier: number; // Row position in tier
  x: number;
  y: number;
}

export const DAGVisualizer: React.FC<DAGVisualizerProps> = ({
  roadmaps,
  selectedRoadmap,
  onSelectRoadmap,
  selectedNode,
  onSelectNode,
  onToggleStatus,
  activeRecommendation
}) => {
  const [viewMode, setViewMode] = useState<'graph' | 'list'>('graph');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterLevel, setFilterLevel] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);

  // Pan & Zoom state for interactive graph canvas
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 40, y: 40 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  // Compute Topological Tiers (Layers) for DAG layout
  const layoutData = useMemo(() => {
    const nodes = selectedRoadmap.nodes;
    const nodeMap = new Map<string, RoadmapNode>();
    nodes.forEach(n => nodeMap.set(n.id, n));

    // Calculate tier for each node (longest path from any root)
    const tiers = new Map<string, number>();

    const getTier = (id: string, visited: Set<string> = new Set()): number => {
      if (tiers.has(id)) return tiers.get(id)!;
      if (visited.has(id)) return 0; // Avoid cycles if any
      visited.add(id);

      const node = nodeMap.get(id);
      if (!node || node.prerequisites.length === 0) {
        tiers.set(id, 0);
        return 0;
      }

      let maxParentTier = -1;
      for (const parentId of node.prerequisites) {
        if (nodeMap.has(parentId)) {
          const pTier = getTier(parentId, new Set(visited));
          if (pTier > maxParentTier) maxParentTier = pTier;
        }
      }

      const calculatedTier = maxParentTier + 1;
      tiers.set(id, calculatedTier);
      return calculatedTier;
    };

    nodes.forEach(n => getTier(n.id));

    // Group nodes by tier
    const tierGroups: Record<number, RoadmapNode[]> = {};
    nodes.forEach(n => {
      const t = tiers.get(n.id) || 0;
      if (!tierGroups[t]) tierGroups[t] = [];
      tierGroups[t].push(n);
    });

    // Determine dimensions & coordinates
    const NODE_WIDTH = 260;
    const NODE_HEIGHT = 140;
    const HORIZONTAL_GAP = 120;
    const VERTICAL_GAP = 40;

    const layoutNodes: LayoutNode[] = [];
    const layoutNodeMap = new Map<string, LayoutNode>();

    const maxTier = Math.max(...Object.keys(tierGroups).map(Number), 0);

    for (let t = 0; t <= maxTier; t++) {
      const group = tierGroups[t] || [];
      group.forEach((node, idx) => {
        const x = t * (NODE_WIDTH + HORIZONTAL_GAP) + 60;
        const y = idx * (NODE_HEIGHT + VERTICAL_GAP) + 60;
        const layoutNode: LayoutNode = {
          ...node,
          tier: t,
          orderInTier: idx,
          x,
          y
        };
        layoutNodes.push(layoutNode);
        layoutNodeMap.set(node.id, layoutNode);
      });
    }

    // Build edges
    interface Edge {
      id: string;
      from: string;
      to: string;
      fromNode: LayoutNode;
      toNode: LayoutNode;
      isHighlighted: boolean;
      isAncestor: boolean;
      isDescendant: boolean;
    }

    const edges: Edge[] = [];
    layoutNodes.forEach(child => {
      child.prerequisites.forEach(prereqId => {
        const parent = layoutNodeMap.get(prereqId);
        if (parent) {
          edges.push({
            id: `${parent.id}->${child.id}`,
            from: parent.id,
            to: child.id,
            fromNode: parent,
            toNode: child,
            isHighlighted: false,
            isAncestor: false,
            isDescendant: false
          });
        }
      });
    });

    const graphWidth = (maxTier + 1) * (NODE_WIDTH + HORIZONTAL_GAP) + 200;
    const maxNodesInAnyTier = Math.max(...Object.values(tierGroups).map(g => g.length), 1);
    const graphHeight = maxNodesInAnyTier * (NODE_HEIGHT + VERTICAL_GAP) + 200;

    return {
      nodes: layoutNodes,
      nodeMap: layoutNodeMap,
      edges,
      maxTier,
      graphWidth,
      graphHeight,
      tierGroups
    };
  }, [selectedRoadmap]);

  // Compute active lineage highlighting (Ancestors and Descendants of selected or hovered node)
  const activeFocusId = hoveredNodeId || selectedNode?.id;

  const { ancestorIds, descendantIds } = useMemo(() => {
    if (!activeFocusId) return { ancestorIds: new Set<string>(), descendantIds: new Set<string>() };

    const ancestors = new Set<string>();
    const descendants = new Set<string>();

    // BFS for Ancestors
    const queueA = [activeFocusId];
    while (queueA.length > 0) {
      const current = queueA.shift()!;
      const node = layoutData.nodeMap.get(current);
      if (node) {
        node.prerequisites.forEach(pId => {
          if (!ancestors.has(pId)) {
            ancestors.add(pId);
            queueA.push(pId);
          }
        });
      }
    }

    // BFS for Descendants
    const queueD = [activeFocusId];
    while (queueD.length > 0) {
      const current = queueD.shift()!;
      layoutData.nodes.forEach(other => {
        if (other.prerequisites.includes(current) && !descendants.has(other.id)) {
          descendants.add(other.id);
          queueD.push(other.id);
        }
      });
    }

    return { ancestorIds: ancestors, descendantIds: descendants };
  }, [activeFocusId, layoutData]);

  // Filtered nodes
  const filteredNodes = useMemo(() => {
    return selectedRoadmap.nodes.filter(n => {
      const matchesSearch = searchQuery === '' || 
        n.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        n.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        n.keyTopics.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const matchesLevel = filterLevel === 'all' || n.level.toLowerCase() === filterLevel.toLowerCase();
      const matchesStatus = filterStatus === 'all' || (n.status || 'not-started') === filterStatus;

      return matchesSearch && matchesLevel && matchesStatus;
    });
  }, [selectedRoadmap, searchQuery, filterLevel, filterStatus]);

  // Track summary KPIs
  const totalHours = selectedRoadmap.nodes.reduce((acc, n) => acc + n.estimatedHours, 0);
  const masteredCount = selectedRoadmap.nodes.filter(n => n.status === 'mastered').length;
  const inProgressCount = selectedRoadmap.nodes.filter(n => n.status === 'in-progress').length;
  const masteredHours = selectedRoadmap.nodes
    .filter(n => n.status === 'mastered')
    .reduce((acc, n) => acc + n.estimatedHours, 0);
  const progressPercent = Math.round((masteredCount / selectedRoadmap.nodes.length) * 100);

  // Mouse drag handlers for Canvas Panning
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return; // only left click
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

  const resetView = () => {
    setZoom(1);
    setPan({ x: 40, y: 40 });
  };

  // Center view on track change
  useEffect(() => {
    resetView();
  }, [selectedRoadmap.id]);

  return (
    <div className="flex-1 flex flex-col lg:flex-row h-full min-h-[750px] bg-[#FDFCFB] overflow-hidden">
      {/* LEFT SIDEBAR: Roadmap Tracks & Filters */}
      <aside className="w-full lg:w-80 border-b lg:border-b-0 lg:border-r border-[#1A1A1A]/15 bg-[#F8F7F4] flex flex-col shrink-0 p-4 sm:p-6 overflow-y-auto space-y-6">
        {/* Track Selector */}
        <div>
          <div className="flex justify-between items-center mb-3">
            <span className="text-[10px] font-mono uppercase tracking-[0.25em] text-[#666] font-bold">
              01 / Select Domain Track
            </span>
            <span className="text-[10px] font-mono bg-[#1A1A1A] text-white px-2 py-0.5">
              8 Available
            </span>
          </div>

          <div className="space-y-1.5">
            {roadmaps.map((r) => {
              const isSelected = r.id === selectedRoadmap.id;
              const rMastered = r.nodes.filter(n => n.status === 'mastered').length;
              const rPct = Math.round((rMastered / r.nodes.length) * 100);
              return (
                <button
                  key={r.id}
                  onClick={() => {
                    onSelectRoadmap(r);
                    onSelectNode(null);
                  }}
                  className={`w-full text-left p-3 border transition-all cursor-pointer group flex flex-col ${
                    isSelected
                      ? 'bg-[#1A1A1A] text-white border-[#1A1A1A] shadow-[3px_3px_0px_rgba(0,0,0,0.15)]'
                      : 'bg-white text-[#1A1A1A] border-[#D5D2C9] hover:border-[#1A1A1A] hover:bg-[#FAF9F6]'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <span className={`font-serif font-bold text-sm sm:text-base leading-snug ${isSelected ? 'italic text-white' : 'text-[#1A1A1A]'}`}>
                      {r.title}
                    </span>
                    <span className={`text-[10px] font-mono px-1.5 py-0.5 ${
                      isSelected ? 'bg-white/20 text-white' : 'bg-[#EAE8E1] text-[#666]'
                    }`}>
                      {r.nodes.length} Nodes
                    </span>
                  </div>
                  <div className="flex justify-between items-center mt-2 text-[10px] font-mono">
                    <span className={isSelected ? 'text-[#AAA]' : 'text-[#666]'}>
                      {r.totalHours}h Total • {r.category}
                    </span>
                    <span className={isSelected ? 'text-emerald-400 font-bold' : 'text-emerald-800'}>
                      {rPct}% Done
                    </span>
                  </div>
                  {/* Progress micro bar */}
                  <div className="w-full bg-[#333]/20 h-1 mt-2 overflow-hidden">
                    <div 
                      className={`h-full ${isSelected ? 'bg-emerald-400' : 'bg-[#1A1A1A]'}`}
                      style={{ width: `${rPct}%` }}
                    />
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected Track Deep Metrics */}
        <div className="border border-[#1A1A1A] bg-white p-4 space-y-3">
          <div className="text-[10px] font-mono uppercase tracking-widest text-[#777] font-bold border-b border-[#1A1A1A]/10 pb-1 flex justify-between items-center">
            <span>Track Statistics</span>
            <span className="font-bold text-[#1A1A1A]">{selectedRoadmap.role}</span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs font-mono">
            <div className="bg-[#F8F7F4] p-2 border border-[#1A1A1A]/10">
              <span className="text-[10px] text-[#777] block">Progress</span>
              <span className="text-lg font-serif font-bold text-emerald-800">{progressPercent}%</span>
              <span className="text-[10px] text-[#555] block">{masteredCount}/{selectedRoadmap.nodes.length} Mastered</span>
            </div>
            <div className="bg-[#F8F7F4] p-2 border border-[#1A1A1A]/10">
              <span className="text-[10px] text-[#777] block">Total Effort</span>
              <span className="text-lg font-serif font-bold text-[#1A1A1A]">{totalHours}h</span>
              <span className="text-[10px] text-[#555] block">{masteredHours}h Completed</span>
            </div>
          </div>

          <div className="text-[11px] font-serif text-[#555] italic leading-relaxed pt-1">
            "{selectedRoadmap.description}"
          </div>
        </div>
 
        {/* Personalized Skill Gaps Analysis */}
        {selectedRoadmap.id === 'personalized-engine-path' && activeRecommendation?.skillGaps && activeRecommendation.skillGaps.length > 0 && (
          <div className="border border-[#1A1A1A] bg-white p-4 space-y-3 shadow-xs">
            <div className="text-[10px] font-mono uppercase tracking-widest text-[#777] font-bold border-b border-[#1A1A1A]/10 pb-1 flex justify-between items-center">
              <span>02 / Skill Gap Analysis</span>
              <span className="font-bold text-emerald-800 uppercase text-[9px] bg-emerald-100 px-1.5 py-0.5 animate-pulse">
                Active BKT Engine
              </span>
            </div>

            <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
              {activeRecommendation.skillGaps.map((gapItem: any) => {
                const current = gapItem.current ?? 0;
                const target = gapItem.target ?? 5;
                const gap = gapItem.gap ?? 0;
                const confidence = gapItem.confidence;
                
                const isBottleneck = activeRecommendation.bottleneck?.toLowerCase() === gapItem.skillName?.toLowerCase();
                
                // Find largest gap
                const largestGapValue = Math.max(...activeRecommendation.skillGaps.map((g: any) => g.gap ?? 0));
                const isLargestGap = gap > 0 && gap === largestGapValue;

                // Percent calculations (assuming 5.0 is the max rating scale)
                const currentPercent = Math.min(100, Math.round((current / 5) * 100));
                const targetPercent = Math.min(100, Math.round((target / 5) * 100));

                return (
                  <div key={gapItem.skillName} className={`p-2 border text-[11px] font-mono space-y-1.5 transition-all ${
                    isBottleneck
                      ? 'border-rose-500 bg-rose-50/50 shadow-[2px_2px_0px_#f43f5e]'
                      : isLargestGap
                      ? 'border-amber-500 bg-amber-50/30'
                      : 'border-[#1A1A1A]/10 bg-[#F8F7F4]/50'
                  }`}>
                    <div className="flex justify-between items-start">
                      <span className="font-bold text-[#1A1A1A] max-w-[170px] truncate">
                        {gapItem.skillName}
                      </span>
                      {isBottleneck ? (
                        <span className="text-[8px] uppercase tracking-wider font-bold bg-rose-600 text-white px-1 py-0.2">
                          Bottleneck
                        </span>
                      ) : isLargestGap ? (
                        <span className="text-[8px] uppercase tracking-wider font-bold bg-amber-600 text-white px-1 py-0.2">
                          Largest Gap
                        </span>
                      ) : null}
                    </div>

                    {/* Progress visual bar */}
                    <div className="relative w-full h-3 bg-[#EAE8E1] border border-[#1A1A1A]/15 overflow-hidden flex">
                      {/* Current level */}
                      <div
                        className="h-full bg-emerald-600 border-r border-[#1A1A1A]/10"
                        style={{ width: `${currentPercent}%` }}
                        title={`Current: ${current.toFixed(1)}`}
                      />
                      {/* Gap level to target */}
                      <div
                        className="h-full bg-amber-400/40"
                        style={{ width: `${Math.max(0, targetPercent - currentPercent)}%` }}
                        title={`Gap to Target: ${gap.toFixed(1)}`}
                      />
                    </div>

                    <div className="flex justify-between items-center text-[9px] text-[#666]">
                      <span>
                        Current: <strong className="text-[#1A1A1A]">{current.toFixed(1)}</strong> / Target: <strong className="text-[#1A1A1A]">{target}</strong>
                      </span>
                      <span>
                        Gap: <strong className="text-[#1A1A1A]">{gap.toFixed(1)}</strong>
                      </span>
                    </div>

                    {confidence !== undefined && (
                      <div className="text-[8px] text-[#888] flex justify-between items-center pt-0.5 border-t border-[#1A1A1A]/5">
                        <span>BKT Confidence:</span>
                        <span className="font-bold text-[#444]">{Math.round(confidence * 100)}%</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Search & Filters */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#666] font-bold">
              Filter Graph Nodes
            </span>
            <SlidersHorizontal className="w-3.5 h-3.5 text-[#666]" />
          </div>

          {/* Search Input */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-[#777]" />
            <input
              type="text"
              placeholder="Search skill, topic, stack..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs font-mono bg-white border border-[#1A1A1A]/30 focus:border-[#1A1A1A] focus:outline-none placeholder:text-[#999]"
            />
          </div>

          {/* Level Filter */}
          <div className="grid grid-cols-2 gap-1.5 text-xs font-mono">
            {['all', 'fundamentals', 'intermediate', 'advanced', 'expert'].map((lvl) => (
              <button
                key={lvl}
                onClick={() => setFilterLevel(lvl)}
                className={`px-2 py-1.5 border text-left capitalize cursor-pointer transition-colors ${
                  filterLevel === lvl
                    ? 'bg-[#1A1A1A] text-white border-[#1A1A1A] font-bold'
                    : 'bg-white text-[#555] border-[#D5D2C9] hover:border-[#1A1A1A]'
                }`}
              >
                {lvl}
              </button>
            ))}
          </div>

          {/* Status Filter */}
          <div className="grid grid-cols-2 gap-1.5 text-xs font-mono pt-1">
            {[
              { id: 'all', label: 'All Statuses' },
              { id: 'mastered', label: 'Mastered' },
              { id: 'in-progress', label: 'In Progress' },
              { id: 'not-started', label: 'Not Started' }
            ].map((st) => (
              <button
                key={st.id}
                onClick={() => setFilterStatus(st.id)}
                className={`px-2 py-1.5 border text-left cursor-pointer transition-colors ${
                  filterStatus === st.id
                    ? 'bg-[#1A1A1A] text-white border-[#1A1A1A] font-bold'
                    : 'bg-white text-[#555] border-[#D5D2C9] hover:border-[#1A1A1A]'
                }`}
              >
                {st.label}
              </button>
            ))}
          </div>
        </div>
      </aside>

      {/* RIGHT MAIN: Canvas / List View */}
      <main className="flex-1 flex flex-col h-full overflow-hidden bg-[#FDFCFB]">
        {/* Main Toolbar */}
        <div className="border-b border-[#1A1A1A]/15 bg-[#F8F7F4] p-3 sm:px-6 flex flex-wrap justify-between items-center gap-3">
          {/* Left: View Mode toggle and Graph info */}
          <div className="flex items-center gap-3">
            <div className="inline-flex border border-[#1A1A1A] bg-white p-0.5">
              <button
                onClick={() => setViewMode('graph')}
                className={`px-3 py-1.5 text-xs font-mono uppercase flex items-center gap-1.5 transition-all cursor-pointer ${
                  viewMode === 'graph' ? 'bg-[#1A1A1A] text-white font-bold' : 'text-[#555] hover:text-[#1A1A1A]'
                }`}
              >
                <GitBranch className="w-3.5 h-3.5" />
                <span>Topological DAG</span>
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`px-3 py-1.5 text-xs font-mono uppercase flex items-center gap-1.5 transition-all cursor-pointer ${
                  viewMode === 'list' ? 'bg-[#1A1A1A] text-white font-bold' : 'text-[#555] hover:text-[#1A1A1A]'
                }`}
              >
                <ListTree className="w-3.5 h-3.5" />
                <span>Syllabus Sequence</span>
              </button>
            </div>

            <div className="hidden sm:flex items-center gap-2 text-xs font-mono text-[#666]">
              <span>Tiers: {layoutData.maxTier + 1} Columns</span>
              <span>•</span>
              <span>Prerequisite Edges: {layoutData.edges.length}</span>
            </div>
          </div>

          {/* Right: Zoom controls & Lineage Legend */}
          <div className="flex items-center gap-3">
            {viewMode === 'graph' && (
              <div className="flex items-center gap-1 border border-[#1A1A1A] bg-white px-1 py-0.5">
                <button
                  onClick={() => setZoom(z => Math.max(0.4, z - 0.15))}
                  className="p-1.5 hover:bg-[#F8F7F4] text-[#1A1A1A] cursor-pointer"
                  title="Zoom Out"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>
                <span className="text-xs font-mono px-1.5 min-w-[44px] text-center font-bold">
                  {Math.round(zoom * 100)}%
                </span>
                <button
                  onClick={() => setZoom(z => Math.min(2.0, z + 0.15))}
                  className="p-1.5 hover:bg-[#F8F7F4] text-[#1A1A1A] cursor-pointer"
                  title="Zoom In"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={resetView}
                  className="p-1.5 hover:bg-[#F8F7F4] text-[#1A1A1A] border-l border-[#1A1A1A]/20 cursor-pointer"
                  title="Reset View"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Lineage indicator */}
            {activeFocusId && (
              <div className="hidden md:flex items-center gap-2 bg-amber-50 border border-amber-300 text-amber-950 px-2.5 py-1 text-[11px] font-mono">
                <span className="font-bold">Tracing:</span>
                <span>{ancestorIds.size} Prerequisites</span>
                <span>•</span>
                <span>{descendantIds.size} Unlocked</span>
              </div>
            )}
          </div>
        </div>

        {/* VIEW 1: Interactive Canvas / SVG DAG Visualizer */}
        {viewMode === 'graph' ? (
          <div
            ref={containerRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            className={`flex-1 relative overflow-hidden select-none bg-[#FAF9F6] ${
              isDragging ? 'cursor-grabbing' : 'cursor-grab'
            }`}
            style={{
              backgroundImage: 'radial-gradient(#1A1A1A 0.75px, transparent 0.75px)',
              backgroundSize: '24px 24px',
              backgroundColor: '#FDFCFB'
            }}
          >
            {/* Top tier column labels watermark */}
            <div 
              className="absolute pointer-events-none transition-transform duration-75"
              style={{
                transform: `translate(${pan.x}px, ${pan.y - 28}px) scale(${zoom})`,
                transformOrigin: '0 0'
              }}
            >
              {Array.from({ length: layoutData.maxTier + 1 }).map((_, t) => (
                <div
                  key={t}
                  className="absolute text-[11px] font-mono uppercase tracking-[0.2em] font-bold text-[#888] border-b border-[#1A1A1A]/20 pb-1"
                  style={{
                    left: `${t * (260 + 120) + 60}px`,
                    width: '260px'
                  }}
                >
                  Tier 0{t + 1} / {t === 0 ? 'Foundation Level' : t === layoutData.maxTier ? 'Capstone / Ops' : 'Core & Advanced'}
                </div>
              ))}
            </div>

            {/* Scaled & Panned Canvas Viewport */}
            <div
              className="absolute origin-top-left transition-transform duration-75"
              style={{
                transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                width: `${layoutData.graphWidth}px`,
                height: `${layoutData.graphHeight}px`
              }}
            >
              {/* SVG Connectors / Prerequisite Edges Layer */}
              <svg
                className="absolute inset-0 pointer-events-none overflow-visible"
                width={layoutData.graphWidth}
                height={layoutData.graphHeight}
              >
                <defs>
                  {/* Default arrow marker */}
                  <marker
                    id="arrowhead"
                    markerWidth="8"
                    markerHeight="6"
                    refX="7"
                    refY="3"
                    orient="auto"
                  >
                    <polygon points="0 0, 8 3, 0 6" fill="#888" />
                  </marker>
                  {/* Active highlight arrow marker */}
                  <marker
                    id="arrowhead-highlight"
                    markerWidth="9"
                    markerHeight="7"
                    refX="8"
                    refY="3.5"
                    orient="auto"
                  >
                    <polygon points="0 0, 9 3.5, 0 7" fill="#1A1A1A" />
                  </marker>
                  {/* Ancestor amber marker */}
                  <marker
                    id="arrowhead-ancestor"
                    markerWidth="9"
                    markerHeight="7"
                    refX="8"
                    refY="3.5"
                    orient="auto"
                  >
                    <polygon points="0 0, 9 3.5, 0 7" fill="#b45309" />
                  </marker>
                </defs>

                {layoutData.edges.map((edge) => {
                  const fromX = edge.fromNode.x + 260; // right edge of parent
                  const fromY = edge.fromNode.y + 70;  // vertical center
                  const toX = edge.toNode.x;           // left edge of child
                  const toY = edge.toNode.y + 70;      // vertical center

                  // Curvature control points
                  const midX = (fromX + toX) / 2;
                  const pathD = `M ${fromX} ${fromY} C ${midX} ${fromY}, ${midX} ${toY}, ${toX} ${toY}`;

                  const isDirectPrereqOfHover = edge.to === activeFocusId;
                  const isDirectChildOfHover = edge.from === activeFocusId;
                  const isAncestorEdge = ancestorIds.has(edge.from) && (ancestorIds.has(edge.to) || edge.to === activeFocusId);
                  const isDescendantEdge = (descendantIds.has(edge.from) || edge.from === activeFocusId) && descendantIds.has(edge.to);
                  const isHighlighted = isDirectPrereqOfHover || isDirectChildOfHover || isAncestorEdge || isDescendantEdge;

                  let strokeColor = '#C8C4B8';
                  let strokeWidth = 1.5;
                  let marker = 'url(#arrowhead)';

                  if (isDirectPrereqOfHover || isAncestorEdge) {
                    strokeColor = '#b45309'; // Amber for prerequisites
                    strokeWidth = 2.5;
                    marker = 'url(#arrowhead-ancestor)';
                  } else if (isDirectChildOfHover || isDescendantEdge) {
                    strokeColor = '#1A1A1A'; // Black for unlocked descendants
                    strokeWidth = 2.5;
                    marker = 'url(#arrowhead-highlight)';
                  } else if (activeFocusId) {
                    strokeColor = '#EAE7DE'; // Dimmed out when another node is focused
                    strokeWidth = 1;
                  }

                  return (
                    <g key={edge.id}>
                      <path
                        d={pathD}
                        fill="none"
                        stroke={strokeColor}
                        strokeWidth={strokeWidth}
                        markerEnd={marker}
                        strokeDasharray={isDirectPrereqOfHover ? '4,4' : 'none'}
                        className="transition-all duration-150"
                      />
                    </g>
                  );
                })}
              </svg>

              {/* Node Cards Layer */}
              {layoutData.nodes.map((node) => {
                const isSelected = selectedNode?.id === node.id;
                const isHovered = hoveredNodeId === node.id;
                const isAncestor = ancestorIds.has(node.id);
                const isDescendant = descendantIds.has(node.id);
                const isFocused = activeFocusId === node.id;

                // Dim other nodes if something is focused
                const isDimmed = activeFocusId && !isFocused && !isAncestor && !isDescendant;

                const isFilteredOut = !filteredNodes.some(fn => fn.id === node.id);

                return (
                  <div
                    key={node.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectNode(node);
                    }}
                    onMouseEnter={() => setHoveredNodeId(node.id)}
                    onMouseLeave={() => setHoveredNodeId(null)}
                    style={{
                      left: `${node.x}px`,
                      top: `${node.y}px`,
                      width: '260px',
                      height: '140px'
                    }}
                    className={`absolute p-4 border-2 transition-all duration-150 cursor-pointer flex flex-col justify-between ${
                      isFilteredOut ? 'opacity-20 pointer-events-none' : ''
                    } ${
                      isDimmed ? 'opacity-40' : 'opacity-100'
                    } ${
                      isSelected
                        ? 'border-[#1A1A1A] bg-white shadow-[6px_6px_0px_#1A1A1A] -translate-y-1'
                        : isFocused
                        ? 'border-[#1A1A1A] bg-white shadow-[4px_4px_0px_#1A1A1A]'
                        : isAncestor
                        ? 'border-amber-700 bg-amber-50/50 shadow-[3px_3px_0px_#b45309]'
                        : isDescendant
                        ? 'border-blue-900 bg-blue-50/40 shadow-[3px_3px_0px_#1e3a8a]'
                        : 'border-[#1A1A1A]/40 bg-white hover:border-[#1A1A1A] hover:shadow-[4px_4px_0px_rgba(0,0,0,0.15)]'
                    }`}
                  >
                    {/* Card Header: Category & Level */}
                    <div className="flex justify-between items-start">
                      <span className="text-[9px] font-mono uppercase tracking-wider text-[#666] font-semibold truncate max-w-[150px]">
                        {node.category}
                      </span>
                      <span className={`text-[9px] font-mono px-1.5 py-0.5 border ${
                        node.level === 'Fundamentals' ? 'bg-emerald-50 text-emerald-900 border-emerald-300' :
                        node.level === 'Intermediate' ? 'bg-blue-50 text-blue-900 border-blue-300' :
                        node.level === 'Advanced' ? 'bg-purple-50 text-purple-900 border-purple-300' :
                        'bg-rose-50 text-rose-900 border-rose-300'
                      }`}>
                        {node.level}
                      </span>
                    </div>

                    {/* Card Title */}
                    <h3 className="font-serif font-bold text-sm leading-snug text-[#1A1A1A] line-clamp-2 my-1">
                      {node.label}
                    </h3>

                    {/* Card Footer: Hours & Status Badge */}
                    <div className="flex justify-between items-center pt-2 border-t border-[#1A1A1A]/10 text-[10px] font-mono">
                      <span className="text-[#555] font-semibold flex items-center gap-1">
                        <Clock className="w-3 h-3 text-[#777]" />
                        {node.estimatedHours}h
                      </span>

                      {node.status === 'mastered' ? (
                        <span className="text-emerald-800 font-bold flex items-center gap-1 bg-emerald-100 px-1.5 py-0.5">
                          <CheckCircle2 className="w-3 h-3" /> Mastered
                        </span>
                      ) : node.status === 'in-progress' ? (
                        <span className="text-amber-800 font-bold flex items-center gap-1 bg-amber-100 px-1.5 py-0.5">
                          <Clock className="w-3 h-3" /> In Progress
                        </span>
                      ) : (
                        <span className="text-[#777] bg-[#EAE8E1] px-1.5 py-0.5">
                          Not Started
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Bottom Floating Legend Bar */}
            <div className="absolute bottom-4 left-4 right-4 sm:right-auto bg-[#FDFCFB]/95 backdrop-blur-sm border border-[#1A1A1A] p-3 text-xs font-mono shadow-md flex flex-wrap items-center gap-4">
              <span className="font-bold text-[#1A1A1A] uppercase tracking-wider text-[10px]">Graph Guide:</span>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 border border-amber-700 bg-amber-100 inline-block"></span>
                <span>Required Prerequisite</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 border border-blue-900 bg-blue-100 inline-block"></span>
                <span>Unlocked Next Step</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 bg-emerald-500 inline-block"></span>
                <span>Mastered ✓</span>
              </div>
              <span className="hidden sm:inline text-[#999]">|</span>
              <span className="text-[10px] text-[#666] hidden md:inline">
                Click any node to inspect rubrics &amp; company standards.
              </span>
            </div>
          </div>
        ) : (
          /* VIEW 2: Syllabus / Sequence List View */
          <div className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-4">
            <div className="border-b-2 border-[#1A1A1A] pb-3 mb-6 flex justify-between items-baseline">
              <div>
                <h2 className="text-2xl sm:text-3xl font-serif italic text-[#1A1A1A]">
                  Topological Learning Sequence
                </h2>
                <p className="text-xs font-mono text-[#666] mt-1">
                  Linearized prerequisite execution plan for {selectedRoadmap.title}
                </p>
              </div>
              <span className="text-xs font-mono font-bold bg-[#1A1A1A] text-white px-3 py-1">
                {filteredNodes.length} Modules Total
              </span>
            </div>

            <div className="space-y-3">
              {filteredNodes.map((node, index) => {
                const prereqs = selectedRoadmap.nodes.filter(n => node.prerequisites.includes(n.id));
                return (
                  <div
                    key={node.id}
                    onClick={() => onSelectNode(node)}
                    className="p-5 bg-white border border-[#1A1A1A]/25 hover:border-[#1A1A1A] transition-all cursor-pointer hover:shadow-[4px_4px_0px_#1A1A1A] group"
                  >
                    <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 pb-2 border-b border-[#1A1A1A]/10">
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-sm font-bold bg-[#F8F7F4] text-[#1A1A1A] border border-[#1A1A1A]/20 px-2 py-0.5">
                          {index < 9 ? `0${index + 1}` : index + 1}
                        </span>
                        <h3 className="font-serif font-bold text-lg text-[#1A1A1A] group-hover:underline">
                          {node.label}
                        </h3>
                      </div>
                      <div className="flex items-center gap-2 text-xs font-mono">
                        <span className="text-[#666]">{node.estimatedHours} Hours</span>
                        <span className="px-2 py-0.5 bg-[#EAE8E1] text-[#333]">{node.level}</span>
                        <span className={`px-2 py-0.5 font-bold ${
                          node.status === 'mastered' ? 'bg-emerald-100 text-emerald-900 border border-emerald-300' :
                          node.status === 'in-progress' ? 'bg-amber-100 text-amber-900 border border-amber-300' :
                          'bg-[#F0EFEA] text-[#777]'
                        }`}>
                          {node.status === 'mastered' ? 'Mastered ✓' : node.status === 'in-progress' ? 'In Progress' : 'Not Started'}
                        </span>
                      </div>
                    </div>

                    <p className="text-sm font-serif text-[#444] mt-2 leading-relaxed">
                      {node.description}
                    </p>

                    {/* Prereq tags */}
                    <div className="flex flex-wrap items-center gap-2 mt-3 text-[11px] font-mono text-[#666]">
                      <span className="font-bold text-[#1A1A1A]">Prerequisites:</span>
                      {prereqs.length === 0 ? (
                        <span className="text-emerald-800 italic">None (Root entry point)</span>
                      ) : (
                        prereqs.map(p => (
                          <span key={p.id} className="bg-[#F8F7F4] border border-[#1A1A1A]/20 px-2 py-0.5">
                            {p.label}
                          </span>
                        ))
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
