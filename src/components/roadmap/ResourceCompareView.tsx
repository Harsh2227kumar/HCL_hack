import React, { useState, useEffect } from 'react';
import { Sparkles, ArrowRight, Loader2, AlertCircle } from 'lucide-react';
import { RoadmapNode } from '@/data/roadmapsData';

export interface ResourceCompareViewProps {
  nodeA: RoadmapNode;
  nodeB: RoadmapNode;
  onClose?: () => void;
  className?: string;
}

export const ResourceCompareView: React.FC<ResourceCompareViewProps> = ({
  nodeA,
  nodeB,
  onClose,
  className = '',
}) => {
  const [explanation, setExplanation] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    async function fetchCompare() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(
          `/api/explain/compare?resourceIdA=${encodeURIComponent(nodeA.id)}&resourceIdB=${encodeURIComponent(nodeB.id)}`
        );
        const data = await res.json();
        if (isMounted) {
          if (res.ok && data.explanation) {
            setExplanation(data.explanation);
          } else {
            setError(data.error || 'Unable to generate comparative explanation.');
          }
        }
      } catch (err: unknown) {
        if (isMounted) {
          const errMsg = err instanceof Error ? err.message : String(err);
          setError(errMsg);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchCompare();

    return () => {
      isMounted = false;
    };
  }, [nodeA.id, nodeB.id]);

  return (
    <div className={`p-4 border border-[#1A1A1A] bg-white space-y-4 font-mono text-xs ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#1A1A1A]/15 pb-2">
        <div className="flex items-center gap-2 text-[#1A1A1A] font-bold uppercase">
          <Sparkles className="w-4 h-4 text-emerald-700" />
          <span>Module Comparison Analysis</span>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="text-[10px] uppercase font-bold text-[#666] hover:text-[#1A1A1A] cursor-pointer"
          >
            Close
          </button>
        )}
      </div>

      {/* Side-by-side Table */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left text-xs">
          <thead>
            <tr className="bg-[#F8F7F4] border-b border-[#1A1A1A]/20 text-[10px] uppercase tracking-wider text-[#666]">
              <th className="p-2.5 font-bold">Attribute</th>
              <th className="p-2.5 font-bold text-emerald-900 bg-emerald-50/50">Module A: {nodeA.label}</th>
              <th className="p-2.5 font-bold text-indigo-900 bg-indigo-50/50">Module B: {nodeB.label}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1A1A1A]/10 text-[11px]">
            <tr>
              <td className="p-2.5 font-semibold text-[#555] bg-[#FAF9F6]">Category</td>
              <td className="p-2.5 text-[#1A1A1A]">{nodeA.category}</td>
              <td className="p-2.5 text-[#1A1A1A]">{nodeB.category}</td>
            </tr>
            <tr>
              <td className="p-2.5 font-semibold text-[#555] bg-[#FAF9F6]">Level</td>
              <td className="p-2.5 text-[#1A1A1A]">{nodeA.level}</td>
              <td className="p-2.5 text-[#1A1A1A]">{nodeB.level}</td>
            </tr>
            <tr>
              <td className="p-2.5 font-semibold text-[#555] bg-[#FAF9F6]">Estimated Effort</td>
              <td className="p-2.5 text-[#1A1A1A]">{nodeA.estimatedHours} hours</td>
              <td className="p-2.5 text-[#1A1A1A]">{nodeB.estimatedHours} hours</td>
            </tr>
            <tr>
              <td className="p-2.5 font-semibold text-[#555] bg-[#FAF9F6]">Prerequisite Count</td>
              <td className="p-2.5 text-[#1A1A1A]">{nodeA.prerequisites.length} prerequisites</td>
              <td className="p-2.5 text-[#1A1A1A]">{nodeB.prerequisites.length} prerequisites</td>
            </tr>
            <tr>
              <td className="p-2.5 font-semibold text-[#555] bg-[#FAF9F6]">Importance</td>
              <td className="p-2.5 text-[#1A1A1A]">{nodeA.importance}</td>
              <td className="p-2.5 text-[#1A1A1A]">{nodeB.importance}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Comparative AI Insight Section */}
      <div className="p-3 bg-[#F8F7F4] border border-[#1A1A1A]/15 rounded space-y-1">
        <span className="text-[10px] uppercase font-bold text-[#666] block flex items-center gap-1">
          <ArrowRight className="w-3 h-3 text-emerald-700" /> Comparative Decision Insight
        </span>
        {loading ? (
          <div className="flex items-center gap-2 text-[#666] text-xs py-2">
            <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-700" />
            <span>Loading comparative analysis...</span>
          </div>
        ) : error ? (
          <div className="flex items-center gap-1.5 text-rose-800 text-xs py-1">
            <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
        ) : (
          <p className="text-xs font-serif text-[#1A1A1A] leading-relaxed pt-1">
            {explanation}
          </p>
        )}
      </div>
    </div>
  );
};

export default ResourceCompareView;
