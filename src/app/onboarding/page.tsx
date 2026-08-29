"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import ChatBubble from "@/components/chat/ChatBubble";
import ChatInput from "@/components/chat/ChatInput";
import QuickReplyChips from "@/components/chat/QuickReplyChips";
import { CheckCircle2, ArrowRight, HelpCircle, Check, AlertCircle, Loader2, Clock } from "lucide-react";

type MessageRole = "user" | "ai";

interface ChatMessage {
  role: MessageRole;
  text: string;
  quick_replies?: string[];
}

interface DiagnosticQuestion {
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
}

interface LearnerProfile {
  userId?: string;
  goal?: string;
  weeklyHours?: number;
  learningStyle?: string;
  experienceLevel?: string;
}

interface RecommendationResponse {
  goal?: string;
  weeklyHours?: number;
  timeToGoalWeeks?: number;
  bottleneck?: string | null;
  aiInsight?: string;
  activePath?: {
    id?: string;
    version?: number;
    triggerReason?: string;
    generatedAt?: string | Date;
    milestones?: Array<{
      id: string;
      status?: string;
      phase?: string;
      resource?: {
        title?: string;
        durationHours?: number;
        format?: string;
      };
      reason?: string;
    }>;
  };
  recommendations?: unknown[];
  reason?: string;
}

