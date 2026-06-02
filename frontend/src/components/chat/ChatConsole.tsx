import React, { useState, useRef, useEffect } from 'react';
import { useTacticalStore } from '../../stores/useTacticalStore';

const ChatConsole: React.FC = () => {
  const { conversation, isLoading, askQuestion, detectedLevel, followUpSuggestions } = useTacticalStore();
  const [input, setInput] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    askQuestion(input.trim());
    setInput('');
  };

  const handleSuggestionClick = (prompt: string) => {
    if (isLoading) return;
    askQuestion(prompt);
  };

  // Scroll to bottom on new messages
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversation, isLoading]);

  return (
    <div className="flex flex-col h-full glass-panel rounded-2xl border border-pitch-border overflow-hidden">
      {/* Console Header */}
      <div className="px-4 py-3 bg-pitch-card border-b border-pitch-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-pitch-neonCyan shadow-glow-cyan" />
          <h2 className="font-display font-semibold text-sm tracking-wide text-slate-200">
            Granite Tactical Tutor
          </h2>
        </div>
        <div className="px-2 py-0.5 rounded-md bg-pitch-surface border border-slate-700/50 flex items-center gap-1.5">
          <span className="text-[10px] text-slate-400 font-semibold uppercase">Level:</span>
          <span className="text-[10px] font-bold text-pitch-neonAmber uppercase">
            {detectedLevel}
          </span>
        </div>
      </div>

      {/* Message Feed */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-[220px]">
        {conversation.map((msg, i) => (
          <div
            key={i}
            className={`flex flex-col max-w-[85%] ${
              msg.role === 'user' ? 'ml-auto items-end' : 'mr-auto items-start'
            }`}
          >
            <span className="text-[10px] font-semibold text-slate-500 mb-1 px-1 capitalize">
              {msg.role === 'user' ? 'You' : 'Granite AI'}
            </span>
            <div
              className={`px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-pitch-neonCyan text-pitch-dark rounded-tr-none font-medium'
                  : 'bg-pitch-surface text-slate-200 border border-slate-800 rounded-tl-none'
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex flex-col max-w-[85%] mr-auto items-start">
            <span className="text-[10px] font-semibold text-slate-500 mb-1 px-1">Granite AI</span>
            <div className="px-4 py-3 rounded-2xl bg-pitch-surface text-slate-400 border border-slate-800 rounded-tl-none flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Suggested Prompts */}
      <div className="px-4 py-2 border-t border-pitch-border bg-slate-900/30 flex flex-wrap gap-1.5 max-h-[85px] overflow-y-auto">
        {followUpSuggestions.map((prompt, i) => (
          <button
            key={i}
            onClick={() => handleSuggestionClick(prompt)}
            disabled={isLoading}
            className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-pitch-surface/60 border border-slate-800 hover:border-pitch-neonCyan hover:text-pitch-neonCyan transition-all disabled:opacity-50"
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* Console Input Footer */}
      <form onSubmit={handleSubmit} className="p-3 bg-pitch-card border-t border-pitch-border flex items-center gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask Granite about player movements..."
          disabled={isLoading}
          className="flex-1 h-10 px-4 py-2 rounded-xl text-sm font-sans glass-input text-slate-100 disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={isLoading || !input.trim()}
          className="h-10 px-4 rounded-xl bg-pitch-neonCyan text-pitch-dark font-display font-bold text-xs uppercase hover:brightness-110 active:scale-95 transition-all disabled:opacity-50 disabled:scale-100"
        >
          Send
        </button>
      </form>
    </div>
  );
};

export default ChatConsole;
