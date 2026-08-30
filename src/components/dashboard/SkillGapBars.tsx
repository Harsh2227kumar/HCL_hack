import React from 'react';

type SkillGap = {
  skill: string;
  current: number;
  target: number;
  priority: 'critical' | 'recommended' | 'optional';
};

export default function SkillGapBars({ gaps }: { gaps: SkillGap[] }) {
  return (
    <div className="space-y-4">
      {gaps.map((gap, i) => {
        let barColor = 'bg-green-500';
        if (gap.priority === 'critical') barColor = 'bg-red-500';
        else if (gap.priority === 'recommended') barColor = 'bg-yellow-500';

        const currentPct = (gap.current / gap.target) * 100;
        
        return (
          <div key={i} className="flex flex-col gap-1">
            <div className="flex justify-between text-sm font-medium">
              <span>{gap.skill}</span>
              <span className="text-gray-500">{gap.current} / {gap.target}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5 relative">
              <div
                className={`h-2.5 rounded-full ${barColor}`}
                style={{ width: `${Math.min(currentPct, 100)}%` }}
              ></div>
              <div 
                className="absolute top-0 h-3 w-1 bg-gray-800 -mt-0.5" 
                style={{ left: '100%' }}
                title="Target"
              ></div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
