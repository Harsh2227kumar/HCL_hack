import React, { useState, useEffect } from 'react';
import { X, Info, Sparkles } from 'lucide-react';

export interface DecisionTraceModalProps {
  isOpen: boolean;
  onClose: () => void;
  resourceId: string;
}

export const DecisionTraceModal: React.FC<DecisionTraceModalProps> = ({
  isOpen,
  onClose,
  resourceId,
}) => {
  const [traceData, setTraceData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (isOpen && resourceId) {
      setLoading(true);
      setError(false);

      fetch('/api/explain/trace', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resourceId }),
      })
        .then((res) => {
          if (!res.ok) throw new Error('Trace unavailable');
          return res.json();
        })
        .then((data) => {
          setTraceData(data);
        })
        .catch(() => {
          setError(true);
          setTraceData(null);
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [isOpen, resourceId]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-zinc-50/50 dark:bg-zinc-900/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
              <Sparkles className="w-4 h-4" />
            </div>
            <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
              Recommendation Decision Trace
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-4 text-xs">
          {loading ? (
            <div className="flex items-center justify-center py-8 gap-2 text-zinc-400">
              <div className="w-2 h-2 rounded-full bg-indigo-600 animate-ping" />
              <span>Fetching decision trace...</span>
            </div>
          ) : error || !traceData ? (
            <div className="my-4 p-5 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/40 text-center space-y-2">
              <Info className="w-6 h-6 text-indigo-500 mx-auto" />
              <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">
                Trace not available yet
              </h3>
              <p className="text-zinc-500 dark:text-zinc-400 text-xs">
                The detailed decision trace for resource <code className="font-mono text-indigo-600 dark:text-indigo-400">{resourceId}</code> will be available once recommendation scoring finishes.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-zinc-600 dark:text-zinc-300">
                Detailed decision breakdown for <strong className="font-mono">{resourceId}</strong>:
              </p>
              <pre className="p-4 rounded-2xl bg-zinc-900 text-zinc-100 font-mono text-[11px] overflow-x-auto leading-relaxed border border-zinc-800">
                {JSON.stringify(traceData, null, 2)}
              </pre>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-zinc-200 dark:border-zinc-800 flex justify-end bg-zinc-50/50 dark:bg-zinc-900/50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold rounded-xl bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200 transition-all cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default DecisionTraceModal;
