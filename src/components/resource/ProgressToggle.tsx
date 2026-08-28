import React, { useState } from 'react';
import { Check, AlertTriangle, SkipForward } from 'lucide-react';

export interface ProgressToggleProps {
  resourceId: string;
  userId?: string;
  onUpdate?: (response: any) => void;
}

export const ProgressToggle: React.FC<ProgressToggleProps> = ({
  resourceId,
  userId = 'demo-user-id',
  onUpdate,
}) => {
  const [loadingEvent, setLoadingEvent] = useState<string | null>(null);

  const handleAction = async (eventType: 'completed' | 'too_hard' | 'skipped') => {
    setLoadingEvent(eventType);
    try {
      const res = await fetch('/api/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          resourceId,
          eventType,
        }),
      });

      const data = await res.json();
      if (onUpdate) {
        onUpdate(data);
      }
    } catch (err) {
      console.error('Error posting progress event:', err);
    } finally {
      setLoadingEvent(null);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2 pt-2">
      <button
        onClick={() => handleAction('completed')}
        disabled={loadingEvent !== null}
        className="px-3.5 py-1.5 text-xs font-semibold rounded-xl bg-emerald-50 hover:bg-emerald-600 text-emerald-700 hover:text-white dark:bg-emerald-950/60 dark:text-emerald-300 dark:hover:bg-emerald-600 dark:hover:text-white border border-emerald-200 dark:border-emerald-800 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
      >
        <Check className="w-3.5 h-3.5" />
        <span>{loadingEvent === 'completed' ? 'Saving...' : 'Mark Complete'}</span>
      </button>

      <button
        onClick={() => handleAction('too_hard')}
        disabled={loadingEvent !== null}
        className="px-3.5 py-1.5 text-xs font-semibold rounded-xl bg-amber-50 hover:bg-amber-600 text-amber-700 hover:text-white dark:bg-amber-950/60 dark:text-amber-300 dark:hover:bg-amber-600 dark:hover:text-white border border-amber-200 dark:border-amber-800 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
      >
        <AlertTriangle className="w-3.5 h-3.5" />
        <span>{loadingEvent === 'too_hard' ? 'Evaluating...' : 'Too Hard'}</span>
      </button>

      <button
        onClick={() => handleAction('skipped')}
        disabled={loadingEvent !== null}
        className="px-3.5 py-1.5 text-xs font-semibold rounded-xl bg-zinc-100 hover:bg-zinc-700 text-zinc-700 hover:text-white dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
      >
        <SkipForward className="w-3.5 h-3.5" />
        <span>{loadingEvent === 'skipped' ? 'Saving...' : 'Skipped'}</span>
      </button>
    </div>
  );
};

export default ProgressToggle;
