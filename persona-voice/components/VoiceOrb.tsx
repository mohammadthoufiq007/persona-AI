'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useConversationStore } from '@/store/conversation';
import { Mic, Volume2, Sparkles, AlertCircle, Loader2 } from 'lucide-react';

interface VoiceOrbProps {
  onOrbClick: () => void;
  audioLevel?: number; // 0 to 1
}

export function VoiceOrb({ onOrbClick, audioLevel = 0 }: VoiceOrbProps) {
  const { state, activePersona } = useConversationStore();
  const accentColor = activePersona?.public_config?.accentColor || '#6366F1';

  // Compute reactive scale based on live audio level
  const dynamicScale = state === 'listening' || state === 'speaking'
    ? 1 + Math.min(audioLevel * 0.45, 0.45)
    : 1;

  return (
    <div className="relative flex flex-col items-center justify-center my-6 select-none">
      {/* Outer Glow Halo */}
      <motion.div
        className="absolute w-72 h-72 rounded-full blur-3xl opacity-30 pointer-events-none transition-colors duration-700"
        style={{ backgroundColor: accentColor }}
        animate={{
          scale: state === 'listening' ? [1.1, 1.4, 1.2] : state === 'speaking' ? [1.1, 1.3, 1.1] : [1, 1.15, 1],
          opacity: state === 'idle' ? 0.25 : state === 'error' ? 0.4 : 0.5,
        }}
        transition={{
          repeat: Infinity,
          duration: state === 'thinking' ? 1.5 : 3.5,
          ease: 'easeInOut',
        }}
      />

      {/* Ripple Rings for Speaking / Listening */}
      <AnimatePresence>
        {(state === 'speaking' || state === 'listening') && (
          <>
            <motion.div
              initial={{ scale: 0.9, opacity: 0.8 }}
              animate={{ scale: [1, 1.8], opacity: [0.6, 0] }}
              transition={{ repeat: Infinity, duration: 1.8, ease: 'easeOut' }}
              className="absolute w-48 h-48 rounded-full border border-white/20 pointer-events-none"
              style={{ borderColor: accentColor }}
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0.6 }}
              animate={{ scale: [1, 2.2], opacity: [0.4, 0] }}
              transition={{ repeat: Infinity, duration: 2.2, delay: 0.4, ease: 'easeOut' }}
              className="absolute w-48 h-48 rounded-full border border-white/10 pointer-events-none"
              style={{ borderColor: accentColor }}
            />
          </>
        )}
      </AnimatePresence>

      {/* Counter-Rotating Orbital Rings for Thinking */}
      <AnimatePresence>
        {state === 'thinking' && (
          <>
            <motion.div
              className="absolute w-56 h-56 rounded-full border-2 border-dashed border-indigo-400/40 pointer-events-none"
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 4, ease: 'linear' }}
            />
            <motion.div
              className="absolute w-64 h-64 rounded-full border border-dotted border-purple-400/30 pointer-events-none"
              animate={{ rotate: -360 }}
              transition={{ repeat: Infinity, duration: 6, ease: 'linear' }}
            />
          </>
        )}
      </AnimatePresence>

      {/* Main Interactive Orb Button */}
      <motion.button
        type="button"
        onClick={onOrbClick}
        aria-label={`Voice Assistant Status: ${state}. Tap to interact.`}
        className="relative z-10 w-44 h-44 rounded-full flex items-center justify-center cursor-pointer shadow-2xl focus:outline-none focus:ring-4 focus:ring-white/20 group"
        style={{
          background: `radial-gradient(circle at 35% 35%, rgba(255, 255, 255, 0.45), ${accentColor} 45%, rgba(10, 10, 20, 0.85) 95%)`,
          boxShadow: `0 0 50px ${accentColor}55, inset 0 2px 10px rgba(255, 255, 255, 0.6), inset 0 -6px 16px rgba(0, 0, 0, 0.7)`,
        }}
        animate={{
          scale: dynamicScale,
        }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      >
        {/* Glass Refraction Inner Layer */}
        <div className="absolute inset-1 rounded-full bg-gradient-to-tr from-black/40 via-transparent to-white/30 pointer-events-none" />

        {/* Status Center Icon */}
        <div className="relative z-20 flex flex-col items-center text-white drop-shadow-md">
          {state === 'idle' && (
            <motion.div
              animate={{ scale: [1, 1.08, 1] }}
              transition={{ repeat: Infinity, duration: 2.5 }}
              className="flex flex-col items-center"
            >
              <Mic className="w-10 h-10 text-white/90 group-hover:scale-110 transition-transform" />
              <span className="text-[11px] font-medium tracking-wider uppercase mt-1 text-white/75">
                Tap to Speak
              </span>
            </motion.div>
          )}

          {state === 'listening' && (
            <div className="flex flex-col items-center animate-pulse">
              <Mic className="w-12 h-12 text-white" />
              <span className="text-[11px] font-semibold tracking-wider uppercase mt-1 text-emerald-300">
                Listening...
              </span>
            </div>
          )}

          {state === 'thinking' && (
            <div className="flex flex-col items-center">
              <Sparkles className="w-11 h-11 text-amber-300 animate-spin" />
              <span className="text-[11px] font-semibold tracking-wider uppercase mt-1 text-amber-200">
                Thinking...
              </span>
            </div>
          )}

          {state === 'speaking' && (
            <div className="flex flex-col items-center">
              <Volume2 className="w-11 h-11 text-cyan-200 animate-bounce" />
              <span className="text-[11px] font-semibold tracking-wider uppercase mt-1 text-cyan-200">
                Speaking
              </span>
            </div>
          )}

          {state === 'error' && (
            <div className="flex flex-col items-center">
              <AlertCircle className="w-10 h-10 text-rose-400" />
              <span className="text-[11px] font-semibold tracking-wider uppercase mt-1 text-rose-300">
                Tap to retry
              </span>
            </div>
          )}

          {state === 'busy' && (
            <div className="flex flex-col items-center">
              <Loader2 className="w-10 h-10 text-slate-300 animate-spin" />
              <span className="text-[11px] font-semibold tracking-wider uppercase mt-1 text-slate-300">
                Connecting...
              </span>
            </div>
          )}
        </div>
      </motion.button>
    </div>
  );
}
