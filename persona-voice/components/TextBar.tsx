'use client';

import React, { useState } from 'react';
import { Send, BrainCircuit } from 'lucide-react';
import { useConversationStore } from '@/store/conversation';

interface TextBarProps {
  onSendText: (text: string) => void;
  disabled?: boolean;
}

export function TextBar({ onSendText, disabled }: TextBarProps) {
  const [input, setInput] = useState('');
  const { state, activePersona } = useConversationStore();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || disabled) return;
    onSendText(input.trim());
    setInput('');
  };

  const sampleHints: Record<string, string[]> = {
    'personal-assistant': [
      'When is our demo recording?',
      'Remember that I drink coffee with no sugar',
      'What are our project deadlines?',
    ],
    'shop-assistant': [
      'What is the price of Aashirvaad Atta?',
      'Do you have free delivery?',
      'How much is Amul Milk?',
    ],
    'tamil-companion': [
      'Airport metro first train eppo?',
      'T. Nagar murukku sandwich evlo?',
      'Marina beach closing time enna?',
    ],
  };

  const currentHints = activePersona?.slug ? sampleHints[activePersona.slug] || [] : [];

  return (
    <div className="w-full max-w-xl mx-auto flex flex-col gap-2">
      {/* Quick Prompt Hint Pills */}
      <div className="flex flex-wrap items-center justify-center gap-1.5 overflow-x-auto py-1">
        {currentHints.map((hint, i) => (
          <button
            key={i}
            type="button"
            disabled={disabled || state === 'listening' || state === 'thinking'}
            onClick={() => onSendText(hint)}
            className="text-[11px] px-2.5 py-1 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white transition-all duration-200 truncate max-w-xs cursor-pointer disabled:opacity-50"
          >
            {hint.startsWith('Remember that') && <BrainCircuit className="w-2.5 h-2.5 inline mr-1 text-purple-400" />}
            {hint}
          </button>
        ))}
      </div>

      {/* Input Form */}
      <form
        onSubmit={handleSubmit}
        className="relative flex items-center w-full bg-slate-900/60 border border-white/10 rounded-2xl p-1.5 backdrop-blur-xl shadow-xl focus-within:border-indigo-500/60 transition-colors"
      >
        <input
          type="text"
          value={input}
          disabled={disabled || state === 'listening' || state === 'thinking'}
          onChange={(e) => setInput(e.target.value)}
          placeholder={`Or type a message to ${activePersona?.name || 'assistant'}...`}
          className="flex-1 bg-transparent px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none disabled:opacity-50"
        />

        <button
          type="submit"
          disabled={!input.trim() || disabled || state === 'listening' || state === 'thinking'}
          aria-label="Send message"
          className="p-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-40 disabled:hover:bg-indigo-600 transition-colors shadow-md"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}
