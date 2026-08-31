'use client';
import { useState, useRef, useEffect } from 'react';
import ChatBubble from './ChatBubble';
import { MessageCircle, X, Send, Loader2 } from 'lucide-react';

export default function FloatingAdvisor() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{role: 'user'|'ai', content: string}[]>([
    { role: 'ai', content: "Hi! I'm your AI Learning Assistant. Need help understanding a concept or choosing your next course?" }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOpen]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    
    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setIsLoading(true);

    try {
      const currentUserId = localStorage.getItem('userId') || 'anonymous';
      const res = await fetch('/api/advisor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUserId,
          message: userMsg,
          conversationHistory: messages
        })
      });
      
      const data = await res.json();
      if (data.message) {
        setMessages(prev => [...prev, { role: 'ai', content: data.message }]);
      } else {
        setMessages(prev => [...prev, { role: 'ai', content: "Sorry, I had trouble processing that." }]);
      }
    } catch (error) {
      setMessages(prev => [...prev, { role: 'ai', content: "Oops, something went wrong connecting to my brain." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Floating Button */}
      <button 
        onClick={() => setIsOpen(true)}
        className={\`fixed bottom-6 right-6 p-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-full shadow-2xl hover:shadow-indigo-500/50 transition-all duration-300 transform hover:scale-110 z-40 \${isOpen ? 'opacity-0 scale-0 pointer-events-none' : 'opacity-100 scale-100'}\`}
      >
        <MessageCircle size={28} />
      </button>

      {/* Chat Window */}
      <div className={\`fixed bottom-6 right-6 w-96 h-[32rem] bg-white/80 backdrop-blur-xl border border-white/40 shadow-[0_8px_30px_rgb(0,0,0,0.12)] rounded-2xl flex flex-col z-50 transition-all duration-300 transform origin-bottom-right \${isOpen ? 'scale-100 opacity-100' : 'scale-0 opacity-0 pointer-events-none'}\`}>
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-gray-200/50 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-t-2xl">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold shadow-inner">
              AI
            </div>
            <div>
              <h3 className="font-semibold text-gray-800">Learning Advisor</h3>
              <p className="text-xs text-indigo-600 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                Online
              </p>
            </div>
          </div>
          <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-gray-600 hover:bg-white/50 p-1.5 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((msg, idx) => (
             <div key={idx} className={\`flex \${msg.role === 'user' ? 'justify-end' : 'justify-start'}\`}>
               <div className={\`max-w-[85%] rounded-2xl p-3 shadow-sm \${msg.role === 'user' ? 'bg-gradient-to-br from-indigo-600 to-purple-600 text-white rounded-br-none' : 'bg-white border border-gray-100 text-gray-800 rounded-bl-none'}\`}>
                  <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
               </div>
             </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
               <div className="bg-white border border-gray-100 rounded-2xl rounded-bl-none p-4 shadow-sm flex items-center gap-2 text-indigo-600">
                  <Loader2 className="animate-spin" size={16} />
                  <span className="text-xs font-medium">Thinking...</span>
               </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-4 border-t border-gray-200/50 bg-white/50 rounded-b-2xl">
          <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="flex items-center gap-2 relative">
            <input 
              type="text" 
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Ask me anything..." 
              className="flex-1 py-3 px-4 pr-12 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 bg-white shadow-inner text-sm transition-all"
            />
            <button 
              type="submit" 
              disabled={!input.trim() || isLoading}
              className="absolute right-2 p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg disabled:opacity-50 transition-colors"
            >
              <Send size={18} />
            </button>
          </form>
        </div>
      </div>
    </>
  );
}
