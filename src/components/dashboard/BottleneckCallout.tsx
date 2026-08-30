import React from 'react';

export default function BottleneckCallout({ bottleneck }: { bottleneck: { skill: string; reason: string } }) {
  return (
    <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r shadow-sm">
      <div className="flex items-center gap-2">
        <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd"></path>
        </svg>
        <h3 className="text-red-800 font-bold">#1 Bottleneck</h3>
      </div>
      <p className="mt-2 text-sm text-red-700 font-semibold">{bottleneck.skill}</p>
      <p className="mt-1 text-sm text-red-600">{bottleneck.reason}</p>
    </div>
  );
}
