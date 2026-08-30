import React from 'react';

type Metrics = {
  totalHours: number;
  estimatedWeeks: number;
  readinessImprovement: string;
  modulesCount: number;
};

export default function PathwayMetricsCard({ metrics }: { metrics: Metrics }) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="bg-blue-50 p-3 rounded text-center">
        <div className="text-2xl font-bold text-blue-700">{metrics.totalHours || 0}</div>
        <div className="text-xs text-blue-600 uppercase font-semibold">Total Hours</div>
      </div>
      
      <div className="bg-green-50 p-3 rounded text-center">
        <div className="text-2xl font-bold text-green-700">{metrics.estimatedWeeks || 0}</div>
        <div className="text-xs text-green-600 uppercase font-semibold">Est. Weeks</div>
      </div>
      
      <div className="bg-purple-50 p-3 rounded text-center">
        <div className="text-2xl font-bold text-purple-700">{metrics.modulesCount || 0}</div>
        <div className="text-xs text-purple-600 uppercase font-semibold">Modules</div>
      </div>
      
      <div className="bg-orange-50 p-3 rounded text-center">
        <div className="text-xl font-bold text-orange-700 mt-1">{metrics.readinessImprovement || '0%'}</div>
        <div className="text-xs text-orange-600 uppercase font-semibold mt-1">Readiness +</div>
      </div>
    </div>
  );
}