export default function OnboardingPage() {
  const router = useRouter();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [extractedProfile, setExtractedProfile] = useState<LearnerProfile | null>(null);
  const [provider, setProvider] = useState<string>("gemini");
  
  // Diagnostic Quiz State
  const [quizQuestions, setQuizQuestions] = useState<DiagnosticQuestion[]>([]);
  const [quizSkillName, setQuizSkillName] = useState<string>("");
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, string>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizScore, setQuizScore] = useState<number | null>(null);
  const [diagnosticMode, setDiagnosticMode] = useState<"ai" | "fallback" | null>(null);

  // Recommendation Engine State
  const [isGeneratingPath, setIsGeneratingPath] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading, isGeneratingPath]);

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
                "AI Engineering & Machine Learning",
                "Backend Systems & Architecture",
                "DevOps & Cloud Engineering",
                "Data Analytics & Engineering"
              ],
            },
          ]);
          if (data.provider) setProvider(data.provider);
        } else {
          throw new Error("Invalid response");
        }
      } catch {
        setMessages([
          {
            role: "ai",
            text: "Welcome to the Adaptive Learning Intelligence Engine! What engineering domain are you looking to master?",
            quick_replies: [
              "Full Stack Web Development",
              "AI Engineering & Machine Learning",
              "Backend Systems & Architecture",
              "DevOps & Cloud Engineering",
              "Data Analytics & Engineering"
            ],
          },
        ]);
      } finally {
        setLoading(false);
      }
    };
    initChat();
  }, []);

  const loadDiagnosticQuestions = async (profile: LearnerProfile) => {
    const goal = (profile.goal || "").toLowerCase();
    
    // Choose primary skill to test based on canonical goal templates
    let targetSkill = "JavaScript & React";
    let fallbackQuestions: DiagnosticQuestion[] = [
      {
        question: "What is the primary difference between 'interface' and 'type' in TypeScript?",
        options: [
          "Interfaces can be merged via declaration merging; types cannot.",
          "Types are only for primitives; interfaces are only for objects.",
          "Interfaces compile to JavaScript classes; types are removed at runtime.",
          "There is no difference; they are 100% interchangeable."
        ],
        correctAnswer: "Interfaces can be merged via declaration merging; types cannot.",
        explanation: "Declaration merging allows multiple interface declarations with the same name to combine."
      },
      {
        question: "In React Server Components (RSC), which hook is NOT allowed?",
        options: ["useState", "useMemo", "useEffect", "All of the above"],
        correctAnswer: "All of the above",
        explanation: "Server components execute on the server and cannot use browser lifecycle hooks."
      },
      {
        question: "What is the main benefit of Database Connection Pooling in a serverless backend?",
        options: [
          "Prevents exhausting database connection limits across concurrent lambda invocations.",
          "Encrypts SQL queries using AES-256 automatically.",
          "Converts SQL relational data to NoSQL documents in memory.",
          "Eliminates the need for indexing on foreign keys."
        ],
        correctAnswer: "Prevents exhausting database connection limits across concurrent lambda invocations.",
        explanation: "Connection poolers multiplex connections so serverless lambdas do not overload PostgreSQL."
      }
    ];

    if (goal.includes("ai") || goal.includes("ml") || goal.includes("machine") || goal.includes("deep")) {
      targetSkill = "Linear Algebra & PyTorch";
      fallbackQuestions = [
        {
          question: "What does the Singular Value Decomposition (SVD) of matrix A = U Σ V^T decompose?",
          options: [
            "Rotations (U, V) and scaling by singular values (Σ).",
            "Eigenvalues and eigenvectors only for symmetric matrices.",
            "Gradient descent steps for loss function minimization.",
            "Sparse matrix dot product approximations."
          ],
          correctAnswer: "Rotations (U, V) and scaling by singular values (Σ).",
          explanation: "SVD factors any real matrix into orthogonal rotation matrices U, V and diagonal scaling matrix Σ."
        },
        {
          question: "In Transformer architectures, what is the computational complexity of standard Self-Attention with sequence length N?",
          options: ["O(N^2)", "O(N)", "O(N log N)", "O(1)"],
          correctAnswer: "O(N^2)",
          explanation: "Every token computes an attention score against all other tokens, yielding quadratic time complexity."
        },
        {
          question: "What is the primary objective of LoRA (Low-Rank Adaptation) in LLM fine-tuning?",
          options: [
            "Freeze base weights and train low-rank decomposition matrices to drastically reduce trainable parameters.",
            "Quantize weights from 16-bit float to 4-bit integer.",
            "Prune 90% of redundant attention heads before inference.",
            "Replace multi-head attention with state space models."
          ],
          correctAnswer: "Freeze base weights and train low-rank decomposition matrices to drastically reduce trainable parameters.",
          explanation: "LoRA decomposes weight update matrices ΔW = B × A with low rank r << d, slashing memory usage."
        }
      ];
    } else if (goal.includes("devops") || goal.includes("cloud") || goal.includes("infra")) {
      targetSkill = "Docker & Kubernetes";
      fallbackQuestions = [
        {
          question: "What is the difference between a Kubernetes Deployment and a StatefulSet?",
          options: [
            "StatefulSets provide stable network identities and persistent storage per replica; Deployments are stateless.",
            "Deployments run on Linux; StatefulSets only run on Windows nodes.",
            "StatefulSets cannot be scaled down; Deployments can.",
            "Deployments require Helm charts; StatefulSets require YAML manifests."
          ],
          correctAnswer: "StatefulSets provide stable network identities and persistent storage per replica; Deployments are stateless.",
          explanation: "StatefulSet pods maintain unique ordinal IDs and persistent volume bindings across restarts."
        },
        {
          question: "In Docker, what is the purpose of multi-stage builds?",
          options: [
            "Keep the final production image small by separating build tooling from the runtime environment.",
            "Run multiple containers inside a single Linux namespace.",
            "Enable GPU pass-through without installing NVIDIA container toolkit.",
            "Automatically restart failed containers across host clusters."
          ],
          correctAnswer: "Keep the final production image small by separating build tooling from the runtime environment.",
          explanation: "Multi-stage builds compile artifacts in one stage and copy only the binary to the minimal final stage."
        }
      ];
    } else if (goal.includes("data") || goal.includes("analyst") || goal.includes("analytics")) {
      targetSkill = "PostgreSQL & Pandas";
      fallbackQuestions = [
        {
          question: "In SQL, what is the difference between WHERE and HAVING clauses?",
          options: [
            "WHERE filters rows before aggregation; HAVING filters aggregated groups.",
            "HAVING is only for text strings; WHERE is only for numbers.",
            "WHERE requires a JOIN; HAVING operates on single tables.",
            "They are completely interchangeable."
          ],
          correctAnswer: "WHERE filters rows before aggregation; HAVING filters aggregated groups.",
          explanation: "WHERE filters individual table rows prior to GROUP BY aggregation, whereas HAVING filters grouped summaries."
        },
        {
          question: "In Pandas, what is the most memory-efficient way to handle low-cardinality string columns?",
          options: [
            "Convert dtype to 'category'",
            "Convert to float64",
            "Store as Python object arrays",
            "Serialize to JSON strings"
          ],
          correctAnswer: "Convert dtype to 'category'",
          explanation: "Categorical dtypes store integers mapped to a dictionary of unique categories, reducing memory footprint."
        }
      ];
    } else if (goal.includes("backend")) {
      targetSkill = "Node.js & Distributed Systems";
      fallbackQuestions = [
        {
          question: "In Node.js event loop, in which phase are process.nextTick() callbacks executed?",
          options: [
            "Immediately after the current operation finishes, before transitioning to the next event loop phase.",
            "In the Timers phase with setTimeout callbacks.",
            "In the Poll phase during I/O polling.",
            "Only on thread pool completion."
          ],
          correctAnswer: "Immediately after the current operation finishes, before transitioning to the next event loop phase.",
          explanation: "process.nextTick queue is drained immediately after the current script run completes."
        },
        {
          question: "When scaling Redis in production, what is the purpose of Redis Sentinel?",
          options: [
            "Provides high availability, monitoring, and automatic failover if the primary node goes down.",
            "Compresses key-value data on disk.",
            "Translates SQL queries to Redis commands.",
            "Replaces PostgreSQL as a primary relational store."
          ],
          correctAnswer: "Provides high availability, monitoring, and automatic failover if the primary node goes down.",
          explanation: "Redis Sentinel monitors primary and replica instances and orchestrates automatic failover."
        }
      ];
    }

    let apiSuccess = false;

    if (profile.userId) {
      setLoading(true);
      try {
        const res = await fetch("/api/diagnostic/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: profile.userId })
        });

        if (res.ok) {
          const data = await res.json();
          if (data.skillName && data.questions && Array.isArray(data.questions) && data.questions.length > 0) {
            setQuizSkillName(data.skillName);
            setQuizQuestions(data.questions);
            setDiagnosticMode("ai");
            apiSuccess = true;
          }
        }
      } catch (err) {
        console.warn("Failed to generate diagnostic via API, falling back to local questions:", err);
      } finally {
        setLoading(false);
      }
    }

    if (!apiSuccess) {
      setQuizSkillName(targetSkill);
      setQuizQuestions(fallbackQuestions);
      setDiagnosticMode("fallback");
    }
  };

  const triggerProfileExtraction = async (conversation: ChatMessage[]) => {
    setLoading(true);
    try {
      const extractRes = await fetch("/api/profile/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: conversation }),
      });
      const extractData = await extractRes.json();

      let profileWithId: LearnerProfile;
      if (extractData.profile) {
        profileWithId = {
          ...extractData.profile,
          userId: extractData.userId,
        };
      } else {
        const userMsgs = conversation.filter((m) => m.role === "user");
        profileWithId = {
          goal: userMsgs[0]?.text || "AI Engineering & Machine Learning",
          experienceLevel: "Intermediate",
          weeklyHours: 10,
          learningStyle: "Interactive Coding",
        };
      }

      setExtractedProfile(profileWithId);
      sessionStorage.setItem("learnerProfile", JSON.stringify(profileWithId));
      if (profileWithId.userId) {
        sessionStorage.setItem("userId", profileWithId.userId);
      }
      sessionStorage.setItem("aiProvider", extractData.provider || provider);
      setIsCompleted(true);

      // Pre-load Diagnostic Quiz for the selected goal
      await loadDiagnosticQuestions(profileWithId);
    } catch (err) {
      console.error("Profile extraction fallback:", err);
      const userMsgs = conversation.filter((m) => m.role === "user");
      const fallbackProfile: LearnerProfile = {
        goal: userMsgs[0]?.text || "AI Engineering & Machine Learning",
        experienceLevel: "Intermediate",
        weeklyHours: 10,
        learningStyle: "Interactive Coding",
      };
      setExtractedProfile(fallbackProfile);
      sessionStorage.setItem("learnerProfile", JSON.stringify(fallbackProfile));
      setIsCompleted(true);
      await loadDiagnosticQuestions(fallbackProfile);
    } finally {
      setLoading(false);
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

      const updated = [...conversationWithUser, aiReply];
      setMessages(updated);

      // Complete extraction when advisor marks complete or sufficient detail is gathered
      const userCount = updated.filter((m) => m.role === "user").length;
      if (data.is_complete || userCount >= 4) {
        triggerProfileExtraction(updated);
      }
    } catch (err) {
      console.error("Chat error:", err);
      const fallbackReply: ChatMessage = {
        role: "ai",
        text: "Captured! I am assembling your personalized learning profile and diagnostic assessment.",
        quick_replies: [],
      };
      const updated = [...conversationWithUser, fallbackReply];
      setMessages(updated);
      triggerProfileExtraction(updated);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateWeeklyHours = (hours: number) => {
    if (!extractedProfile) return;
    const updated = { ...extractedProfile, weeklyHours: hours };
    setExtractedProfile(updated);
    sessionStorage.setItem("learnerProfile", JSON.stringify(updated));
  };

  const handleSelectOption = (qIdx: number, option: string) => {
    setSelectedAnswers((prev) => ({ ...prev, [qIdx]: option }));
  };

  const callRecommendationEngine = async (userId: string | null, profile: LearnerProfile) => {
    setIsGeneratingPath(true);
    setGenerationError(null);

    try {
      const recRes = await fetch("/api/recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: userId || undefined,
          goal: profile.goal || "AI Engineering & Machine Learning",
          learnerContext: {
            weeklyHours: profile.weeklyHours || 10,
            learningStyle: profile.learningStyle || "Interactive Coding",
            experienceLevel: profile.experienceLevel || "Intermediate",
          },
        }),
      });

      if (!recRes.ok) {
        throw new Error(`Failed to generate recommendation path (Status ${recRes.status})`);
      }

      const recData: RecommendationResponse = await recRes.json();
      if (recData?.activePath?.milestones && Array.isArray(recData.activePath.milestones) && recData.activePath.milestones.length > 0) {
        sessionStorage.setItem("activeRecommendation", JSON.stringify(recData));
      } else {
        sessionStorage.removeItem("activeRecommendation");
        setGenerationError(recData.reason || "No personalized milestones were returned. A standard fallback curriculum will be used.");
      }
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : "Failed to generate path";
      console.error("Recommendation generation error:", errMsg);
      sessionStorage.removeItem("activeRecommendation");
      setGenerationError(errMsg);
    } finally {
      setIsGeneratingPath(false);
    }
  };

  const handleSubmitQuiz = async () => {
    let correctCount = 0;
    quizQuestions.forEach((q, idx) => {
      if (selectedAnswers[idx] === q.correctAnswer) {
        correctCount += 1;
      }
    });

    const calculatedScore = (correctCount / quizQuestions.length) * 5;
    setQuizScore(calculatedScore);
    setQuizSubmitted(true);

    const userId = sessionStorage.getItem("userId");
    
    // 1. Submit diagnostic to database
    if (userId) {
      try {
        await fetch("/api/diagnostic/submit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId,
            skillName: quizSkillName,
            score: calculatedScore,
          }),
        });
      } catch (e) {
        console.warn("Diagnostic submit logged locally:", e);
      }
    }

    // 2. Trigger real recommendation engine with user profile
    if (extractedProfile) {
      await callRecommendationEngine(userId, extractedProfile);
    }
  };

  const handleNavigateToDashboard = () => {
    router.push("/dashboard");
  };

  const lastMessage = messages[messages.length - 1];
  const hasQuickReplies =
    lastMessage &&
    lastMessage.role === "ai" &&
    lastMessage.quick_replies &&
    lastMessage.quick_replies.length > 0;

  return (
    <main className="min-h-screen relative overflow-hidden bg-[#FDFCFB] text-[#1A1A1A] flex flex-col items-center justify-center p-3 sm:p-6 md:p-8 font-sans">
      {/* Background Ambience */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-40">
        <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-emerald-100 blur-[120px]" />
        <div className="absolute top-[60%] -right-[10%] w-[60%] h-[60%] rounded-full bg-indigo-100 blur-[140px]" />
      </div>

      <div className="relative w-full max-w-4xl bg-white border border-[#1A1A1A]/15 rounded-2xl shadow-xl flex flex-col h-[92vh] max-h-[900px] overflow-hidden">
        {/* Header */}
        <header className="px-6 py-4 border-b border-[#1A1A1A]/15 bg-[#F8F7F4] flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#1A1A1A] text-white flex items-center justify-center font-serif text-lg font-bold">
              λ
            </div>
            <div>
              <h1 className="text-base font-bold tracking-tight text-[#1A1A1A] flex items-center gap-2 font-mono uppercase">
                Adaptive Learning Advisor
                <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-300">
                  {provider}
                </span>
              </h1>
              <p className="text-xs font-mono text-[#666]">
                {isCompleted
                  ? "Topological Synthesis & Diagnostic"
                  : "Conversational Goal & Diagnostic Engine"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {!isCompleted && messages.filter(m => m.role === 'user').length >= 1 && (
              <button
                onClick={() => triggerProfileExtraction(messages)}
                className="px-3 py-1.5 bg-[#1A1A1A] hover:bg-black text-white rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
              >
                <span>Synthesize Profile</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            )}
            {isCompleted ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-mono font-bold text-emerald-800 bg-emerald-100 rounded-full border border-emerald-300">
                <CheckCircle2 className="w-3.5 h-3.5" /> Synthesized
              </span>
            ) : (
              <span className="text-xs font-mono text-[#777] bg-[#EAE8E1] px-3 py-1 rounded-full">
                Step 1: Goal Mapping
              </span>
            )}
          </div>
        </header>

        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-8 space-y-4 relative scroll-smooth">
          {messages.map((msg, index) => (
            <ChatBubble key={index} role={msg.role} text={msg.text} />
          ))}

          {loading && <ChatBubble role="ai" text="" isTyping={true} />}

          {/* Profile Card & Diagnostic Quiz Assessment Step */}
          {isCompleted && extractedProfile && (
            <div className="my-6 p-6 sm:p-8 rounded-2xl bg-[#F8F7F4] border border-[#1A1A1A]/15 shadow-sm space-y-6">
              {/* Profile Overview Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#1A1A1A]/15 pb-4 gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-serif italic text-2xl font-bold text-[#1A1A1A]">
                      Learner Profile Synthesized
                    </h3>
                    <span className="text-[10px] font-mono uppercase px-2 py-0.5 bg-emerald-100 text-emerald-800 border border-emerald-300 rounded font-bold">
                      Goal Verified
                    </span>
                  </div>
                  <p className="text-xs font-mono text-[#666] mt-1">
                    Target Role: <strong className="text-[#1A1A1A]">{extractedProfile.goal}</strong> • Baseline: <strong className="text-[#1A1A1A]">{extractedProfile.experienceLevel}</strong>
                  </p>
                </div>
              </div>

              {/* Weekly Hours Adjustment Control */}
              <div className="p-4 bg-white border border-[#1A1A1A]/15 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono uppercase font-bold text-[#1A1A1A] flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-emerald-700" />
                    <span>Weekly Study Budget (Hours / Week):</span>
                  </span>
                  <span className="text-xs font-mono font-bold px-2 py-0.5 bg-emerald-50 text-emerald-900 border border-emerald-300 rounded">
                    {extractedProfile.weeklyHours || 10}h / week
                  </span>
                </div>
                <div className="flex flex-wrap gap-2 pt-1">
                  {[5, 8, 10, 15, 20, 30].map((hrs) => (
                    <button
                      key={hrs}
                      type="button"
                      onClick={() => handleUpdateWeeklyHours(hrs)}
                      className={`px-3 py-1.5 text-xs font-mono rounded-lg border transition-all cursor-pointer ${
                        extractedProfile.weeklyHours === hrs
                          ? 'bg-[#1A1A1A] text-white border-[#1A1A1A] font-bold shadow-xs'
                          : 'bg-[#F8F7F4] text-[#555] border-[#D5D2C9] hover:border-[#1A1A1A]'
                      }`}
                    >
                      {hrs}h/wk
                    </button>
                  ))}
                </div>
                <p className="text-[11px] font-mono text-[#777] pt-1">
                  💡 The recommendation engine divides your total curriculum hours by this weekly budget to calculate estimated weeks to completion.
                </p>
              </div>

              {/* Diagnostic Assessment Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <HelpCircle className="w-4 h-4 text-[#1A1A1A]" />
                    <h4 className="text-sm font-mono uppercase font-bold tracking-wider text-[#1A1A1A]">
                      Step 2: Adaptive Diagnostic Assessment ({quizSkillName})
                    </h4>
                    {diagnosticMode === "ai" ? (
                      <span className="text-[9px] font-mono uppercase px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold tracking-wider animate-pulse">
                        AI-generated diagnostic
                      </span>
                    ) : diagnosticMode === "fallback" ? (
                      <span className="text-[9px] font-mono uppercase px-2 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-300 font-bold tracking-wider">
                        Fallback diagnostic
                      </span>
                    ) : null}
                  </div>
                  <span className="text-[11px] font-mono text-[#777]">
                    BKT Validation ({quizQuestions.length} Questions)
                  </span>
                </div>

                <div className="space-y-4">
                  {quizQuestions.map((q, qIdx) => (
                    <div
                      key={qIdx}
                      className="p-5 rounded-xl border border-[#1A1A1A]/10 bg-white space-y-3 shadow-2xs"
                    >
                      <p className="text-sm font-semibold font-serif text-[#1A1A1A]">
                        {qIdx + 1}. {q.question}
                      </p>

                      <div className="space-y-2">
                        {q.options.map((opt, oIdx) => {
                          const isSelected = selectedAnswers[qIdx] === opt;
                          const isCorrect = opt === q.correctAnswer;

                          let optStyle = "border-[#1A1A1A]/15 bg-white text-[#333] hover:border-[#1A1A1A]/50";
                          if (quizSubmitted) {
                            if (isCorrect) {
                              optStyle = "border-emerald-500 bg-emerald-50 text-emerald-900 font-medium";
                            } else if (isSelected && !isCorrect) {
                              optStyle = "border-rose-500 bg-rose-50 text-rose-900";
                            }
                          } else if (isSelected) {
                            optStyle = "border-[#1A1A1A] bg-[#1A1A1A] text-white font-medium";
                          }

                          return (
                            <button
                              key={oIdx}
                              disabled={quizSubmitted}
                              onClick={() => handleSelectOption(qIdx, opt)}
                              className={`w-full text-left p-3 text-xs sm:text-sm font-sans rounded-lg border transition-all cursor-pointer flex items-center justify-between ${optStyle}`}
                            >
                              <span>{opt}</span>
                              {quizSubmitted && isCorrect && (
                                <Check className="w-4 h-4 text-emerald-600 shrink-0 ml-2" />
                              )}
                            </button>
                          );
                        })}
                      </div>

                      {quizSubmitted && (
                        <div className="text-xs font-mono p-3 bg-[#F8F7F4] border border-[#1A1A1A]/10 rounded-lg text-[#555] leading-relaxed">
                          <strong>Concept:</strong> {q.explanation}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {!quizSubmitted ? (
                  <button
                    onClick={handleSubmitQuiz}
                    disabled={Object.keys(selectedAnswers).length < quizQuestions.length}
                    className="w-full py-3.5 bg-[#1A1A1A] text-white font-mono text-xs uppercase tracking-widest font-bold rounded-xl hover:bg-black disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md cursor-pointer"
                  >
                    Submit Diagnostic Assessment &amp; Compile Roadmap
                  </button>
                ) : (
                  <div className="space-y-4 pt-2">
                    {/* BKT Result Card */}
                    <div className="p-5 rounded-xl bg-emerald-50 border border-emerald-300 flex flex-col sm:flex-row items-center justify-between gap-4">
                      <div className="space-y-1 text-center sm:text-left">
                        <span className="text-[10px] font-mono uppercase tracking-widest text-emerald-800 font-bold block">
                          Empirical Assessment Score
                        </span>
                        <div className="text-2xl font-serif font-bold text-emerald-950">
                          {quizScore?.toFixed(1)} / 5.0 Mastery Index
                        </div>
                        <p className="text-xs font-mono text-emerald-800">
                          Bayesian Knowledge Tracing estimate updated with slip &amp; guess parameters.
                        </p>
                      </div>

                      {isGeneratingPath ? (
                        <div className="flex items-center gap-2 font-mono text-xs text-emerald-900 bg-white/80 px-4 py-2 rounded-lg border border-emerald-200">
                          <Loader2 className="w-4 h-4 animate-spin text-emerald-700" />
                          <span>Compiling DAG Roadmap...</span>
                        </div>
                      ) : (
                        <button
                          onClick={handleNavigateToDashboard}
                          className="px-6 py-3 bg-[#1A1A1A] hover:bg-black text-white rounded-xl font-mono text-xs uppercase tracking-widest font-bold flex items-center gap-2 transition-all shadow-md hover:shadow-lg cursor-pointer"
                        >
                          <span>Launch DAG Roadmap</span>
                          <ArrowRight className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    {generationError && (
                      <div className="p-4 bg-amber-50 border border-amber-300 rounded-xl text-xs font-mono text-amber-900 flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                        <div>
                          <strong>Note:</strong> {generationError}
                          <div className="mt-2">
                            <button
                              onClick={handleNavigateToDashboard}
                              className="px-3 py-1.5 bg-amber-900 text-white rounded text-xs font-mono uppercase font-bold"
                            >
                              Continue to Curriculum
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Reply Suggestions */}
        {!isCompleted && hasQuickReplies && (
          <div className="px-6 py-2 bg-[#F8F7F4]/50 border-t border-[#1A1A1A]/10">
            <QuickReplyChips
              options={lastMessage.quick_replies || []}
              onSelect={handleSendMessage}
            />
          </div>
        )}

        {/* Input Bar */}
        {!isCompleted && (
          <div className="p-4 sm:p-6 border-t border-[#1A1A1A]/15 bg-[#F8F7F4]">
            <ChatInput onSend={handleSendMessage} disabled={loading} />
          </div>
        )}
      </div>
    </main>
  );
}
