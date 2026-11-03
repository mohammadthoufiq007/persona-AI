'use client';

import React, { useState } from 'react';
import { useConversationStore } from '@/store/conversation';
import { Activity } from 'lucide-react';

export function TelemetryPill() {
  const { latency } = useConversationStore();
  const [visible, setVisible] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return new URLSearchParams(window.location.search).get('debug') === '1';
    }
    return false;
  });

  if (!visible && (!latency.stt && !latency.rag && !latency.llm)) {
    return (
      <button
        type="button"
        onClick={() => setVisible(!visible)}
        title="Toggle latency telemetry"
        className="text-[11px] text-slate-500 hover:text-slate-300 flex items-center gap-1 transition-colors px-2 py-0.5 rounded border border-white/5 bg-white/5"
      >
        <Activity className="w-3 h-3 text-slate-400" />
        <span>Telemetry</span>
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900/90 border border-slate-700/60 text-[11px] font-mono text-slate-300 shadow-xl backdrop-blur-md">
      <Activity className="w-3 h-3 text-indigo-400 animate-pulse" />
      <span>STT: <b className="text-white">{latency.stt ?? 0}ms</b></span>
      <span className="text-slate-600">|</span>
      <span>RAG: <b className="text-white">{latency.rag ?? 0}ms</b></span>
      <span className="text-slate-600">|</span>
      <span>LLM: <b className="text-white">{latency.llm ?? 0}ms</b></span>
      <span className="text-slate-600">|</span>
      <span>TTS: <b className="text-white">{latency.tts ?? 0}ms</b></span>
      <button
        type="button"
        onClick={() => setVisible(false)}
        className="ml-1 text-slate-500 hover:text-slate-300 text-xs"
      >
        ×
      </button>
    </div>
  );
}
