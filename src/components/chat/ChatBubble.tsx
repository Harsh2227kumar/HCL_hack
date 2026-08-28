import React from 'react';

export interface ChatBubbleProps {
  role: 'user' | 'ai';
  text: string;
  isTyping?: boolean;
}

export const ChatBubble: React.FC<ChatBubbleProps> = ({ role, text, isTyping }) => {
  const isUser = role === 'user';

  return (
    <div
      className={`flex w-full my-2 animate-in fade-in slide-in-from-bottom-3 duration-300 ${
        isUser ? 'justify-end' : 'justify-start'
      }`}
    >
      <div
        className={`px-4.5 py-3.5 text-sm leading-relaxed rounded-2xl max-w-[80%] sm:max-w-[75%] transition-all ${
          isUser
            ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-500/15 rounded-br-xs font-medium'
            : 'bg-white dark:bg-zinc-800/90 text-zinc-900 dark:text-zinc-100 border border-zinc-200/80 dark:border-zinc-700/60 shadow-xs rounded-bl-xs'
        }`}
      >
        {isTyping ? (
          <div className="flex items-center gap-1.5 py-1 px-1">
            <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
            <span className="w-2 h-2 rounded-full bg-purple-500 animate-pulse [animation-delay:200ms]" />
            <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse [animation-delay:400ms]" />
          </div>
        ) : (
          text
        )}
      </div>
    </div>
  );
};

export default ChatBubble;
