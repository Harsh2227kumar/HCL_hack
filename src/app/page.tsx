import Link from 'next/link';

export default function Home() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
      <section className="mb-16">
        <h1 className="text-5xl font-extrabold text-zinc-900 mb-6">
          Master Your Career Journey
        </h1>
        <p className="text-xl text-zinc-600 max-w-2xl mx-auto mb-8">
          See how ready you are for your dream role with our intelligent adaptive learning platform.
        </p>
        <Link 
          href="/onboarding" 
          className="inline-block bg-indigo-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-indigo-700 transition-colors"
        >
          Get Started
        </Link>
      </section>

      <section className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto w-full">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-zinc-100">
          <h3 className="text-lg font-semibold mb-2">Personalized Path</h3>
          <p className="text-zinc-600 text-sm">Adaptive learning routes tailored to your specific goals and current skill level.</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-zinc-100">
          <h3 className="text-lg font-semibold mb-2">Readiness Score</h3>
          <p className="text-zinc-600 text-sm">Measure your exact readiness for the roles you want, down to specific skills.</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-zinc-100">
          <h3 className="text-lg font-semibold mb-2">AI Mentorship</h3>
          <p className="text-zinc-600 text-sm">Chat with our intelligent mentor to get unstuck and learn faster.</p>
        </div>
      </section>
    </div>
  );
}
