'use client';

import React, { useState } from 'react';
import { Shield, X } from 'lucide-react';

export function PrivacyBanner() {
  const [dismissed, setDismissed] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return !!localStorage.getItem('pv_privacy_dismissed');
    }
    return true;
  });

  const handleDismiss = () => {
    setDismissed(true);
    if (typeof window !== 'undefined') {
      localStorage.setItem('pv_privacy_dismissed', '1');
    }
  };

  if (dismissed) return null;

  return (
    <div className="w-full max-w-xl mx-auto mb-4 px-4 py-2.5 rounded-xl bg-slate-900/80 border border-slate-700/50 backdrop-blur-md flex items-center justify-between text-xs text-slate-300 shadow-md">
      <div className="flex items-center gap-2 pr-2">
        <Shield className="w-4 h-4 text-indigo-400 shrink-0" />
        <span>
          PersonaVoice processes voice in real time via Gnani AI. Audio is never stored permanently.
        </span>
      </div>
      <button
        type="button"
        onClick={handleDismiss}
        aria-label="Dismiss privacy note"
        className="text-slate-400 hover:text-white p-1 rounded transition-colors"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
