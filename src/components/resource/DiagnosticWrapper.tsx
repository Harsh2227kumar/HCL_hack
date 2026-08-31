'use client';
import { useState } from 'react';
import DiagnosticModal from './DiagnosticModal';

interface DiagnosticWrapperProps {
  skillsTaught: string[];
}

export default function DiagnosticWrapper({ skillsTaught }: DiagnosticWrapperProps) {
  const [showModal, setShowModal] = useState(false);
  const [targetSkill, setTargetSkill] = useState('');

  const handleOpen = () => {
    if (skillsTaught && skillsTaught.length > 0) {
      setTargetSkill(skillsTaught[0]); // Just pick the first skill for the demo
      setShowModal(true);
    } else {
      alert("No specific skill listed for this resource to test.");
    }
  };

  const handleComplete = (level: number) => {
    setShowModal(false);
    // In a real app, this might trigger a re-plan or refresh
  };

  return (
    <div className="bg-blue-50 p-6 rounded-xl border border-blue-100 shadow-sm">
      <h3 className="text-xl font-bold mb-2 text-blue-900">Diagnostic Check</h3>
      <p className="text-sm text-blue-800 mb-6 leading-relaxed">
        Not sure if you need this? Take a quick diagnostic to assess your current knowledge level and see if you can skip ahead.
      </p>
      <button 
        onClick={handleOpen}
        className="w-full bg-blue-600 text-white font-semibold py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
      >
        Take Diagnostic
      </button>

      {showModal && (
        <DiagnosticModal 
          skillName={targetSkill}
          userId={localStorage.getItem('userId') || 'anonymous'}
          onClose={() => setShowModal(false)}
          onComplete={handleComplete}
        />
      )}
    </div>
  );
}
