import React from 'react';

export interface QuickReplyChipsProps {
  options: string[];
  onSelect: (value: string) => void;
}

export const QuickReplyChips: React.FC<QuickReplyChipsProps> = ({ options, onSelect }) => {
  if (!options || options.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2.5 my-3 justify-start animate-in fade-in slide-in-from-bottom-2 duration-300">
      {options.map((option, idx) => (
        <button
          key={idx}
          onClick={() => onSelect(option)}
          type="button"
          className="px-4 py-2 text-xs font-medium rounded-full bg-indigo-50/80 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200/80 dark:border-indigo-800/60 hover:bg-gradient-to-r hover:from-indigo-600 hover:to-purple-600 hover:text-white dark:hover:from-indigo-600 dark:hover:to-purple-600 dark:hover:text-white transition-all duration-200 cursor-pointer shadow-2xs active:scale-95"
        >
          {option}
        </button>
      ))}
    </div>
  );
};

export default QuickReplyChips;
