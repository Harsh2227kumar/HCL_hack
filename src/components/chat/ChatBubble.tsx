export default function ChatBubble({ message, sender }: { message: string, sender: 'user' | 'ai' }) {
  const isUser = sender === 'user';
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div 
        className={`max-w-[75%] px-4 py-2 rounded-2xl ${
          isUser 
            ? 'bg-indigo-600 text-white rounded-br-none' 
            : 'bg-zinc-200 text-zinc-900 rounded-bl-none'
        }`}
      >
        {message}
      </div>
    </div>
  );
}
