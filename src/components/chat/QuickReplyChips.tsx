import React from 'react';

export interface QuickReplyChipsProps {
  options: string[];
  onSelect: (value: string) => void;
}

export const QuickReplyChips: React.FC<QuickReplyChipsProps> = ({ options, onSelect }) => {
  if (!options || options.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-3 my-4 justify-start animate-in fade-in slide-in-from-bottom-4 duration-500 delay-100 fill-mode-both pl-11">
      {options.map((option, idx) => (
        <button
          key={idx}
          onClick={() => onSelect(option)}
          type="button"
          className="group relative px-5 py-2.5 text-sm font-medium rounded-full bg-white/50 dark:bg-zinc-800/50 backdrop-blur-sm text-indigo-700 dark:text-indigo-300 border border-indigo-200/50 dark:border-indigo-500/30 hover:bg-gradient-to-r hover:from-indigo-600 hover:to-purple-600 hover:border-transparent hover:text-white dark:hover:from-indigo-600 dark:hover:to-purple-600 transition-all duration-300 shadow-sm hover:shadow-lg hover:shadow-indigo-500/25 active:scale-95 overflow-hidden"
        >
          {/* Subtle glow effect behind text on hover */}
          <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
          <span className="relative z-10">{option}</span>
        </button>
      ))}
    </div>
  );
};

export default QuickReplyChips;
