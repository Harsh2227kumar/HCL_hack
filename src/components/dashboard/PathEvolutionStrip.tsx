import React from 'react';

type PathVersion = {
  version: string;
  date: string;
  trigger: string;
};

export default function PathEvolutionStrip({ pathHistory }: { pathHistory: PathVersion[] }) {
  if (!pathHistory || pathHistory.length === 0) return null;

  return (
    <div className="bg-indigo-50 p-3 rounded-lg border border-indigo-100 mb-6 overflow-x-auto">
      <div className="flex items-center gap-2">
        <span className="text-xs font-semibold text-indigo-800 uppercase tracking-wider whitespace-nowrap">Path Evolution:</span>
        <div className="flex items-center space-x-2">
          {pathHistory.map((history, idx) => (
            <React.Fragment key={idx}>
              <div className="flex flex-col whitespace-nowrap">
                <span className="text-sm font-bold text-indigo-900">{history.version}</span>
                <span className="text-xs text-indigo-600" title={history.trigger}>{history.date}</span>
              </div>
              {idx < pathHistory.length - 1 && (
                <svg className="w-4 h-4 text-indigo-300 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              )}
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  );
}
