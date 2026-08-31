'use client';
import { useState } from 'react';
import ProgressToggle from './ProgressToggle';
import DecisionTraceModal from './DecisionTraceModal';

interface Resource {
  id: string;
  title: string;
  type?: string;
  difficulty?: string | number;
  duration?: number;
  durationHours?: number | null;
}

interface ResourceCardProps {
  resource: Resource;
  status?: string;
  reason?: string;
  trace?: any;
}

export default function ResourceCard({ resource, status = 'pending', reason, trace }: ResourceCardProps) {
  const [showReason, setShowReason] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const displayDuration = resource.durationHours 
    ? `${resource.durationHours} hrs` 
    : (resource.duration ? `${resource.duration} mins` : 'Self-paced');

  return (
    <div className="border rounded-lg p-4 shadow-sm bg-white text-black">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-lg font-semibold">{resource.title}</h3>
          <p className="text-sm text-gray-500">
            {resource.type || 'Resource'} • Level {resource.difficulty ?? 1} • {displayDuration}
          </p>
        </div>
        <ProgressToggle resourceId={resource.id} currentStatus={status} />
      </div>

      {reason && (
        <div className="mt-4">
          <button
            onClick={() => setShowReason(!showReason)}
            className="text-blue-600 text-sm hover:underline"
          >
            {showReason ? 'Hide Why this?' : 'Why this?'}
          </button>
          {showReason && (
            <div className="mt-2 text-sm text-gray-700 bg-gray-50 p-3 rounded border border-gray-100">
              <p>{reason}</p>
              <button
                onClick={() => setIsModalOpen(true)}
                className="block mt-3 text-indigo-600 text-xs font-semibold hover:underline"
              >
                View Decision Trace &rarr;
              </button>
            </div>
          )}
        </div>
      )}

      {isModalOpen && (
        <DecisionTraceModal
          resourceId={resource.id}
          userId="current-user"
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </div>
  );
}
