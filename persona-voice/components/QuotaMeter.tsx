'use client';

import React from 'react';
import { useConversationStore } from '@/store/conversation';
import { ShieldCheck } from 'lucide-react';

export function QuotaMeter() {
  const { quotaLeft } = useConversationStore();

  return (
    <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs text-slate-400 backdrop-blur-md">
      <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
      <span>{quotaLeft} demo turns remaining</span>
    </div>
  );
}
