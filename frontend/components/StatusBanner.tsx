'use client';

import React from 'react';
import { Mic, Loader2, Volume2, Sparkles, AlertCircle, RefreshCw } from 'lucide-react';
import { BotState } from '@/lib/types';

interface StatusBannerProps {
  state: BotState;
  audioLevel?: number; // 0..1 for listening
  error?: string | null;
  onRetry?: () => void;
  onStop?: () => void;
  languageLabel: string;
}

export function StatusBanner({
  state,
  audioLevel = 0,
  error,
  onRetry,
  onStop,
  languageLabel,
}: StatusBannerProps) {
  // If an error is active, show the prominent error toast / banner
  if (error) {
    return (
      <div
        role="alert"
        aria-live="assertive"
        className="w-full max-w-lg mx-auto z-30 mb-2 px-4 py-2.5 rounded-2xl bg-rose-500/15 border border-rose-500/40 backdrop-blur-xl shadow-2xl flex items-center justify-between gap-3 text-rose-200 animate-in fade-in slide-in-from-top-2"
      >
        <div className="flex items-center gap-2 text-xs">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          <span className="font-medium">{error}</span>
        </div>
        {onRetry && (
          <button
            onClick={onRetry}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-white text-xs font-semibold border border-rose-500/30 transition-all shrink-0 active:scale-95 cursor-pointer"
          >
            <RefreshCw className="w-3 h-3" />
            Retry
          </button>
        )}
      </div>
    );
  }

  // Active status indicators with ARIA live region for screen readers
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex items-center justify-center pointer-events-auto"
    >
      {state === 'idle' && (
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/[0.04] border border-white/10 text-xs text-white/90 backdrop-blur-md">
          <span className="w-2 h-2 rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)] animate-pulse" />
          <span>Tap Orb to speak ({languageLabel})</span>
        </div>
      )}

      {state === 'listening' && (
        <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-white/10 border border-white/20 text-xs text-white shadow-[0_0_20px_rgba(255,255,255,0.15)] backdrop-blur-md animate-pulse">
          <Mic className="w-3.5 h-3.5 text-white animate-bounce" />
          <span className="font-medium text-white">Listening…</span>

          {/* Dynamic Audio Level Meter Bars */}
          <div className="flex items-center gap-0.5 h-3">
            {[0.2, 0.4, 0.6, 0.8, 1.0].map((threshold, idx) => {
              const active = (audioLevel || 0.1) >= threshold * 0.5;
              const height = active ? Math.max(4, Math.round((audioLevel || 0.2) * 12)) : 3;
              return (
                <span
                  key={idx}
                  className={`w-0.5 rounded-full transition-all duration-75 ${
                    active ? 'bg-white' : 'bg-white/20'
                  }`}
                  style={{ height: `${height}px` }}
                />
              );
            })}
          </div>

          {onStop && (
            <button
              onClick={onStop}
              className="ml-1 text-[11px] underline text-white/80 hover:text-white cursor-pointer"
            >
              Stop (Esc)
            </button>
          )}
        </div>
      )}

      {state === 'transcribing' && (
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/20 border border-amber-400/40 text-xs text-amber-200 backdrop-blur-md shadow-[0_0_15px_rgba(245,158,11,0.25)]">
          <Loader2 className="w-3.5 h-3.5 text-amber-400 animate-spin" />
          <span className="font-medium">Transcribing speech…</span>
        </div>
      )}

      {state === 'thinking' && (
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-purple-500/20 border border-purple-400/40 text-xs text-purple-200 backdrop-blur-md shadow-[0_0_15px_rgba(168,85,247,0.25)]">
          <Sparkles className="w-3.5 h-3.5 text-purple-400 animate-spin" />
          <span className="font-medium">Thinking…</span>
        </div>
      )}

      {state === 'speaking' && (
        <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-emerald-500/20 border border-emerald-400/50 text-xs text-emerald-200 backdrop-blur-md shadow-[0_0_20px_rgba(16,185,129,0.3)]">
          <Volume2 className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
          <span className="font-medium">Speaking…</span>
          <span className="text-[10px] opacity-70">(Tap Orb to interrupt)</span>
        </div>
      )}
    </div>
  );
}
