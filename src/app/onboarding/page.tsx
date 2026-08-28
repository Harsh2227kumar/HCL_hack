"use client";

import React, { useState, useEffect, useRef } from "react";
import ChatBubble from "@/components/chat/ChatBubble";
import QuickReplyChips from "@/components/chat/QuickReplyChips";
import ChatInput from "@/components/chat/ChatInput";
import { Sparkles, CheckCircle2, ArrowRight } from "lucide-react";

export interface Message {
  role: "user" | "ai";
  text: string;
  quick_replies?: string[];
}

export default function OnboardingPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "ai",
      text: "Hello! Welcome to your Adaptive Learning Intelligence Engine. What are you trying to achieve? (e.g. 'I want to master Full Stack Web Development')",
    },
  ]);
  const [loading, setLoading] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [extractedProfile, setExtractedProfile] = useState<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSendMessage = async (userText: string) => {
    if (!userText || loading || isCompleted) return;

    const userMsg: Message = { role: "user", text: userText };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: updatedMessages }),
      });

      const data = await res.json();

      if (data.message) {
        const conversationWithAi = [...updatedMessages, data.message];
        setMessages(conversationWithAi);

        if (data.done) {
          // Trigger profile extraction
          const extractRes = await fetch("/api/profile/extract", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ messages: conversationWithAi }),
          });
          const extractData = await extractRes.json();

          if (extractData.profile) {
            setExtractedProfile(extractData.profile);
          }
          setIsCompleted(true);
        }
      }
    } catch (err) {
      console.error("Error sending onboarding message:", err);
    } finally {
      setLoading(false);
    }
  };

  const userAnswersCount = messages.filter((m) => m.role === "user").length;
  const TOTAL_QUESTIONS = 4;
  const currentQuestionNumber = Math.min(userAnswersCount + 1, TOTAL_QUESTIONS);
  const progressPercentage = isCompleted
    ? 100
    : Math.min((userAnswersCount / TOTAL_QUESTIONS) * 100, 100);

  const lastMessage = messages[messages.length - 1];
  const showQuickReplies =
    !loading &&
    !isCompleted &&
    lastMessage?.role === "ai" &&
    lastMessage.quick_replies &&
    lastMessage.quick_replies.length > 0;

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-100 via-indigo-50/40 to-slate-100 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950 text-zinc-900 dark:text-zinc-100 flex flex-col items-center justify-center p-3 sm:p-6 md:p-8">
      <div className="w-full max-w-2xl bg-gradient-to-br from-indigo-50/80 via-white to-purple-50/50 dark:from-zinc-900/90 dark:via-zinc-900/95 dark:to-zinc-900/90 border border-indigo-100/80 dark:border-zinc-800 rounded-3xl shadow-xl shadow-indigo-500/5 flex flex-col h-[88vh] max-h-[850px] overflow-hidden backdrop-blur-sm">
        
        {/* Header with Gradient Icon & Dynamic Progress Indicator */}
        <header className="px-6 py-4 border-b border-indigo-100/60 dark:border-zinc-800/80 bg-white/70 dark:bg-zinc-900/70 backdrop-blur-md flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-500 text-white flex items-center justify-center shadow-md shadow-indigo-500/20 flex-shrink-0">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-base font-bold tracking-tight bg-gradient-to-r from-zinc-900 to-zinc-700 dark:from-zinc-100 dark:to-zinc-300 bg-clip-text text-transparent">
                  Adaptive Onboarding
                </h1>
                <p className="text-xs font-medium text-indigo-600 dark:text-indigo-400">
                  {isCompleted
                    ? "Onboarding Completed"
                    : `Question ${currentQuestionNumber} of ${TOTAL_QUESTIONS}`}
                </p>
              </div>
            </div>

            {isCompleted ? (
              <span className="inline-flex items-center gap-1.5 px-3.5 py-1 text-xs font-semibold text-emerald-700 bg-emerald-50 dark:text-emerald-300 dark:bg-emerald-950/70 rounded-full border border-emerald-200/80 dark:border-emerald-800/60 shadow-2xs">
                <CheckCircle2 className="w-3.5 h-3.5" /> Complete
              </span>
            ) : (
              <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 font-mono">
                {Math.round(progressPercentage)}%
              </span>
            )}
          </div>

          {/* Thin Progress Bar */}
          <div className="w-full h-1.5 bg-indigo-100/80 dark:bg-zinc-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-600 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </header>

        {/* Chat Messages Area */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-3">
          {messages.map((msg, index) => (
            <ChatBubble key={index} role={msg.role} text={msg.text} />
          ))}

          {loading && <ChatBubble role="ai" text="" isTyping={true} />}

          {isCompleted && (
            <div className="my-6 p-6 rounded-3xl bg-gradient-to-br from-emerald-50 to-teal-50/60 dark:from-emerald-950/40 dark:to-teal-950/20 border border-emerald-200/80 dark:border-emerald-800/60 text-emerald-950 dark:text-emerald-100 shadow-md shadow-emerald-500/5 animate-in fade-in slide-in-from-bottom-3 duration-500">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-500 text-white flex items-center justify-center shadow-sm shadow-emerald-500/20">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base tracking-tight">Profile Created!</h3>
                  <p className="text-xs text-emerald-700 dark:text-emerald-300">Your preferences have been saved</p>
                </div>
              </div>
              <p className="text-xs leading-relaxed text-emerald-800 dark:text-emerald-300 mb-4">
                Your goals and constraints have been transformed into a structured learner model. Your adaptive roadmap is ready to be generated.
              </p>
              {extractedProfile && (
                <div className="bg-white/80 dark:bg-zinc-900/80 p-4 rounded-2xl border border-emerald-200/60 dark:border-emerald-800/40 text-xs space-y-2 font-mono mb-5 shadow-2xs">
                  <div className="flex justify-between border-b border-emerald-100 dark:border-emerald-900/50 pb-1">
                    <span className="text-zinc-500 dark:text-zinc-400">Target Goal</span>
                    <span className="font-semibold text-zinc-900 dark:text-zinc-100">{extractedProfile.goal}</span>
                  </div>
                  <div className="flex justify-between border-b border-emerald-100 dark:border-emerald-900/50 pb-1">
                    <span className="text-zinc-500 dark:text-zinc-400">Weekly Commitment</span>
                    <span className="font-semibold text-zinc-900 dark:text-zinc-100">{extractedProfile.weeklyHours} hrs/week</span>
                  </div>
                  <div className="flex justify-between border-b border-emerald-100 dark:border-emerald-900/50 pb-1">
                    <span className="text-zinc-500 dark:text-zinc-400">Learning Style</span>
                    <span className="font-semibold text-zinc-900 dark:text-zinc-100">{extractedProfile.learningStyle}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500 dark:text-zinc-400">Experience Level</span>
                    <span className="font-semibold text-zinc-900 dark:text-zinc-100">{extractedProfile.experienceLevel}</span>
                  </div>
                </div>
              )}
              <a
                href="/dashboard"
                className="inline-flex items-center justify-center gap-2.5 px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-2xl font-semibold text-xs transition-all shadow-md shadow-emerald-500/20 cursor-pointer active:scale-95"
              >
                <span>Generate Adaptive Path</span>
                <ArrowRight className="w-4 h-4" />
              </a>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input / Quick Replies Footer */}
        {!isCompleted && (
          <footer className="p-4 sm:p-5 border-t border-indigo-100/60 dark:border-zinc-800/80 bg-white/60 dark:bg-zinc-900/60 backdrop-blur-sm">
            {showQuickReplies ? (
              <QuickReplyChips
                options={lastMessage.quick_replies!}
                onSelect={handleSendMessage}
              />
            ) : (
              <ChatInput onSend={handleSendMessage} disabled={loading} />
            )}
          </footer>
        )}
      </div>
    </main>
  );
}
