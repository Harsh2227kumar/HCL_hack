import React from 'react';

export default function ReadinessGauge({ readinessScore }: { readinessScore: number }) {
  const percentage = Math.round(readinessScore * 100);
  
  let colorClass = 'text-green-500';
  let strokeClass = 'stroke-green-500';
  if (readinessScore < 0.3) {
    colorClass = 'text-red-500';
    strokeClass = 'stroke-red-500';
  } else if (readinessScore <= 0.7) {
    colorClass = 'text-yellow-500';
    strokeClass = 'stroke-yellow-500';
  }

  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (readinessScore * circumference);

  return (
    <div className="flex flex-col items-center justify-center">
      <div className="relative w-24 h-24">
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
          <circle
            className="text-gray-200 stroke-current"
            strokeWidth="8"
            cx="50"
            cy="50"
            r={radius}
            fill="transparent"
          ></circle>
          <circle
            className={`${strokeClass} transition-all duration-1000 ease-out`}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            cx="50"
            cy="50"
            r={radius}
            fill="transparent"
          ></circle>
        </svg>
        <div className="absolute top-0 left-0 w-full h-full flex flex-col items-center justify-center">
          <span className={`text-2xl font-bold ${colorClass}`}>{percentage}%</span>
        </div>
      </div>
      <p className="mt-2 text-sm text-gray-600 font-medium">Readiness Score</p>
    </div>
  );
}
