import React from 'react';
import { Target, AlertTriangle, ShieldCheck, HelpCircle } from 'lucide-react';

export interface SkillGapItem {
  skillName: string;
  current: number;
  target: number;
  gap: number;
  confidence?: number;
}

export interface SkillGapDashboardProps {
  targetRole?: string;
  bottleneckSkill?: string | null;
  skillGaps?: SkillGapItem[];
  isLoading?: boolean;
  error?: string | null;
  className?: string;
}

export const SkillGapDashboard: React.FC<SkillGapDashboardProps> = ({
  targetRole,
  bottleneckSkill,
  skillGaps = [],
  isLoading = false,
  error = null,
  className = '',
}) => {
  if (isLoading) {
    return (
      <div className={`p-4 border border-[#1A1A1A]/20 bg-white font-mono text-xs text-[#666] ${className}`}>
        <div className="flex items-center gap-2 animate-pulse">
          <div className="w-3.5 h-3.5 rounded-full border-2 border-emerald-600 border-t-transparent animate-spin" />
          <span>Analyzing empirical skill gaps...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`p-4 border border-rose-300 bg-rose-50 text-rose-900 font-mono text-xs ${className}`}>
        <div className="flex items-center gap-2 font-bold mb-1">
          <AlertTriangle className="w-4 h-4 text-rose-700" />
          <span>Skill Gap Analysis Unavailable</span>
        </div>
        <p className="text-[11px] text-rose-800">{error}</p>
      </div>
    );
  }

  if (!skillGaps || skillGaps.length === 0) {
    return (
      <div className={`p-4 border border-[#1A1A1A]/15 bg-[#F8F7F4] font-mono text-xs text-[#666] text-center ${className}`}>
        <p className="font-semibold text-[#1A1A1A]">No skill-gap data available yet.</p>
        <p className="text-[11px] text-[#777] mt-1">Complete an onboarding diagnostic to evaluate skill gaps.</p>
      </div>
    );
  }

  // Find largest gap value for classification
  const maxGap = Math.max(...skillGaps.map((g) => g.gap ?? 0), 0);

  // Sort: Bottleneck first, then by largest gap descending
  const sortedGaps = [...skillGaps].sort((a, b) => {
    const aIsBottleneck = bottleneckSkill?.toLowerCase() === a.skillName.toLowerCase();
    const bIsBottleneck = bottleneckSkill?.toLowerCase() === b.skillName.toLowerCase();
    if (aIsBottleneck && !bIsBottleneck) return -1;
    if (!aIsBottleneck && bIsBottleneck) return 1;
    return (b.gap ?? 0) - (a.gap ?? 0);
  });

  return (
    <div className={`border border-[#1A1A1A] bg-white p-4 space-y-4 shadow-xs ${className}`}>
      {/* Header & Target Role Context */}
      <div className="border-b border-[#1A1A1A]/15 pb-2.5 space-y-1">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-mono uppercase tracking-widest text-[#777] font-bold">
            Skill Gap & BKT Analysis
          </span>
          <span className="text-[9px] font-mono bg-emerald-100 text-emerald-900 border border-emerald-300 px-1.5 py-0.5 font-bold flex items-center gap-1">
            <ShieldCheck className="w-3 h-3 text-emerald-700" /> Active BKT Engine
          </span>
        </div>

        {targetRole && (
          <div className="flex items-center gap-1.5 pt-1 text-xs font-serif">
            <Target className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
            <span className="text-[#666] font-mono text-[10px] uppercase">Target Goal:</span>
            <strong className="text-[#1A1A1A] font-bold">{targetRole}</strong>
          </div>
        )}
      </div>

      {/* Skill Gaps Cards / Breakdown */}
      <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1">
        {sortedGaps.map((gapItem) => {
          const current = gapItem.current ?? 0;
          const target = gapItem.target ?? 5;
          const gap = gapItem.gap ?? 0;
          const confidence = gapItem.confidence;

          const isBottleneck = bottleneckSkill?.toLowerCase() === gapItem.skillName.toLowerCase();
          const isLargest = gap > 0 && gap === maxGap && !isBottleneck;

          // Gap interpretation
          let gapLabel = 'Small Gap';
          let gapBadgeStyle = 'bg-emerald-50 text-emerald-900 border-emerald-300';

          if (isBottleneck) {
            gapLabel = 'Bottleneck';
            gapBadgeStyle = 'bg-rose-600 text-white font-bold';
          } else if (isLargest || gap >= 2.5) {
            gapLabel = 'Large Gap';
            gapBadgeStyle = 'bg-amber-100 text-amber-900 border-amber-400 font-bold';
          } else if (gap >= 1.0) {
            gapLabel = 'Moderate Gap';
            gapBadgeStyle = 'bg-blue-50 text-blue-900 border-blue-300';
          }

          // Percent calculations on 0-5 scale
          const currentPercent = Math.min(100, Math.max(0, Math.round((current / 5) * 100)));
          const targetPercent = Math.min(100, Math.max(0, Math.round((target / 5) * 100)));

          // Format confidence safely
          let confidenceDisplay = 'Not available';
          if (confidence !== undefined && confidence !== null) {
            const confVal = confidence <= 1.0 ? Math.round(confidence * 100) : Math.round(confidence);
            confidenceDisplay = `${confVal}%`;
          }

          return (
            <div
              key={gapItem.skillName}
              className={`p-3 border text-xs font-mono space-y-2 transition-all ${
                isBottleneck
                  ? 'border-rose-500 bg-rose-50/60 shadow-[2px_2px_0px_#f43f5e]'
                  : isLargest
                  ? 'border-amber-500 bg-amber-50/40'
                  : 'border-[#1A1A1A]/15 bg-[#F8F7F4]/60'
              }`}
            >
              {/* Skill Name & Gap Badge */}
              <div className="flex items-start justify-between gap-2">
                <h4 className="font-bold text-[#1A1A1A] leading-snug">
                  {gapItem.skillName}
                </h4>
                <span className={`text-[9px] uppercase tracking-wider px-1.5 py-0.5 border ${gapBadgeStyle}`}>
                  {gapLabel}
                </span>
              </div>

              {/* Progress Bar (Current vs Target) */}
              <div
                className="relative w-full h-3 bg-[#EAE8E1] border border-[#1A1A1A]/20 overflow-hidden flex"
                role="progressbar"
                aria-label={`${gapItem.skillName} mastery level`}
                aria-valuenow={currentPercent}
                aria-valuemin={0}
                aria-valuemax={100}
              >
                <div
                  className="h-full bg-emerald-600 border-r border-[#1A1A1A]/10 transition-all duration-300"
                  style={{ width: `${currentPercent}%` }}
                  title={`Current Mastery: ${current.toFixed(1)} / 5.0`}
                />
                <div
                  className="h-full bg-amber-400/40 transition-all duration-300"
                  style={{ width: `${Math.max(0, targetPercent - currentPercent)}%` }}
                  title={`Gap to Target: ${gap.toFixed(1)}`}
                />
              </div>

              {/* Metrics Row: Current -> Target -> Gap -> Confidence */}
              <div className="grid grid-cols-4 gap-1 text-[10px] text-[#555] pt-0.5 border-t border-[#1A1A1A]/10">
                <div>
                  <span className="text-[#888] block text-[9px]">CURRENT</span>
                  <strong className="text-[#1A1A1A]">{current.toFixed(1)} / 5.0</strong>
                </div>
                <div>
                  <span className="text-[#888] block text-[9px]">TARGET</span>
                  <strong className="text-[#1A1A1A]">{target.toFixed(1)} / 5.0</strong>
                </div>
                <div>
                  <span className="text-[#888] block text-[9px]">GAP</span>
                  <strong className="text-[#1A1A1A]">{gap.toFixed(1)}</strong>
                </div>
                <div className="text-right">
                  <span className="text-[#888] block text-[9px] flex items-center justify-end gap-0.5" title="Bayesian Knowledge Tracing Confidence">
                    CONFIDENCE <HelpCircle className="w-2.5 h-2.5 text-[#888]" />
                  </span>
                  <strong className="text-[#1A1A1A] font-bold">{confidenceDisplay}</strong>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SkillGapDashboard;
