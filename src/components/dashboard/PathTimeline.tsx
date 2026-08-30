import React from 'react';
import ResourceCard from '@/components/resource/ResourceCard';

type Phase = {
  id: string;
  title: string;
  resources: any[];
};

export default function PathTimeline({ phases }: { phases: Phase[] }) {
  if (!phases.length) {
    return <div className="text-gray-500">No phases generated yet.</div>;
  }

  return (
    <div className="relative border-l-2 border-indigo-200 ml-4 space-y-8 pb-4">
      {phases.map((phase) => (
        <div key={phase.id} className="relative pl-6">
          {/* Timeline dot */}
          <div className="absolute -left-2 top-1 w-4 h-4 bg-indigo-500 rounded-full border-4 border-white"></div>
          
          <h3 className="text-xl font-semibold mb-4 text-gray-800">{phase.title}</h3>
          
          <div className="grid gap-4 sm:grid-cols-1 xl:grid-cols-2">
            {phase.resources.map((res: any, idx: number) => (
              <ResourceCard key={idx} resource={res} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
