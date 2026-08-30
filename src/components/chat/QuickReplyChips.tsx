export default function QuickReplyChips({ 
  options, 
  onSelect 
}: { 
  options: string[]; 
  onSelect: (option: string) => void;
}) {
  if (!options || options.length === 0) return null;
  
  return (
    <div className="flex overflow-x-auto gap-2 pb-2 scrollbar-hide">
      {options.map((option, i) => (
        <button
          key={i}
          onClick={() => onSelect(option)}
          className="whitespace-nowrap px-4 py-1.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-sm rounded-full transition-colors border border-zinc-200"
        >
          {option}
        </button>
      ))}
    </div>
  );
}
