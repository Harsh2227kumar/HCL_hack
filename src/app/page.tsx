import Link from 'next/link';
import { ArrowRight, Brain, Target, Zap } from 'lucide-react';

export default function Home() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center relative overflow-hidden bg-gradient-to-b from-indigo-50/50 to-white">
      {/* Decorative blobs */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
      <div className="absolute top-20 right-10 w-72 h-72 bg-indigo-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
      <div className="absolute -bottom-8 left-40 w-72 h-72 bg-pink-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-4000"></div>

      <section className="mb-20 relative z-10 max-w-4xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-100 text-indigo-700 text-sm font-medium mb-8 border border-indigo-200 shadow-sm">
          <span className="flex h-2 w-2 rounded-full bg-indigo-600 animate-pulse"></span>
          Adaptive Intelligence Engine Active
        </div>
        
        <h1 className="text-6xl md:text-7xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-900 via-purple-800 to-indigo-900 mb-6 tracking-tight drop-shadow-sm">
          Master Your Career Journey
        </h1>
        <p className="text-xl md:text-2xl text-slate-600 max-w-2xl mx-auto mb-10 leading-relaxed font-light">
          Stop guessing. See exactly how ready you are for your dream role with our intelligent, adaptive learning platform.
        </p>
        <Link 
          href="/onboarding" 
          className="group relative inline-flex items-center justify-center px-8 py-4 font-bold text-white transition-all duration-200 bg-gradient-to-r from-indigo-600 to-purple-600 font-pj rounded-xl focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-600 hover:shadow-xl hover:shadow-indigo-500/30 hover:-translate-y-1 overflow-hidden"
        >
          <span className="absolute w-0 h-0 transition-all duration-500 ease-out bg-white rounded-full group-hover:w-56 group-hover:h-56 opacity-10"></span>
          <span className="relative flex items-center gap-2">
            Get Started <ArrowRight className="group-hover:translate-x-1 transition-transform" size={20} />
          </span>
        </Link>
      </section>

      <section className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto w-full relative z-10 px-4">
        {[
          {
            title: "Personalized Path",
            desc: "Adaptive learning routes tailored to your specific goals and current skill level.",
            icon: <Target className="text-indigo-600 w-8 h-8 mb-4" />
          },
          {
            title: "Readiness Score",
            desc: "Measure your exact readiness for the roles you want, down to specific skills.",
            icon: <Brain className="text-purple-600 w-8 h-8 mb-4" />
          },
          {
            title: "AI Mentorship",
            desc: "Chat with our intelligent mentor to get unstuck and learn faster.",
            icon: <Zap className="text-amber-500 w-8 h-8 mb-4" />
          }
        ].map((feature, i) => (
          <div key={i} className="bg-white/70 backdrop-blur-lg p-8 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all hover:-translate-y-1 group">
            <div className="bg-gradient-to-br from-gray-50 to-gray-100 w-16 h-16 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              {feature.icon}
            </div>
            <h3 className="text-xl font-bold mb-3 text-slate-800">{feature.title}</h3>
            <p className="text-slate-600 text-sm leading-relaxed">{feature.desc}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
