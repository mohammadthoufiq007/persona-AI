'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useConversationStore } from '@/store/conversation';
import { User, Sparkles } from 'lucide-react';

export function LiveCaptions() {
  const { transcript, reply, state, activePersona } = useConversationStore();

  return (
    <div className="w-full max-w-2xl px-4 min-h-[140px] flex flex-col justify-end items-center text-center">
      {/* User Transcript Line */}
      <AnimatePresence>
        {transcript && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex items-center gap-2 mb-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-slate-300 text-sm max-w-xl backdrop-blur-md"
          >
            <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="italic truncate">&ldquo;{transcript}&rdquo;</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Assistant Spoken Captions */}
      <div
        aria-live="polite"
        className="w-full min-h-[64px] flex items-center justify-center"
      >
        <AnimatePresence mode="wait">
          {reply ? (
            <motion.p
              key={reply}
              initial={{ opacity: 0, y: 10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="text-lg md:text-2xl font-medium tracking-tight text-white leading-relaxed drop-shadow-md max-w-xl font-sans"
            >
              {reply}
            </motion.p>
          ) : state === 'listening' ? (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-sm font-medium text-slate-400 tracking-wide flex items-center gap-2"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              Listening to your voice...
            </motion.p>
          ) : state === 'thinking' ? (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-sm font-medium text-slate-400 tracking-wide flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4 text-amber-400 animate-spin" />
              Retrieving from knowledge base...
            </motion.p>
          ) : (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-sm text-slate-500 font-normal"
            >
              {activePersona?.public_config?.greetingText || 'Tap the orb or use the microphone to talk.'}
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
