'use client';
import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';

interface DiagnosticModalProps {
  skillName: string;
  userId: string;
  onClose: () => void;
  onComplete: (newLevel: number) => void;
}

export default function DiagnosticModal({ skillName, userId, onClose, onComplete }: DiagnosticModalProps) {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [diagnostic, setDiagnostic] = useState<any>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [result, setResult] = useState<any>(null);

  useEffect(() => {
    const fetchQuiz = async () => {
      try {
        const res = await fetch('/api/diagnostic/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId, skillName })
        });
        const data = await res.json();
        setDiagnostic(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchQuiz();
  }, [userId, skillName]);

  const handleSubmit = async () => {
    if (!diagnostic || Object.keys(answers).length !== diagnostic.questions.length) return;
    setSubmitting(true);
    try {
      const payload = {
        userId,
        skillName,
        answers: Object.entries(answers).map(([qId, ans]) => ({ questionId: qId, selectedAnswer: ans }))
      };
      const res = await fetch('/api/diagnostic/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      setResult(data);
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl p-8 max-w-2xl w-full text-black shadow-2xl relative overflow-hidden">
        {/* Decorative background element */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-100 rounded-full mix-blend-multiply filter blur-3xl opacity-50 transform translate-x-1/2 -translate-y-1/2"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-100 rounded-full mix-blend-multiply filter blur-3xl opacity-50 transform -translate-x-1/2 translate-y-1/2"></div>
        
        <div className="relative z-10">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">
              Skill Diagnostic: {skillName}
            </h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-800 transition-colors bg-gray-100 hover:bg-gray-200 rounded-full p-2">
              &times;
            </button>
          </div>
          
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 gap-4 text-indigo-600">
              <Loader2 className="animate-spin" size={40} />
              <p className="font-medium text-gray-600">Generating adaptive questions...</p>
            </div>
          ) : result ? (
            <div className="py-8 text-center space-y-6">
              <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-4xl">🎉</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-800">Diagnostic Complete</h3>
              <p className="text-lg text-gray-600">Your assessed level is:</p>
              <div className="text-5xl font-black text-indigo-600 my-4">{result.observedLevel}<span className="text-2xl text-gray-400">/5</span></div>
              {result.mismatchDetected && (
                <p className="text-sm text-yellow-600 bg-yellow-50 p-3 rounded-lg inline-block">
                  Note: This differs significantly from your self-reported level. Your learning path will adapt accordingly.
                </p>
              )}
              <button 
                onClick={() => onComplete(result.observedLevel)}
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 rounded-xl font-semibold hover:shadow-lg hover:shadow-indigo-500/30 transition-all transform hover:-translate-y-0.5"
              >
                Continue
              </button>
            </div>
          ) : diagnostic ? (
            <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
              {diagnostic.questions.map((q: any, i: number) => (
                <div key={q.id} className="bg-gray-50 border border-gray-100 rounded-xl p-5 shadow-sm transition-all hover:shadow-md">
                  <p className="font-semibold text-gray-800 mb-4 flex gap-3">
                    <span className="bg-indigo-100 text-indigo-700 w-6 h-6 flex items-center justify-center rounded-full text-xs shrink-0">{i+1}</span>
                    {q.text}
                  </p>
                  <div className="space-y-3 pl-9">
                    {q.options.map((opt: string, j: number) => (
                      <label key={j} className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${answers[q.id] === opt ? 'bg-indigo-50 border-indigo-300 ring-1 ring-indigo-500' : 'bg-white border-gray-200 hover:border-indigo-200 hover:bg-gray-50'}`}>
                        <input 
                          type="radio" 
                          name={q.id} 
                          value={opt} 
                          checked={answers[q.id] === opt}
                          onChange={() => setAnswers(prev => ({...prev, [q.id]: opt}))}
                          className="text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                        />
                        <span className="text-gray-700 text-sm">{opt}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
              
              <button 
                onClick={handleSubmit}
                disabled={submitting || Object.keys(answers).length !== diagnostic.questions.length}
                className="w-full mt-6 bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg hover:shadow-indigo-500/30 transition-all flex items-center justify-center gap-2"
              >
                {submitting ? <><Loader2 className="animate-spin" size={18} /> Analyzing...</> : 'Submit Answers'}
              </button>
            </div>
          ) : (
            <p className="text-red-500 text-center py-8">Failed to load diagnostic.</p>
          )}
        </div>
      </div>
    </div>
  );
}
