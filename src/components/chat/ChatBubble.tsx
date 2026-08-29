"use client";

import React, { useState } from 'react';
import { Bot, User, BrainCircuit, ChevronDown, ChevronUp } from 'lucide-react';

export interface ChatBubbleProps {
  role: 'user' | 'ai';
  text: string;
  thought?: string;
  isTyping?: boolean;
}

export const ChatBubble: React.FC<ChatBubbleProps> = ({ role, text, thought, isTyping }) => {
  const isUser = role === 'user';
  const [showThought, setShowThought] = useState(false);

  return (
    <div
      className={`flex w-full my-3 animate-in fade-in slide-in-from-bottom-3 duration-300 ease-out ${
        isUser ? 'justify-end' : 'justify-start'
      }`}
    >
      {!isUser && (
        <div className="w-8 h-8 rounded-lg bg-[#1A1A1A] border border-[#1A1A1A] flex items-center justify-center mr-3 shadow-xs flex-shrink-0 mt-1">
          <Bot className="w-4 h-4 text-emerald-400" />
        </div>
      )}

      <div className="max-w-[88%] sm:max-w-[80%] space-y-2">
        {/* Collapsible AI Mental Model / Reasoning Badge */}
        {!isUser && thought && !isTyping && (
          <div className="text-[11px] font-mono">
            <button
              type="button"
              onClick={() => setShowThought(!showThought)}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-50 border border-amber-300 text-amber-900 hover:bg-amber-100 transition-all cursor-pointer font-medium"
            >
              <BrainCircuit className="w-3 h-3 text-amber-700" />
              <span>AI Advisor Reasoning</span>
              {showThought ? (
                <ChevronUp className="w-3 h-3 text-amber-700" />
              ) : (
                <ChevronDown className="w-3 h-3 text-amber-700" />
              )}
            </button>
            {showThought && (
              <div className="mt-1.5 p-2.5 rounded-lg bg-amber-50/70 border border-amber-200 text-amber-950 text-[11px] leading-relaxed animate-in fade-in duration-200 shadow-2xs">
                <span className="font-bold uppercase tracking-wider text-[9px] text-amber-800 block mb-0.5">
                  Internal Mental State:
                </span>
                {thought}
              </div>
            )}
          </div>
        )}

        <div
          className={`relative px-5 py-3.5 text-sm leading-relaxed transition-all ${
            isUser
              ? 'bg-[#1A1A1A] text-white rounded-2xl rounded-tr-xs font-medium shadow-xs'
              : 'bg-white text-[#1A1A1A] border border-[#1A1A1A]/30 rounded-2xl rounded-tl-xs shadow-xs'
          }`}
        >
          {isTyping ? (
            <div className="flex items-center gap-1.5 py-1 px-1">
              <span className="w-2 h-2 rounded-full bg-[#1A1A1A] animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-2 h-2 rounded-full bg-[#1A1A1A] animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-2 h-2 rounded-full bg-[#1A1A1A] animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          ) : (
            <div className="whitespace-pre-wrap">{text}</div>
          )}
        </div>
      </div>

      {isUser && (
        <div className="w-8 h-8 rounded-lg bg-white border border-[#1A1A1A]/30 flex items-center justify-center ml-3 shadow-xs flex-shrink-0 mt-1">
          <User className="w-4 h-4 text-[#1A1A1A]" />
        </div>
      )}
    </div>
  );
};

export default ChatBubble;
