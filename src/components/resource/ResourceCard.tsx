import React from 'react';
import { BookOpen, Code, Award, FileText, CheckCircle2, Clock } from 'lucide-react';

export interface ResourceCardProps {
  title: string;
  type: string; // course, project, assessment, article
  difficulty: number; // 1-5
  reason?: string;
  status?: string; // pending, started, completed, skipped
}

export const ResourceCard: React.FC<ResourceCardProps> = ({
  title,
  type,
  difficulty,
  reason,
  status = 'pending',
}) => {
  const getTypeBadge = (resourceType: string) => {
    const t = resourceType?.toLowerCase() || 'course';
    switch (t) {
      case 'project':
        return {
          label: 'Project',
          icon: <Code className="w-3.5 h-3.5" />,
          style: 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
        };
      case 'assessment':
        return {
          label: 'Assessment',
          icon: <Award className="w-3.5 h-3.5" />,
          style: 'bg-purple-100 dark:bg-purple-950/80 text-purple-800 dark:text-purple-200 border-purple-300 dark:border-purple-700 font-bold',
        };
      case 'article':
        return {
          label: 'Article',
          icon: <FileText className="w-3.5 h-3.5" />,
          style: 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800',
        };
      default:
        return {
          label: 'Course',
          icon: <BookOpen className="w-3.5 h-3.5" />,
          style: 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800',
        };
    }
  };

  const badge = getTypeBadge(type);
  const isAssessment = type?.toLowerCase() === 'assessment';

  return (
    <div className={`p-5 rounded-2xl bg-white dark:bg-zinc-900 border shadow-xs hover:shadow-md transition-all space-y-3 ${
      isAssessment ? 'border-purple-300 dark:border-purple-800/80 ring-1 ring-purple-500/10' : 'border-zinc-200/80 dark:border-zinc-800'
    }`}>
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 leading-snug">
            {title}
          </h3>
          {isAssessment && (
            <span className="inline-block text-[10px] font-mono text-purple-700 dark:text-purple-300 uppercase tracking-wider">
              Skill Evaluation & Benchmarking
            </span>
          )}
        </div>
        <span
          className={`inline-flex items-center gap-1 px-2.5 py-0.5 text-xs font-semibold rounded-full border ${badge.style}`}
        >
          {badge.icon}
          {badge.label}
        </span>
      </div>

      {reason && (
        <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed bg-zinc-50 dark:bg-zinc-800/60 p-2.5 rounded-xl border border-zinc-100 dark:border-zinc-800">
          {reason}
        </p>
      )}

      <div className="flex items-center justify-between pt-1 border-t border-zinc-100 dark:border-zinc-800/80">
        {/* Difficulty 1-5 Dots Indicator */}
        <div className="flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400">
          <span className="font-medium">Difficulty:</span>
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((dot) => (
              <span
                key={dot}
                className={`w-2 h-2 rounded-full transition-all ${
                  dot <= difficulty
                    ? 'bg-indigo-600 dark:bg-indigo-400 shadow-2xs'
                    : 'bg-zinc-200 dark:bg-zinc-700'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Status Badge */}
        <span className="text-xs font-medium capitalize flex items-center gap-1">
          {status === 'completed' || status === 'mastered' ? (
            <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-semibold">
              <CheckCircle2 className="w-3.5 h-3.5" /> Completed
            </span>
          ) : status === 'too_hard' || status === 'too-hard' ? (
            <span className="text-rose-600 dark:text-rose-400 flex items-center gap-1 font-semibold">
              Too Hard
            </span>
          ) : (
            <span className="text-zinc-500 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" /> {status}
            </span>
          )}
        </span>
      </div>
    </div>
  );
};

export default ResourceCard;
