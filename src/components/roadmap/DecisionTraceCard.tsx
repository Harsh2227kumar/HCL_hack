import React from 'react';
import { Sparkles, HelpCircle } from 'lucide-react';

export interface ScoreBreakdown {
  skill_gap_match?: number;
  prerequisite_fit?: number;
  retrievalSimilarity?: number;
  retrieval_similarity?: number;
  difficulty_fit?: number;
  time_fit?: number;
  learning_style_fit?: number;
  [key: string]: number | undefined;
}

export interface DecisionTraceCardProps {
  resourceTitle: string;
  score?: number;
  scoreBreakdown?: ScoreBreakdown;
  reason?: string;
  traceExplanation?: string | null;
  isFallback?: boolean;
  className?: string;
}

export const getDeterministicTraceSummary = (
  breakdown?: ScoreBreakdown,
  fallbackReason?: string
): string => {
  if (!breakdown || Object.keys(breakdown).length === 0) {
    return (
      fallbackReason ||
      'Recommended based on standard curriculum sequence and foundational skill requirements.'
    );
  }

  const skillGap = breakdown.skill_gap_match ?? 0;
  const prereqFit = breakdown.prerequisite_fit ?? 0;
  const semanticFit =
    (breakdown.retrievalSimilarity !== undefined
      ? breakdown.retrievalSimilarity
      : breakdown.retrieval_similarity) ?? 0;
  const difficultyFit = breakdown.difficulty_fit ?? 0;
  const timeFit = breakdown.time_fit ?? 0;
  const styleFit = breakdown.learning_style_fit ?? 0;

  const points: string[] = [];

  if (skillGap >= 0.7) {
    points.push('it directly addresses your high-priority skill gaps');
  } else if (skillGap >= 0.4) {
    points.push('it targets your target role skill requirements');
  }

  if (prereqFit >= 0.8) {
    points.push('you possess strong foundational prerequisites for it');
  } else if (prereqFit >= 0.4) {
    points.push('it satisfies your current prerequisite skill level');
  } else {
    points.push('it builds essential prerequisite foundation');
  }

  if (semanticFit >= 0.7) {
    points.push('it demonstrates high semantic relevance to your goal');
  }

  if (difficultyFit >= 0.7) {
    points.push('the difficulty level matches your estimated capability');
  }

  if (timeFit >= 0.7) {
    points.push('the duration fits within your weekly time budget');
  }

  if (styleFit >= 0.7) {
    points.push('it aligns with your preferred learning format');
  }

  if (points.length === 0) {
    return 'Recommended based on overall hybrid scoring across skill gap, prerequisite fit, and target goal alignment.';
  }

  if (points.length === 1) {
    return `Recommended because ${points[0]}.`;
  }
  if (points.length === 2) {
    return `Recommended because ${points[0]} and ${points[1]}.`;
  }
  return `Recommended because ${points.slice(0, -1).join(', ')}, and ${points[points.length - 1]}.`;
};

export const DecisionTraceCard: React.FC<DecisionTraceCardProps> = ({
  resourceTitle,
  score,
  scoreBreakdown,
  reason,
  traceExplanation,
  isFallback = false,
  className = '',
}) => {
  const summaryText =
    traceExplanation || getDeterministicTraceSummary(scoreBreakdown, reason);

  // Field mapping with human-readable labels
  const fieldMappings: Array<{
    key: string;
    label: string;
    value: number | undefined;
  }> = [];

  if (scoreBreakdown) {
    if (scoreBreakdown.skill_gap_match !== undefined) {
      fieldMappings.push({
        key: 'skill_gap_match',
        label: 'Skill Gap Match',
        value: scoreBreakdown.skill_gap_match,
      });
    }
    if (scoreBreakdown.prerequisite_fit !== undefined) {
      fieldMappings.push({
        key: 'prerequisite_fit',
        label: 'Prerequisite Fit',
        value: scoreBreakdown.prerequisite_fit,
      });
    }
    const sem =
      scoreBreakdown.retrievalSimilarity !== undefined
        ? scoreBreakdown.retrievalSimilarity
        : scoreBreakdown.retrieval_similarity;
    if (sem !== undefined) {
      fieldMappings.push({
        key: 'semantic_similarity',
        label: 'Semantic Relevance',
        value: sem,
      });
    }
    if (scoreBreakdown.difficulty_fit !== undefined) {
      fieldMappings.push({
        key: 'difficulty_fit',
        label: 'Difficulty Fit',
        value: scoreBreakdown.difficulty_fit,
      });
    }
    if (scoreBreakdown.time_fit !== undefined) {
      fieldMappings.push({
        key: 'time_fit',
        label: 'Time Budget Fit',
        value: scoreBreakdown.time_fit,
      });
    }
    if (scoreBreakdown.learning_style_fit !== undefined) {
      fieldMappings.push({
        key: 'learning_style_fit',
        label: 'Learning Style Fit',
        value: scoreBreakdown.learning_style_fit,
      });
    }
  }

  return (
    <div
      className={`p-4 bg-emerald-50/80 border border-emerald-300 rounded-lg space-y-3 font-mono text-xs ${className}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-emerald-300/60 pb-2">
        <div className="flex items-center gap-2 text-emerald-950 font-bold uppercase">
          <Sparkles className="w-4 h-4 text-emerald-700" />
          <span>Decision Trace: Why Recommended?</span>
        </div>
        {isFallback ? (
          <span className="text-[9px] uppercase tracking-wider bg-amber-100 text-amber-900 border border-amber-300 px-1.5 py-0.5 font-bold">
            Rule-Based Trace
          </span>
        ) : (
          score !== undefined && (
            <span className="text-[10px] font-bold bg-emerald-800 text-white px-2 py-0.5 rounded">
              Score: {Math.round(score * 100)} / 100
            </span>
          )
        )}
      </div>

      {/* Target Resource Title */}
      <div className="text-emerald-950">
        <span className="text-[#666] text-[10px] uppercase block">Selected Module:</span>
        <strong className="font-serif font-bold text-sm text-[#1A1A1A]">{resourceTitle}</strong>
      </div>

      {/* Summary Explanation */}
      <p className="text-xs font-sans text-emerald-950 bg-white p-3 rounded border border-emerald-200 leading-relaxed">
        {summaryText}
      </p>

      {/* Score Breakdown Metrics Grid */}
      {fieldMappings.length > 0 && (
        <div className="space-y-1.5 pt-1">
          <div className="text-[10px] uppercase text-emerald-900 font-bold flex items-center gap-1">
            <span className="flex items-center gap-1" title="Normalized 0-100% component weights">
              Score Component Breakdown: <HelpCircle className="w-2.5 h-2.5 text-emerald-700" />
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-[11px]">
            {fieldMappings.map((item) => {
              const val = item.value ?? 0;
              const pct = Math.round(val * 100);
              return (
                <div
                  key={item.key}
                  className="flex justify-between items-center bg-white px-2.5 py-1.5 rounded border border-emerald-200"
                >
                  <span className="text-emerald-900 font-medium">{item.label}:</span>
                  <div className="flex items-center gap-1.5">
                    <div
                      className="w-12 h-2 bg-emerald-100 rounded-full overflow-hidden flex"
                      role="progressbar"
                      aria-label={`${item.label} score`}
                      aria-valuenow={pct}
                      aria-valuemin={0}
                      aria-valuemax={100}
                    >
                      <div
                        className="h-full bg-emerald-600 rounded-full"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="font-bold text-emerald-950 min-w-[28px] text-right">{pct}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default DecisionTraceCard;
