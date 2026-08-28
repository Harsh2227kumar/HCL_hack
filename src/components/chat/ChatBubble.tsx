import React from 'react';
import { Bot, User } from 'lucide-react';

export interface ChatBubbleProps {
  role: 'user' | 'ai';
  text: string;
  isTyping?: boolean;
}

export const ChatBubble: React.FC<ChatBubbleProps> = ({ role, text, isTyping }) => {
  const isUser = role === 'user';

  return (
    <div
      className={`flex w-full my-3 animate-in fade-in slide-in-from-bottom-4 duration-500 ease-out ${
        isUser ? 'justify-end' : 'justify-start'
      }`}
    >
      {!isUser && (
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center mr-3 shadow-md shadow-indigo-500/30 flex-shrink-0 mt-auto mb-1">
          <Bot className="w-4 h-4 text-white" />
        </div>
      )}
      
      <div
        className={`relative px-5 py-3.5 text-sm leading-relaxed max-w-[85%] sm:max-w-[75%] transition-all ${
          isUser
            ? 'bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-700 text-white shadow-lg shadow-indigo-500/25 rounded-2xl rounded-br-sm font-medium'
            : 'bg-white/70 dark:bg-zinc-800/60 backdrop-blur-md text-zinc-800 dark:text-zinc-100 border border-white/40 dark:border-zinc-700/50 shadow-xl shadow-black/5 rounded-2xl rounded-bl-sm'
        }`}
      >
        {isTyping ? (
          <div className="flex items-center gap-1.5 py-1.5 px-2">
            <span className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce" style={{ animationDelay: '0ms' }} />
            <span className="w-2 h-2 rounded-full bg-purple-500 animate-bounce" style={{ animationDelay: '150ms' }} />
            <span className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
        ) : (
          text
        )}
      </div>

      {isUser && (
        <div className="w-8 h-8 rounded-full bg-zinc-900 dark:bg-white flex items-center justify-center ml-3 shadow-md shadow-black/20 flex-shrink-0 mt-auto mb-1">
          <User className="w-4 h-4 text-white dark:text-zinc-900" />
        </div>
      )}
    </div>
  );
};

export default ChatBubble;
