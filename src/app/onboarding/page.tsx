'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import ChatBubble from '@/components/chat/ChatBubble';
import ChatInput from '@/components/chat/ChatInput';
import QuickReplyChips from '@/components/chat/QuickReplyChips';

type Message = {
  id: string;
  sender: 'user' | 'ai';
  text: string;
};

export default function OnboardingPage() {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([
    { id: '1', sender: 'ai', text: 'Hi! Let\'s get started. What role are you aiming for?' }
  ]);
  const [isLoading, setIsLoading] = useState(false);

  const handleSendMessage = async (text: string) => {
    if (!text.trim()) return;

    const newUserMsg: Message = { id: Date.now().toString(), sender: 'user', text };
    const newMessages = [...messages, newUserMsg];
    setMessages(newMessages);
    setIsLoading(true);

    try {
      let currentUserId = localStorage.getItem('userId');
      if (!currentUserId) {
        currentUserId = `user-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        localStorage.setItem('userId', currentUserId);
      }

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          userId: currentUserId,
          message: text,
          conversationHistory: messages.map(m => ({ role: m.sender === 'user' ? 'user' : 'assistant', content: m.text }))
        }),
      });
      
      const data = await res.json();
      
      if (data.done) {
        // Generate or retrieve a dynamic user ID
        let currentUserId = localStorage.getItem('userId');
        if (!currentUserId) {
          currentUserId = `user-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
          localStorage.setItem('userId', currentUserId);
        }

        await fetch('/api/profile/extract', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            userId: currentUserId, 
            text: newMessages.map(m => `${m.sender}: ${m.text}`).join('\n') 
          }),
        });

        // Generate the learning path
        await fetch('/api/path/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: currentUserId }),
        });

        router.push('/dashboard');
        return;
      }

      setMessages([...newMessages, { 
        id: (Date.now() + 1).toString(), 
        sender: 'ai', 
        text: data.message || 'Tell me more.' 
      }]);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-zinc-50 max-w-3xl w-full mx-auto h-[calc(100vh-4rem)] shadow-sm border-x border-zinc-200 relative overflow-hidden">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((m) => (
          <ChatBubble key={m.id} message={m.text} sender={m.sender} />
        ))}
        {isLoading && (
          <div className="text-zinc-400 text-sm ml-2">AI is typing...</div>
        )}
      </div>
      
      <div className="p-4 bg-white border-t border-zinc-200">
        <QuickReplyChips 
          options={['Frontend Developer', 'Backend Developer', 'Data Scientist']} 
          onSelect={handleSendMessage} 
        />
        <div className="mt-3">
          <ChatInput onSend={handleSendMessage} disabled={isLoading} />
        </div>
      </div>
    </div>
  );
}
