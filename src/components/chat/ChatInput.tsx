import React, { useState } from 'react';
import { Send } from 'lucide-react';

export interface ChatInputProps {
  onSend: (text: string) => void;
  disabled?: boolean;
}

export const ChatInput: React.FC<ChatInputProps> = ({ onSend, disabled }) => {
  const [text, setText] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = text.trim();
    if (trimmed) {
      onSend(trimmed);
      setText('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2.5 w-full pt-1">
      <input
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        disabled={disabled}
        placeholder="Type your answer..."
        className="flex-1 px-4.5 py-3 text-sm rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-white/90 dark:bg-zinc-800/90 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/80 focus:border-indigo-500 disabled:opacity-50 transition-all shadow-2xs"
      />
      <button
        type="submit"
        disabled={disabled || !text.trim()}
        className="px-4.5 py-3 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-medium text-sm flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-md shadow-indigo-500/20 cursor-pointer active:scale-95"
      >
        <span>Send</span>
        <Send className="w-4 h-4" />
      </button>
    </form>
  );
};

export default ChatInput;
