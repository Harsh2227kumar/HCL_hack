import { notFound } from 'next/navigation';
import { PrismaClient } from '@prisma/client';

// Usually instantiated in a lib/prisma.ts file to avoid multiple instances in dev,
// but placed here as requested for direct usage if no global exists.
const prisma = new PrismaClient();

export default async function CourseDetailPage({ params }: { params: { id: string } }) {
  let resource;
  
  try {
    resource = await prisma.learningResource.findUnique({
      where: { id: params.id },
      // Prisma doesn't have 'skills' or 'prereqs' relations on LearningResource since they are Json arrays
    });
  } catch (error) {
    console.error('Failed to fetch resource from DB:', error);
  }

  if (!resource) {
    notFound();
  }

  return (
    <div className="max-w-5xl mx-auto p-6 bg-white text-black min-h-screen font-sans">
      <header className="mb-8 border-b border-gray-200 pb-6">
        <h1 className="text-4xl font-extrabold text-gray-900 mb-3">{resource.title}</h1>
        <div className="flex flex-wrap gap-3 text-sm">
          <span className="bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full font-medium">
            Difficulty: {resource.difficulty}
          </span>
          <span className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full font-medium">
            Duration: {resource.durationHours ? `${resource.durationHours} hrs` : 'Self-paced'}
          </span>
        </div>
      </header>

      <main className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Main Content Area */}
        <div className="lg:col-span-2 space-y-8">
          <section>
            <h2 className="text-2xl font-bold mb-4 text-gray-800">About this Resource</h2>
            <div className="text-gray-600 leading-relaxed text-lg">
              {resource.description || 'No description provided.'}
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4 text-gray-800">Skills Taught</h2>
            {resource.skillsTaught && (resource.skillsTaught as string[]).length > 0 ? (
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {(resource.skillsTaught as string[]).map((skillName: string, idx: number) => (
                  <li key={idx} className="flex items-center text-gray-700 bg-gray-50 p-3 rounded-lg border border-gray-100">
                    <svg className="w-5 h-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                    {skillName}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500 italic">No specific skills listed.</p>
            )}
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4 text-gray-800">Prerequisites</h2>
            {resource.prerequisiteSkills && (resource.prerequisiteSkills as string[]).length > 0 ? (
              <ul className="space-y-3 text-gray-700">
                {(resource.prerequisiteSkills as string[]).map((prereq: string, idx: number) => (
                  <li key={idx} className="flex items-start">
                    <span className="flex-shrink-0 h-6 w-6 flex items-center justify-center rounded-full bg-yellow-100 text-yellow-600 mr-3 text-sm font-bold">!</span>
                    <span className="pt-0.5">{prereq}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500 italic">No prerequisites required.</p>
            )}
          </section>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <div className="bg-blue-50 p-6 rounded-xl border border-blue-100 shadow-sm">
            <h3 className="text-xl font-bold mb-2 text-blue-900">Diagnostic Check</h3>
            <p className="text-sm text-blue-800 mb-6 leading-relaxed">
              Not sure if you need this? Take a quick diagnostic to assess your current knowledge level and see if you can skip ahead.
            </p>
            <button className="w-full bg-blue-600 text-white font-semibold py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors shadow-sm">
              Take Diagnostic
            </button>
          </div>

          <div className="bg-gray-50 p-6 rounded-xl border border-gray-200 shadow-sm">
            <h3 className="text-xl font-bold mb-2 text-gray-900">Alternative Paths</h3>
            <p className="text-sm text-gray-600 mb-6 leading-relaxed">
              Everyone learns differently. Compare this resource with alternative formats (like videos, articles, or interactive exercises) that teach the same concepts.
            </p>
            <button className="w-full bg-white border border-gray-300 text-gray-700 font-semibold py-3 px-4 rounded-lg hover:bg-gray-50 transition-colors shadow-sm">
              Compare Alternatives
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
