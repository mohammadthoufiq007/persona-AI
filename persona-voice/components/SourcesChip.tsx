'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useConversationStore } from '@/store/conversation';
import { FileText, CheckCircle2 } from 'lucide-react';

export function SourcesChip() {
  const { sources } = useConversationStore();

  if (!sources || sources.length === 0) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -4 }}
        className="flex flex-wrap items-center justify-center gap-2 mt-3 select-none"
      >
        <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold flex items-center gap-1">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          Grounding Sources:
        </span>
        {sources.slice(0, 2).map((src, idx) => (
          <div
            key={idx}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-medium shadow-sm backdrop-blur-md"
          >
            <FileText className="w-3 h-3 text-indigo-400" />
            <span className="capitalize">{src.title}</span>
            <span className="text-[10px] px-1 py-0.2 rounded bg-indigo-500/20 text-indigo-200">
              {Math.round(src.similarity * 100)}% match
            </span>
          </div>
        ))}
      </motion.div>
    </AnimatePresence>
  );
}
