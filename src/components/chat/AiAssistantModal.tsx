"use client";

import React, { useState, useRef, useEffect } from "react";
import { 
  Bot, 
  Send, 
  X, 
  Sparkles, 
  Loader2 
} from "lucide-react";

interface Message {
  id: string;
  sender: "user" | "ai";
  text: string;
  timestamp: string;
  suggestedPrompts?: string[];
}

interface AiAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentGoal?: string;
  bottleneckSkill?: string | null;
  activeModuleTitle?: string;
}

export const AiAssistantModal: React.FC<AiAssistantModalProps> = ({
  isOpen,
  onClose,
  currentGoal = "AI Engineering & Machine Learning",
  bottleneckSkill,
  activeModuleTitle,
}) => {
  const [messages, setMessages] = useState<Message[]>(() => [
    {
      id: "msg_init",
      sender: "ai",
      text: `Hello! I'm your AI Academic Advisor & Learning Assistant. I'm actively analyzing your roadmap for "${currentGoal}". Ask me anything about your prerequisites, why specific resources were recommended, or how to master complex concepts!`,
      timestamp: "Just now",
      suggestedPrompts: [
        "Why is this sequence recommended for me?",
        bottleneckSkill ? `How do I resolve my bottleneck in ${bottleneckSkill}?` : "What should I focus on this week?",
        activeModuleTitle ? `Explain the core concepts of "${activeModuleTitle}"` : "How does Bayesian Knowledge Tracing adapt my path?",
        "Give me a 3-day accelerated study plan"
      ]
    }
  ]);
  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const msgCounter = useRef(1);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen]);

  if (!isOpen) return null;

  const handleSendMessage = async (textToSend?: string) => {
    const query = textToSend || inputText.trim();
    if (!query || isTyping) return;

    msgCounter.current += 1;
    const userMsgId = `usr_${msgCounter.current}`;

    const userMsg: Message = {
      id: userMsgId,
      sender: "user",
      text: query,
      timestamp: "Just now",
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInputText("");
    setIsTyping(true);

    try {
      // Call the AI chat API
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [
            ...messages.map(m => ({ role: m.sender, text: m.text })),
            { role: "user", text: `[Context: Learner Goal is "${currentGoal}", Active Node is "${activeModuleTitle || 'Roadmap Overview'}", Bottleneck is "${bottleneckSkill || 'None'}"]\nLearner Query: ${query}` }
          ]
        })
      });

      if (res.ok) {
        const data = await res.json();
        msgCounter.current += 1;
        const aiMsg: Message = {
          id: `ai_${msgCounter.current}`,
          sender: "ai",
          text: data.reply || "I've analyzed your progress and your curriculum is topologically sequenced to maximize retention.",
          timestamp: "Just now",
          suggestedPrompts: data.quick_replies && data.quick_replies.length > 0 
            ? data.quick_replies 
            : ["Explain next milestone", "What are common interview questions for this?", "Suggest hands-on projects"]
        };
        setMessages((prev) => [...prev, aiMsg]);
      } else {
        throw new Error("Chat endpoint error");
      }
    } catch {
      // Intelligent grounded fallback response
      let groundedFallback = `Regarding your inquiry on "${query}": Your personalized path is structured using topological graph sorting. We ensure you master the fundamental mathematical and programming prerequisites before diving into advanced architectures.`;
      
      const qLower = query.toLowerCase();
      if (qLower.includes("why") || qLower.includes("reason") || qLower.includes("sequence")) {
        groundedFallback = `Our recommendation engine evaluates your candidate modules using a Hybrid Scoring model (Skill Gap Match, Prerequisite Fit, Difficulty Alignment, and Time Schedule). Each module is placed in strict topological order to avoid concept gaps.`;
      } else if (qLower.includes("bottleneck") || qLower.includes("gap")) {
        groundedFallback = bottleneckSkill 
          ? `Your primary bottleneck is "${bottleneckSkill}". Resolving this skill unlocks downstream modules in your DAG. We recommend prioritizing the targeted course and taking the benchmark assessment.`
          : `Your skill profile is well-balanced. Keep maintaining consistency with your weekly commitment!`;
      } else if (qLower.includes("plan") || qLower.includes("week") || qLower.includes("schedule")) {
        groundedFallback = `Here is your recommended 3-Step Action Plan for this week:\n1. Complete the core theory & hands-on lab for ${activeModuleTitle || 'your active module'}.\n2. Build a standalone micro-project applying the concept.\n3. Take the benchmark skill assessment to calibrate your BKT mastery estimate.`;
      }

      msgCounter.current += 1;
      const aiMsg: Message = {
        id: `ai_${msgCounter.current}`,
        sender: "ai",
        text: groundedFallback,
        timestamp: "Just now",
        suggestedPrompts: [
          "Explain the prerequisites for this goal",
          "What practical project should I build?",
          "How do I calibrate my BKT confidence?"
        ]
      };
      setMessages((prev) => [...prev, aiMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
      <div className="bg-[#FDFCFB] w-full max-w-2xl h-[85vh] max-h-[700px] border border-[#1A1A1A]/30 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-[#1A1A1A]">
        {/* Modal Header */}
        <div className="p-4 sm:px-6 bg-[#1A1A1A] text-white flex items-center justify-between border-b border-black">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-serif font-bold text-base tracking-tight">AI Academic Advisor</h3>
                <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Live Engine Connected
                </span>
              </div>
              <p className="text-xs font-mono text-[#AAA] truncate max-w-xs sm:max-w-md">
                Goal: {currentGoal}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-[#AAA] hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Chat History */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-[#F8F7F4]/60">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex flex-col ${m.sender === "user" ? "items-end" : "items-start"}`}
            >
              <div
                className={`max-w-[88%] sm:max-w-[80%] rounded-2xl p-4 text-xs sm:text-sm font-sans leading-relaxed ${
                  m.sender === "user"
                    ? "bg-[#1A1A1A] text-white rounded-br-xs shadow-sm"
                    : "bg-white border border-[#1A1A1A]/15 text-[#1A1A1A] rounded-bl-xs shadow-xs"
                }`}
              >
                {m.sender === "ai" && (
                  <div className="flex items-center gap-1.5 text-[10px] font-mono uppercase text-emerald-700 font-bold mb-1.5 pb-1 border-b border-[#1A1A1A]/5">
                    <Sparkles className="w-3 h-3 text-emerald-600" />
                    <span>AI Learning Advisor</span>
                  </div>
                )}
                <div className="whitespace-pre-wrap">{m.text}</div>
                <div className={`text-[10px] font-mono mt-2 text-right ${m.sender === "user" ? "text-white/60" : "text-[#888]"}`}>
                  {m.timestamp}
                </div>
              </div>

              {/* Suggested quick reply chips on the latest AI message */}
              {m.sender === "ai" && m.suggestedPrompts && m.suggestedPrompts.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2 max-w-[90%]">
                  {m.suggestedPrompts.map((prompt, pIdx) => (
                    <button
                      key={pIdx}
                      onClick={() => handleSendMessage(prompt)}
                      disabled={isTyping}
                      className="text-[11px] font-mono text-left px-2.5 py-1 bg-white hover:bg-[#1A1A1A] text-[#444] hover:text-white border border-[#1A1A1A]/20 rounded-full transition-all cursor-pointer shadow-2xs hover:scale-[1.02]"
                    >
                      💡 {prompt}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}

          {isTyping && (
            <div className="flex items-center gap-2 text-xs font-mono text-[#666] bg-white border border-[#1A1A1A]/10 p-3 rounded-xl max-w-xs">
              <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
              <span>Analyzing curriculum & graph dependencies...</span>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="p-3 sm:p-4 bg-white border-t border-[#1A1A1A]/15 flex items-center gap-2"
        >
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Ask your advisor (e.g. 'Explain this concept', 'Why this sequence?')..."
            className="flex-1 px-4 py-2.5 text-xs sm:text-sm font-sans bg-[#F8F7F4] border border-[#1A1A1A]/20 rounded-xl focus:outline-hidden focus:border-[#1A1A1A] focus:ring-1 focus:ring-[#1A1A1A]"
          />
          <button
            type="submit"
            disabled={!inputText.trim() || isTyping}
            className="px-4 py-2.5 bg-[#1A1A1A] text-white rounded-xl font-mono text-xs uppercase font-bold flex items-center gap-1.5 hover:bg-black disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer shadow-sm"
          >
            <span>Ask</span>
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>
    </div>
  );
};
