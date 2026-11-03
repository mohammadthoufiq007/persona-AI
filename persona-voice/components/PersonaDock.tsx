'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { useConversationStore } from '@/store/conversation';
import { UserCheck, Store, Compass, Bot } from 'lucide-react';

export function PersonaDock() {
  const { personas, activePersona, setPersona, state } = useConversationStore();

  const getPersonaIcon = (slug: string) => {
    switch (slug) {
      case 'personal-assistant':
        return <UserCheck className="w-4 h-4" />;
      case 'shop-assistant':
        return <Store className="w-4 h-4" />;
      case 'tamil-companion':
        return <Compass className="w-4 h-4" />;
      default:
        return <Bot className="w-4 h-4" />;
    }
  };

  return (
    <nav
      aria-label="Persona Selection"
      className="flex flex-wrap items-center justify-center gap-2 p-1.5 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-xl shadow-lg max-w-2xl mx-auto"
    >
      {personas.map((persona) => {
        const isActive = activePersona?.slug === persona.slug;
        const color = persona.public_config?.accentColor || '#6366F1';

        return (
          <motion.button
            key={persona.slug}
            type="button"
            disabled={state === 'thinking' || state === 'listening'}
            onClick={() => setPersona(persona)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={`relative flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all duration-300 ${
              isActive
                ? 'text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
            }`}
            style={{
              backgroundColor: isActive ? `${color}33` : 'transparent',
              borderColor: isActive ? color : 'transparent',
              borderWidth: 1,
            }}
          >
            {/* Active Highlight Underlay */}
            {isActive && (
              <motion.div
                layoutId="activePersonaIndicator"
                className="absolute inset-0 rounded-xl pointer-events-none -z-10"
                style={{
                  background: `linear-gradient(135deg, ${color}40, ${color}10)`,
                  boxShadow: `0 0 15px ${color}30`,
                }}
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              />
            )}

            <span
              className="flex items-center justify-center w-6 h-6 rounded-lg text-white"
              style={{ backgroundColor: color }}
            >
              {getPersonaIcon(persona.slug)}
            </span>

            <div className="flex flex-col text-left">
              <span className="font-semibold leading-tight">{persona.name}</span>
              <span className="text-[10px] opacity-75 font-normal">
                {persona.public_config?.languageLabel || 'Voice'}
              </span>
            </div>
          </motion.button>
        );
      })}
    </nav>
  );
}
