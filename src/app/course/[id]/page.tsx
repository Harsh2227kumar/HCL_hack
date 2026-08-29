"use client";

import React, { useState, useMemo } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import learningResourcesData from "../../../../data/learning_resources.json";
import { 
  ArrowLeft, 
  BookOpen, 
  Code, 
  Award, 
  ExternalLink, 
  CheckCircle2, 
  Sparkles, 
  ShieldCheck, 
  ArrowRight,
  Loader2
} from "lucide-react";
import { AiAssistantModal } from "@/components/chat/AiAssistantModal";

interface Resource {
  id: string;
  title: string;
  type: string;
  provider?: string;
  description: string;
  url: string;
  skills_taught: string[];
  prerequisite_skills: string[];
  difficulty: number | string;
  duration_hours?: number;
  format?: string;
}

export default function CourseDetailPage() {
  const params = useParams();
  const rawId = Array.isArray(params?.id) ? params.id[0] : params?.id;
  const resourceId = decodeURIComponent(rawId || "");

  const resource = useMemo<Resource | null>(() => {
    const allResources = learningResourcesData as Resource[];
    const found = allResources.find(r => 
      r.id === resourceId || 
      r.title.toLowerCase().replace(/[^a-z0-9]/g, '-').includes(resourceId.toLowerCase())
    );
    if (found) return found;
    return allResources.length > 0 ? allResources[0] : null;
  }, [resourceId]);

  const [status, setStatus] = useState<"not-started" | "in-progress" | "mastered" | "too-hard" | "skipped">("not-started");
  const [aiAssistantOpen, setAiAssistantOpen] = useState(false);
  
  // Interactive Quiz / Knowledge Check State
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [activeTab, setActiveTab] = useState<"overview" | "practice" | "prerequisites">("overview");

  const handleStatusChange = async (newStatus: "not-started" | "in-progress" | "mastered" | "too-hard" | "skipped") => {
    setStatus(newStatus);

    try {
      const storedUserId = typeof window !== 'undefined' ? sessionStorage.getItem('userId') : null;
      if (storedUserId && resource) {
        let eventType = 'started';
        if (newStatus === 'mastered') eventType = 'completed';
        else if (newStatus === 'too-hard') eventType = 'too_hard';
        else if (newStatus === 'skipped') eventType = 'skipped';
        else if (newStatus === 'in-progress') eventType = 'started';

        await fetch('/api/progress', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: storedUserId,
            resourceId: resource.id,
            eventType
          })
        });
      }
    } catch (e) {
      console.warn("Failed to sync progress event:", e);
    }
  };

  if (!resource) {
    return (
      <div className="min-h-screen bg-[#FDFCFB] flex flex-col items-center justify-center p-6 text-[#1A1A1A]">
        <Loader2 className="w-8 h-8 animate-spin text-[#1A1A1A] mb-4" />
        <p className="font-mono text-xs uppercase tracking-wider text-[#666]">Locating learning module in graph...</p>
      </div>
    );
  }

  const isAssessment = resource.type?.toLowerCase() === "assessment";
  const isProject = resource.type?.toLowerCase() === "project";

  return (
    <div className="min-h-screen bg-[#FDFCFB] text-[#1A1A1A] font-sans flex flex-col">
      {/* Top Navigation Bar */}
      <header className="border-b border-[#1A1A1A]/15 bg-white sticky top-0 z-30 px-4 sm:px-8 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard"
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono uppercase font-bold text-[#1A1A1A] bg-[#F8F7F4] hover:bg-[#1A1A1A] hover:text-white border border-[#1A1A1A]/20 rounded-lg transition-all"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to DAG Roadmap</span>
          </Link>
          <div className="hidden md:flex items-center gap-2 text-xs font-mono text-[#777]">
            <span>MODULE ID:</span>
            <span className="bg-[#F8F7F4] px-2 py-0.5 border border-[#1A1A1A]/10 text-[#1A1A1A] font-bold">{resource.id}</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setAiAssistantOpen(true)}
            className="flex items-center gap-2 px-3.5 py-1.5 bg-[#1A1A1A] text-white hover:bg-black rounded-lg text-xs font-mono uppercase font-bold tracking-wider transition-all shadow-xs cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            <span>Ask AI Tutor</span>
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-5xl w-full mx-auto p-4 sm:p-8 space-y-8 flex-1">
        {/* Resource Header Card */}
        <section className="bg-white border border-[#1A1A1A]/15 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-mono uppercase font-bold rounded-full border ${
                isAssessment 
                  ? 'bg-purple-100 text-purple-900 border-purple-300' 
                  : isProject 
                  ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                  : 'bg-indigo-100 text-indigo-900 border-indigo-300'
              }`}>
                {isAssessment ? <Award className="w-3.5 h-3.5" /> : isProject ? <Code className="w-3.5 h-3.5" /> : <BookOpen className="w-3.5 h-3.5" />}
                {resource.type.toUpperCase()}
              </span>
              <span className="text-xs font-mono text-[#666] bg-[#F8F7F4] px-2.5 py-1 border border-[#1A1A1A]/10 rounded-full">
                {resource.provider || "Curated Standard"}
              </span>
              <span className="text-xs font-mono text-[#666] bg-[#F8F7F4] px-2.5 py-1 border border-[#1A1A1A]/10 rounded-full">
                ⏱ {resource.duration_hours || 10}h Duration
              </span>
            </div>

            {/* Current State Indicator */}
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono text-[#777] uppercase">Current Mastery:</span>
              <span className={`text-xs font-mono uppercase font-bold px-2.5 py-1 rounded-md border ${
                status === 'mastered' ? 'bg-emerald-100 text-emerald-900 border-emerald-300' :
                status === 'in-progress' ? 'bg-amber-100 text-amber-900 border-amber-300' :
                status === 'too-hard' ? 'bg-rose-100 text-rose-900 border-rose-300' :
                status === 'skipped' ? 'bg-blue-100 text-blue-900 border-blue-300' :
                'bg-[#F8F7F4] text-[#666] border-[#D5D2C9]'
              }`}>
                {status === 'mastered' ? '✓ Mastered' :
                 status === 'in-progress' ? '🔄 In Progress' :
                 status === 'too-hard' ? '⚠️ Flagged Too Hard' :
                 status === 'skipped' ? '↷ Skipped' : '○ Not Started'}
              </span>
            </div>
          </div>

          <div className="space-y-3">
            <h1 className="text-2xl sm:text-4xl font-serif font-bold text-[#1A1A1A] leading-tight">
              {resource.title}
            </h1>
            <p className="text-sm sm:text-base font-serif leading-relaxed text-[#444] max-w-3xl">
              {resource.description}
            </p>
          </div>

          {/* Action Row: External Resource Link & Progress Switcher */}
          <div className="pt-4 border-t border-[#1A1A1A]/10 flex flex-wrap items-center justify-between gap-4">
            <a
              href={resource.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-5 py-3 bg-[#1A1A1A] text-white hover:bg-black text-xs font-mono uppercase font-bold tracking-wider rounded-xl transition-all shadow-sm hover:shadow-md cursor-pointer"
            >
              <span>Launch Official Course / Assessment</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>

            {/* Quick Status Bar */}
            <div className="flex flex-wrap items-center gap-1.5 text-xs font-mono">
              <span className="text-[#777] mr-1 text-[11px]">Update Status:</span>
              <button
                onClick={() => handleStatusChange('in-progress')}
                className={`px-3 py-1.5 border rounded-lg transition-all cursor-pointer ${
                  status === 'in-progress' ? 'bg-amber-600 text-white border-amber-700 font-bold' : 'bg-white text-[#555] border-[#D5D2C9] hover:border-[#1A1A1A]'
                }`}
              >
                In Progress
              </button>
              <button
                onClick={() => handleStatusChange('mastered')}
                className={`px-3 py-1.5 border rounded-lg transition-all cursor-pointer ${
                  status === 'mastered' ? 'bg-emerald-700 text-white border-emerald-800 font-bold' : 'bg-white text-[#555] border-[#D5D2C9] hover:border-[#1A1A1A]'
                }`}
              >
                ✓ Mark Mastered
              </button>
              <button
                onClick={() => handleStatusChange('too-hard')}
                className={`px-3 py-1.5 border rounded-lg transition-all cursor-pointer ${
                  status === 'too-hard' ? 'bg-rose-700 text-white border-rose-800 font-bold' : 'bg-white text-[#555] border-[#D5D2C9] hover:border-[#1A1A1A]'
                }`}
              >
                Too Hard
              </button>
              <button
                onClick={() => handleStatusChange('skipped')}
                className={`px-3 py-1.5 border rounded-lg transition-all cursor-pointer ${
                  status === 'skipped' ? 'bg-blue-700 text-white border-blue-800 font-bold' : 'bg-white text-[#555] border-[#D5D2C9] hover:border-[#1A1A1A]'
                }`}
              >
                Skip
              </button>
            </div>
          </div>
        </section>

        {/* Tabbed Navigation: Overview, Interactive Practice, Prerequisites */}
        <div className="border-b border-[#1A1A1A]/15 flex items-center gap-6 text-xs font-mono uppercase tracking-wider">
          <button
            onClick={() => setActiveTab('overview')}
            className={`pb-3 font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === 'overview' ? 'border-[#1A1A1A] text-[#1A1A1A]' : 'border-transparent text-[#777] hover:text-[#1A1A1A]'
            }`}
          >
            01 / Curriculum & Skills
          </button>
          <button
            onClick={() => setActiveTab('practice')}
            className={`pb-3 font-bold border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'practice' ? 'border-[#1A1A1A] text-[#1A1A1A]' : 'border-transparent text-[#777] hover:text-[#1A1A1A]'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>02 / Knowledge Check</span>
          </button>
          <button
            onClick={() => setActiveTab('prerequisites')}
            className={`pb-3 font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === 'prerequisites' ? 'border-[#1A1A1A] text-[#1A1A1A]' : 'border-transparent text-[#777] hover:text-[#1A1A1A]'
            }`}
          >
            03 / DAG Prerequisites ({resource.prerequisite_skills?.length || 0})
          </button>
        </div>

        {/* Tab 1: Overview & Skills */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Skills Taught */}
            <div className="bg-white border border-[#1A1A1A]/15 rounded-2xl p-6 space-y-4">
              <h3 className="text-xs font-mono uppercase tracking-widest text-[#777] border-b border-[#1A1A1A]/10 pb-2 flex items-center gap-2 font-bold">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Skills Taught / Verified</span>
              </h3>
              <div className="flex flex-wrap gap-2">
                {resource.skills_taught?.map((skill, sIdx) => (
                  <span
                    key={sIdx}
                    className="px-3 py-1.5 bg-emerald-50 text-emerald-900 border border-emerald-200 rounded-lg text-xs font-mono font-medium"
                  >
                    ★ {skill}
                  </span>
                ))}
              </div>
            </div>

            {/* Practical Learning Outcomes */}
            <div className="bg-white border border-[#1A1A1A]/15 rounded-2xl p-6 space-y-4">
              <h3 className="text-xs font-mono uppercase tracking-widest text-[#777] border-b border-[#1A1A1A]/10 pb-2 flex items-center gap-2 font-bold">
                <ShieldCheck className="w-4 h-4 text-indigo-600" />
                <span>Engineering Competency Standard</span>
              </h3>
              <p className="text-xs sm:text-sm font-serif leading-relaxed text-[#555]">
                Completing this module satisfies prerequisite requirements for subsequent advanced stages in your personalized curriculum and calibrates your Bayesian Knowledge Tracing estimate.
              </p>
              <div className="p-3 bg-[#F8F7F4] border border-[#1A1A1A]/10 rounded-xl text-xs font-mono text-[#666]">
                💡 Format: <strong className="text-[#1A1A1A]">{resource.format || "Interactive"}</strong> • Difficulty: <strong className="text-[#1A1A1A]">{resource.difficulty}</strong>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Interactive Practice / Knowledge Check */}
        {activeTab === 'practice' && (
          <div className="bg-white border border-[#1A1A1A]/15 rounded-2xl p-6 sm:p-8 space-y-6">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-mono uppercase font-bold">
                <Sparkles className="w-3 h-3 text-amber-600" />
                <span>Interactive Knowledge Checkpoint</span>
              </div>
              <h3 className="text-lg font-serif font-bold text-[#1A1A1A]">
                Self-Assessment: Test your mastery for &quot;{resource.title}&quot;
              </h3>
              <p className="text-xs font-mono text-[#666]">
                Answering correctly reinforces your skill mastery level in BKT without needing an external grade.
              </p>
            </div>

            {/* Sample Knowledge Check Question */}
            <div className="p-5 bg-[#F8F7F4] border border-[#1A1A1A]/15 rounded-xl space-y-4">
              <p className="text-sm font-serif font-semibold text-[#1A1A1A]">
                1. What is the core architectural principle behind mastering {resource.skills_taught?.[0] || resource.title}?
              </p>
              <div className="space-y-2">
                {[
                  "Decomposing complex dependencies into modular, testable, and deterministic units.",
                  "Ignoring prerequisite concepts and memorizing syntax patterns.",
                  "Running code without type safety or runtime validation.",
                  "Relying solely on external abstractions without understanding foundational mechanics."
                ].map((opt, oIdx) => (
                  <button
                    key={oIdx}
                    onClick={() => setSelectedAnswer(oIdx)}
                    className={`w-full text-left p-3 text-xs sm:text-sm font-sans rounded-lg border transition-all cursor-pointer ${
                      selectedAnswer === oIdx
                        ? 'bg-[#1A1A1A] text-white border-[#1A1A1A] font-medium'
                        : 'bg-white text-[#333] border-[#1A1A1A]/15 hover:border-[#1A1A1A]/50'
                    }`}
                  >
                    <span className="font-mono font-bold mr-2 text-[11px] opacity-70">0{oIdx + 1}.</span>
                    <span>{opt}</span>
                  </button>
                ))}
              </div>

              <div className="pt-2 flex items-center justify-between">
                <button
                  onClick={() => setQuizSubmitted(true)}
                  disabled={selectedAnswer === null}
                  className="px-5 py-2 bg-[#1A1A1A] text-white text-xs font-mono uppercase font-bold rounded-lg hover:bg-black disabled:opacity-50 transition-all cursor-pointer"
                >
                  Verify Answer
                </button>
                {quizSubmitted && (
                  <span className="text-xs font-mono text-emerald-700 font-bold flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" />
                    {selectedAnswer === 0 ? "Correct! Concepts verified." : "Review the correct concept: 01."}
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Prerequisites */}
        {activeTab === 'prerequisites' && (
          <div className="bg-white border border-[#1A1A1A]/15 rounded-2xl p-6 space-y-4">
            <h3 className="text-xs font-mono uppercase tracking-widest text-[#777] border-b border-[#1A1A1A]/10 pb-2 font-bold">
              Direct Prerequisite Skills
            </h3>
            {(!resource.prerequisite_skills || resource.prerequisite_skills.length === 0) ? (
              <div className="p-4 bg-emerald-50 text-emerald-900 border border-emerald-200 rounded-xl text-xs font-mono">
                ★ No direct prerequisites required! This is a root foundational module.
              </div>
            ) : (
              <div className="space-y-2">
                {resource.prerequisite_skills.map((prereq, pIdx) => (
                  <div
                    key={pIdx}
                    className="p-3 bg-[#F8F7F4] border border-[#1A1A1A]/10 rounded-xl flex items-center justify-between text-xs font-mono"
                  >
                    <span className="font-bold text-[#1A1A1A]">📌 {prereq}</span>
                    <span className="text-[11px] text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full font-bold">
                      Required Prior
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Next Step CTA */}
        <div className="p-6 bg-[#1A1A1A] text-white rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl">
          <div className="space-y-1 text-center sm:text-left">
            <h4 className="font-serif text-lg font-bold">Ready to continue your journey?</h4>
            <p className="text-xs font-mono text-[#AAA]">
              Return to your interactive DAG visualizer to inspect next recommended actions.
            </p>
          </div>
          <Link
            href="/dashboard"
            className="px-6 py-3 bg-white text-[#1A1A1A] hover:bg-[#F8F7F4] rounded-xl font-mono text-xs uppercase font-bold tracking-wider flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap"
          >
            <span>View Full Roadmap</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </main>

      {/* AI Assistant Modal for this Resource */}
      <AiAssistantModal
        isOpen={aiAssistantOpen}
        onClose={() => setAiAssistantOpen(false)}
        currentGoal={resource.skills_taught?.[0] || resource.title}
        activeModuleTitle={resource.title}
      />
    </div>
  );
}
