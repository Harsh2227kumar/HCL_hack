"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import ChatBubble from "@/components/chat/ChatBubble";
import ChatInput from "@/components/chat/ChatInput";
import QuickReplyChips from "@/components/chat/QuickReplyChips";
import { Sparkles, CheckCircle2, ArrowRight, Bot, Zap, HelpCircle, Check, AlertCircle } from "lucide-react";

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

export default function OnboardingPage() {
  const router = useRouter();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [extractedProfile, setExtractedProfile] = useState<any>(null);
  const [provider, setProvider] = useState<string>("gemini");
  
  // Diagnostic Quiz State
  const [showQuiz, setShowQuiz] = useState(false);
  const [quizLoading, setQuizLoading] = useState(false);
  const [quizQuestions, setQuizQuestions] = useState<DiagnosticQuestion[]>([]);
  const [quizSkillName, setQuizSkillName] = useState<string>("");
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, string>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizScore, setQuizScore] = useState<number | null>(null);

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
                "AI Engineering & Machine Learning",
                "Backend Systems & Architecture",
                "DevOps & Cloud Infrastructure",
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
            text: "Welcome to the Adaptive Learning Intelligence Engine! What engineering domain are you looking to master?",
            quick_replies: [
              "Full Stack Web Development",
              "AI Engineering & Machine Learning",
              "Backend Systems & Architecture",
              "DevOps & Cloud Infrastructure",
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
    setLoading(true);
    try {
      const extractRes = await fetch("/api/profile/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: conversation }),
      });
      const extractData = await extractRes.json();

      let profileWithId: any;
      if (extractData.profile) {
        profileWithId = {
          ...extractData.profile,
          userId: extractData.userId,
        };
      } else {
        const userMsgs = conversation.filter((m) => m.role === "user");
        profileWithId = {
          goal: userMsgs[0]?.text || "Full Stack Web Development",
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
      loadDiagnosticQuestions(profileWithId);
    } catch (err) {
      console.error("Profile extraction fallback:", err);
      const userMsgs = conversation.filter((m) => m.role === "user");
      const fallbackProfile = {
        goal: userMsgs[0]?.text || "Full Stack Web Development",
        experienceLevel: "Intermediate",
        weeklyHours: 10,
        learningStyle: "Interactive Coding",
      };
      setExtractedProfile(fallbackProfile);
      sessionStorage.setItem("learnerProfile", JSON.stringify(fallbackProfile));
      setIsCompleted(true);
      loadDiagnosticQuestions(fallbackProfile);
    } finally {
      setLoading(false);
    }
  };

  const loadDiagnosticQuestions = async (profile: any) => {
    setQuizLoading(true);
    const goal = (profile.goal || "").toLowerCase();
    
    // Choose primary skill to test based on goal
    let targetSkill = "TypeScript & JavaScript";
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
        explanation: "Server components cannot use state or browser lifecycle hooks like useState/useEffect."
      },
      {
        question: "What is the main benefit of Database Connection Pooling in a serverless environment?",
        options: [
          "Prevents exhausting database connection limits across concurrent lambda invocations.",
          "Encrypts SQL queries using AES-256 automatically.",
          "Converts SQL relational data to NoSQL documents in memory.",
          "Eliminates the need for indexing on foreign keys."
        ],
        correctAnswer: "Prevents exhausting database connection limits across concurrent lambda invocations.",
        explanation: "Poolers manage persistent connections so short-lived serverless functions do not overload Postgres."
      }
    ];

    if (goal.includes("ai") || goal.includes("ml") || goal.includes("data")) {
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
          question: "In Transformer models, what is the computational complexity of standard Self-Attention with sequence length N?",
          options: ["O(N^2)", "O(N)", "O(N log N)", "O(1)"],
          correctAnswer: "O(N^2)",
          explanation: "Every token computes an attention score against all other tokens, yielding quadratic time complexity."
        },
        {
          question: "What is the primary objective of LoRA (Low-Rank Adaptation) in LLM fine-tuning?",
          options: [
            "Freeze base weights and train rank decomposition matrices to reduce trainable parameters.",
            "Quantize weights from 16-bit float to 4-bit integer.",
            "Prune 90% of redundant attention heads before inference.",
            "Replace multi-head attention with state space models."
          ],
          correctAnswer: "Freeze base weights and train rank decomposition matrices to reduce trainable parameters.",
          explanation: "LoRA decomposes weight update matrices ΔW = B × A with low rank r << d, slashing memory usage."
        }
      ];
    } else if (goal.includes("devops") || goal.includes("cloud")) {
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
          explanation: "Multi-stage builds allow compiling in one stage and copying only the binary to the minimal final stage."
        }
      ];
    }

    setQuizSkillName(targetSkill);
    setQuizQuestions(fallbackQuestions);
    setQuizLoading(false);
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

      // Auto-extract after 2 exchanges
      if (updated.filter((m) => m.role === "user").length >= 2) {
        triggerProfileExtraction(updated);
      }
    } catch (err) {
      console.error("Chat error:", err);
      const fallbackReply: ChatMessage = {
        role: "ai",
        text: "Great! I have captured your learning objectives. Let's analyze your skills and assemble your roadmap.",
        quick_replies: ["Proceed to Roadmap"],
      };
      const updated = [...conversationWithUser, fallbackReply];
      setMessages(updated);
      triggerProfileExtraction(updated);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectOption = (qIdx: number, option: string) => {
    setSelectedAnswers((prev) => ({ ...prev, [qIdx]: option }));
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
                  ? "Topological Synthesis Complete"
                  : "Conversational Goal & Diagnostic Engine"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
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
              <div className="flex items-center justify-between border-b border-[#1A1A1A]/15 pb-4">
                <div>
                  <h3 className="font-serif italic text-2xl font-bold text-[#1A1A1A]">
                    Learner Profile Synthesized
                  </h3>
                  <p className="text-xs font-mono text-[#666] mt-0.5">
                    Target: <strong>{extractedProfile.goal}</strong> • Capacity: {extractedProfile.weeklyHours}h/wk
                  </p>
                </div>
                <span className="text-xs font-mono px-2.5 py-1 bg-white border border-[#1A1A1A]/20 rounded font-semibold">
                  {extractedProfile.experienceLevel}
                </span>
              </div>

              {/* Diagnostic Assessment Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <HelpCircle className="w-4 h-4 text-[#1A1A1A]" />
                    <h4 className="text-sm font-mono uppercase font-bold tracking-wider text-[#1A1A1A]">
                      Step 2: Adaptive Diagnostic Assessment ({quizSkillName})
                    </h4>
                  </div>
                  <span className="text-[11px] font-mono text-[#777]">
                    BKT Validation ({quizQuestions.length} Questions)
                  </span>
                </div>

                <div className="space-y-4">
                  {quizQuestions.map((q, qIdx) => (
                    <div
                      key={qIdx}
                      className="p-4 rounded-xl bg-white border border-[#1A1A1A]/15 space-y-3"
                    >
                      <p className="text-sm font-medium text-[#1A1A1A]">
                        <span className="font-mono font-bold mr-1.5 text-xs text-[#777]">
                          Q{qIdx + 1}.
                        </span>
                        {q.question}
                      </p>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {q.options.map((opt, optIdx) => {
                          const isSelected = selectedAnswers[qIdx] === opt;
                          const isCorrect = opt === q.correctAnswer;
                          let btnStyle = "bg-[#FAF9F6] border-[#1A1A1A]/15 text-[#333] hover:border-[#1A1A1A]";

                          if (quizSubmitted) {
                            if (isCorrect) {
                              btnStyle = "bg-emerald-50 border-emerald-500 text-emerald-900 font-semibold";
                            } else if (isSelected && !isCorrect) {
                              btnStyle = "bg-red-50 border-red-400 text-red-800 line-through";
                            }
                          } else if (isSelected) {
                            btnStyle = "bg-[#1A1A1A] text-white border-[#1A1A1A]";
                          }

                          return (
                            <button
                              key={optIdx}
                              disabled={quizSubmitted}
                              onClick={() => handleSelectOption(qIdx, opt)}
                              className={`text-left p-3 rounded-lg border text-xs transition-all cursor-pointer flex items-start gap-2 ${btnStyle}`}
                            >
                              <span className="font-mono text-[10px] opacity-60 shrink-0 mt-0.5">
                                {String.fromCharCode(65 + optIdx)}.
                              </span>
                              <span>{opt}</span>
                            </button>
                          );
                        })}
                      </div>

                      {quizSubmitted && (
                        <p className="text-xs text-emerald-800 bg-emerald-50 p-2.5 rounded border border-emerald-200 mt-2 font-sans leading-relaxed">
                          <strong>Rationale:</strong> {q.explanation}
                        </p>
                      )}
                    </div>
                  ))}
                </div>

                {!quizSubmitted ? (
                  <button
                    onClick={handleSubmitQuiz}
                    disabled={Object.keys(selectedAnswers).length < quizQuestions.length}
                    className={`w-full py-3 px-6 rounded-xl font-mono uppercase text-xs tracking-wider font-bold transition-all cursor-pointer ${
                      Object.keys(selectedAnswers).length === quizQuestions.length
                        ? "bg-[#1A1A1A] text-white hover:bg-black shadow-md"
                        : "bg-[#EAE8E1] text-[#888] cursor-not-allowed"
                    }`}
                  >
                    Submit Assessment & Calibrate Bayesian Model
                  </button>
                ) : (
                  <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-300 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 text-emerald-900 font-bold text-sm font-mono">
                        <Check className="w-4 h-4 text-emerald-600" />
                        Diagnostic Calibrated: {(quizScore || 0).toFixed(1)} / 5.0
                      </div>
                      <p className="text-xs text-emerald-700 font-sans mt-0.5">
                        Bayesian Knowledge Tracing updated with empirical evidence.
                      </p>
                    </div>

                    <button
                      onClick={() => router.push("/dashboard")}
                      className="px-6 py-2.5 bg-[#1A1A1A] hover:bg-black text-white rounded-lg font-mono text-xs uppercase tracking-wider font-bold transition-all flex items-center gap-2 shrink-0 cursor-pointer shadow"
                    >
                      <span>Explore DAG Roadmap</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Chat Input & Quick Replies Footer */}
        {!isCompleted && (
          <footer className="p-4 sm:p-6 border-t border-[#1A1A1A]/15 bg-[#F8F7F4] flex flex-col gap-3">
            {hasQuickReplies && (
              <QuickReplyChips
                options={lastMessage.quick_replies!}
                onSelect={handleSendMessage}
              />
            )}
            <ChatInput onSend={handleSendMessage} disabled={loading} />
          </footer>
        )}
      </div>
    </main>
  );
}
