'use client';
import { useEffect, useState } from 'react';

interface TraceData {
  steps: { step: string; score: number }[];
  confidence: number;
}

interface DecisionTraceModalProps {
  resourceId: string;
  userId: string;
  onClose: () => void;
}

export default function DecisionTraceModal({ resourceId, userId, onClose }: DecisionTraceModalProps) {
  const [traceData, setTraceData] = useState<TraceData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTrace = async () => {
      try {
        const res = await fetch(`/api/explain/trace?resourceId=${resourceId}&userId=${userId}`);
        if (res.ok) {
          const data = await res.json();
          setTraceData(data);
        } else {
          console.error('API returned an error:', await res.text());
        }
      } catch (error) {
        console.error('Failed to fetch trace', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchTrace();
  }, [resourceId, userId]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full text-black shadow-xl">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Decision Trace</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">&times;</button>
        </div>
        
        {loading ? (
          <div className="flex justify-center p-4">
            <p className="text-gray-500">Loading trace data...</p>
          </div>
        ) : traceData ? (
          <div>
            <div className="mb-4 p-3 bg-blue-50 border border-blue-100 rounded">
              <p className="text-sm text-blue-900">
                <strong className="font-semibold">Overall Match Confidence:</strong>{' '}
                {(traceData.confidence * 100).toFixed(1)}%
              </p>
            </div>
            
            <h3 className="text-sm font-semibold mb-2 text-gray-700">Evaluation Steps:</h3>
            <ul className="space-y-2 max-h-60 overflow-y-auto">
              {traceData.steps.map((step, idx) => (
                <li key={idx} className="bg-gray-50 p-3 rounded border border-gray-100 flex flex-col gap-1">
                  <span className="text-sm font-medium text-gray-800">{step.step}</span>
                  <span className="text-xs text-green-600 font-mono">Score: {step.score.toFixed(2)}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <p className="text-red-500 text-sm">Failed to load trace data.</p>
        )}
        
        <button
          onClick={onClose}
          className="mt-6 w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors"
        >
          Close
        </button>
      </div>
    </div>
  );
}
