"use client";

import { useState, useRef, useEffect } from "react";
import ChatBubble from "@/components/chat/ChatBubble";
import ChatInput from "@/components/chat/ChatInput";
import QuickReplyChips from "@/components/chat/QuickReplyChips";
import { Sparkles, CheckCircle2, ArrowRight, Bot, Zap } from "lucide-react";

type MessageRole = "user" | "ai";

interface ChatMessage {
  role: MessageRole;
  text: string;
  quick_replies?: string[];
}

export default function OnboardingPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [extractedProfile, setExtractedProfile] = useState<any>(null);
  const [provider, setProvider] = useState<string>("gemini");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  useEffect(() => {
    // Initial dynamic greeting from the AI Advisor
    const initChat = async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: [] }),
        });
        const data = await res.json();

        if (data.reply) {
          setMessages([
            {
              role: "ai",
              text: data.reply,
              quick_replies: data.quick_replies || [
                "Full Stack Web Development",
                "Machine Learning & AI Engineering",
                "Backend & Cloud Architecture",
                "Data Science & Analytics",
              ],
            },
          ]);
          if (data.provider) setProvider(data.provider);
        } else {
          throw new Error("Invalid response");
        }
      } catch (err) {
        setMessages([
          {
            role: "ai",
            text: "Hey! I'm your AI Academic Advisor. What field or technology are you looking to master today?",
            quick_replies: [
              "Full Stack Web Development",
              "Machine Learning & AI Engineering",
              "Backend & Cloud Architecture",
              "Data Science & Analytics",
            ],
          },
        ]);
      } finally {
        setLoading(false);
      }
    };
    initChat();
  }, []);

  const triggerProfileExtraction = async (conversation: ChatMessage[]) => {
    try {
      const extractRes = await fetch("/api/profile/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: conversation }),
      });
      const extractData = await extractRes.json();

      if (extractData.profile) {
        const profileWithId = {
          ...extractData.profile,
          userId: extractData.userId,
        };
        setExtractedProfile(profileWithId);
        sessionStorage.setItem(
          "learnerProfile",
          JSON.stringify(profileWithId)
        );
        if (extractData.userId) {
          sessionStorage.setItem("userId", extractData.userId);
        }
        sessionStorage.setItem("aiProvider", extractData.provider || provider);
      }
      setIsCompleted(true);
    } catch (err) {
      console.error("Profile extraction failed:", err);
      // Fallback extraction from conversation
      const userMsgs = conversation.filter((m) => m.role === "user");
      const fallbackProfile = {
        goal: userMsgs[0]?.text || "Full Stack Engineering",
        experienceLevel: "Intermediate",
        weeklyHours: 10,
        learningStyle: "Project-based",
      };
      setExtractedProfile(fallbackProfile);
      sessionStorage.setItem(
        "learnerProfile",
        JSON.stringify(fallbackProfile)
      );
      setIsCompleted(true);
    }
  };

  const handleSendMessage = async (text: string) => {
    if (!text.trim()) return;

    const newMsg: ChatMessage = { role: "user", text };
    const conversationWithUser = [...messages, newMsg];
    setMessages(conversationWithUser);
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: conversationWithUser }),
      });
      const data = await res.json();

      if (!res.ok || !data.reply) {
        throw new Error("Chat API failed");
      }

      if (data.provider) setProvider(data.provider);

      const aiReply: ChatMessage = {
        role: "ai",
        text: data.reply,
        quick_replies: data.quick_replies,
      };

      const conversationWithAi = [...conversationWithUser, aiReply];
      setMessages(conversationWithAi);

      // If AI determined profile is ready
      if (data.is_complete) {
        await triggerProfileExtraction(conversationWithAi);
      }
    } catch (err) {
      console.warn("AI Chat API call failed, generating fallback response...");
      const userCount = conversationWithUser.filter((m) => m.role === "user").length;
      let replyText = "Awesome! What's your current experience level with this topic?";
      let quick = ["Complete Beginner", "Intermediate", "Advanced / Upskilling"];
      let complete = false;

      if (userCount >= 3) {
        replyText = "Great! I have everything needed to create your customized adaptive roadmap.";
        quick = [];
        complete = true;
      }

      const aiReply: ChatMessage = {
        role: "ai",
        text: replyText,
        quick_replies: quick,
      };
      const conversationWithAi = [...conversationWithUser, aiReply];
      setMessages(conversationWithAi);

      if (complete) {
        await triggerProfileExtraction(conversationWithAi);
      }
    } finally {
      setLoading(false);
    }
  };

  const userMessagesCount = messages.filter((m) => m.role === "user").length;
  const lastMessage = messages[messages.length - 1];
  const hasQuickReplies =
    !loading &&
    !isCompleted &&
    lastMessage?.role === "ai" &&
    lastMessage.quick_replies &&
    lastMessage.quick_replies.length > 0;

  return (
    <main className="min-h-screen relative overflow-hidden bg-zinc-50 dark:bg-zinc-950 flex flex-col items-center justify-center p-3 sm:p-6 md:p-8">
      {/* Dynamic Ambient Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-indigo-400/20 dark:bg-indigo-900/20 blur-[120px] animate-pulse"
          style={{ animationDuration: "8s" }}
        />
        <div
          className="absolute top-[60%] -right-[10%] w-[60%] h-[60%] rounded-full bg-purple-400/20 dark:bg-purple-900/20 blur-[140px] animate-pulse"
          style={{ animationDuration: "10s" }}
        />
        <div
          className="absolute top-[20%] left-[40%] w-[30%] h-[30%] rounded-full bg-emerald-400/10 dark:bg-emerald-900/10 blur-[100px] animate-pulse"
          style={{ animationDuration: "12s" }}
        />
      </div>

      <div className="relative w-full max-w-3xl bg-white/50 dark:bg-zinc-900/50 border border-white/60 dark:border-zinc-800/60 rounded-3xl shadow-2xl shadow-indigo-900/5 dark:shadow-black/50 flex flex-col h-[90vh] max-h-[850px] overflow-hidden backdrop-blur-xl ring-1 ring-black/5">
        {/* Header */}
        <header className="px-6 py-5 border-b border-white/50 dark:border-zinc-800/50 bg-white/40 dark:bg-zinc-900/40 backdrop-blur-md flex flex-col gap-4 z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-500 to-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-500/30 flex-shrink-0 relative overflow-hidden">
                <div
                  className="absolute inset-0 bg-white/20 animate-pulse"
                  style={{ animationDuration: "3s" }}
                />
                <Sparkles className="w-6 h-6 text-white relative z-10" />
              </div>
              <div>
                <h1 className="text-lg font-bold tracking-tight text-zinc-900 dark:text-white flex items-center gap-2">
                  AI Academic Advisor
                  <span className="text-[11px] font-semibold uppercase px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
                    Live LLM
                  </span>
                </h1>
                <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                  {isCompleted
                    ? "Curriculum ready to assemble"
                    : "Conversational Goal & Skill Diagnostic"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {userMessagesCount >= 2 && !isCompleted && (
                <button
                  onClick={() => triggerProfileExtraction(messages)}
                  className="text-xs font-semibold px-3 py-1.5 rounded-full bg-indigo-50 hover:bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 transition-colors flex items-center gap-1.5 shadow-sm"
                >
                  <Zap className="w-3.5 h-3.5 text-indigo-600" />
                  Ready to Build Path
                </button>
              )}

              {isCompleted ? (
                <span className="inline-flex items-center gap-1.5 px-4 py-1.5 text-sm font-bold text-emerald-700 bg-emerald-100/80 dark:text-emerald-300 dark:bg-emerald-900/50 rounded-full border border-emerald-200 dark:border-emerald-700 shadow-sm">
                  <CheckCircle2 className="w-4 h-4" /> Synthesized
                </span>
              ) : (
                <span className="text-xs font-semibold text-zinc-500 bg-zinc-100 dark:bg-zinc-800 px-3 py-1.5 rounded-full">
                  {userMessagesCount === 0
                    ? "Starting"
                    : `${userMessagesCount} message${userMessagesCount > 1 ? "s" : ""}`}
                </span>
              )}
            </div>
          </div>
        </header>

        {/* Chat Messages Area */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-8 space-y-3 z-0 relative scroll-smooth">
          {messages.map((msg, index) => (
            <ChatBubble key={index} role={msg.role} text={msg.text} />
          ))}

          {loading && <ChatBubble role="ai" text="" isTyping={true} />}

          {isCompleted && extractedProfile && (
            <div className="my-8 p-8 rounded-3xl bg-white/80 dark:bg-zinc-800/80 backdrop-blur-md border border-white/80 dark:border-zinc-700/80 shadow-2xl shadow-emerald-500/10 animate-in fade-in slide-in-from-bottom-8 duration-700 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-400/10 rounded-full blur-[80px] -mr-20 -mt-20 pointer-events-none" />

              <div className="relative z-10">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-600 text-white flex items-center justify-center shadow-lg shadow-emerald-500/30">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-xl tracking-tight text-zinc-900 dark:text-white">
                      Profile Synthesized
                    </h3>
                    <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
                      Adaptive intelligence mapping complete
                    </p>
                  </div>
                </div>

                <div className="bg-white/60 dark:bg-zinc-900/60 p-6 rounded-2xl border border-white/60 dark:border-zinc-800/60 text-sm space-y-4 mb-8 shadow-inner backdrop-blur-sm">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-zinc-200/50 dark:border-zinc-700/50 pb-3 gap-1">
                    <span className="text-zinc-500 dark:text-zinc-400 font-medium">
                      Target Goal
                    </span>
                    <span className="font-bold text-zinc-900 dark:text-zinc-100 bg-indigo-50 dark:bg-indigo-900/30 px-3 py-1 rounded-lg text-right">
                      {extractedProfile.goal}
                    </span>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-zinc-200/50 dark:border-zinc-700/50 pb-3 gap-1">
                    <span className="text-zinc-500 dark:text-zinc-400 font-medium">
                      Weekly Capacity
                    </span>
                    <span className="font-bold text-zinc-900 dark:text-zinc-100">
                      {extractedProfile.weeklyHours} hrs/week
                    </span>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-zinc-200/50 dark:border-zinc-700/50 pb-3 gap-1">
                    <span className="text-zinc-500 dark:text-zinc-400 font-medium">
                      Learning Modality
                    </span>
                    <span className="font-bold text-zinc-900 dark:text-zinc-100">
                      {extractedProfile.learningStyle}
                    </span>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <span className="text-zinc-500 dark:text-zinc-400 font-medium">
                      Current Baseline
                    </span>
                    <span className="font-bold text-zinc-900 dark:text-zinc-100">
                      {extractedProfile.experienceLevel}
                    </span>
                  </div>
                </div>

                <a
                  href="/dashboard"
                  className="group/btn relative flex items-center justify-center gap-3 w-full sm:w-auto px-8 py-4 bg-zinc-900 dark:bg-white hover:bg-zinc-800 dark:hover:bg-zinc-100 text-white dark:text-zinc-900 rounded-2xl font-bold text-sm transition-all shadow-xl shadow-zinc-900/20 active:scale-95 overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-[200%] group-hover/btn:translate-x-[200%] transition-transform duration-1000" />
                  <span className="relative z-10">Generate Adaptive Path</span>
                  <ArrowRight className="w-5 h-5 relative z-10 group-hover/btn:translate-x-1 transition-transform" />
                </a>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input & Quick Replies Footer */}
        {!isCompleted && (
          <footer className="p-4 sm:p-6 border-t border-white/40 dark:border-zinc-800/40 bg-white/30 dark:bg-zinc-900/30 backdrop-blur-md z-10 relative flex flex-col gap-3">
            {/* Contextual Quick Replies Chips */}
            {hasQuickReplies && (
              <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                <QuickReplyChips
                  options={lastMessage.quick_replies!}
                  onSelect={handleSendMessage}
                />
              </div>
            )}

            {/* Always Available Free-form Text Input (ChatGPT / Gemini style) */}
            <ChatInput onSend={handleSendMessage} disabled={loading} />
          </footer>
        )}
      </div>
    </main>
  );
}
