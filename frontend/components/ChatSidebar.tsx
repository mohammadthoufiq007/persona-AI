'use client';

import React, { useState } from 'react';
import { 
  Sparkles,
  LayoutGrid,
  Database,
  MessageSquare,
  Settings,
  HelpCircle,
  X,
  Globe2,
  Check
} from 'lucide-react';
import Link from 'next/link';
import { LanguageCode } from '@/lib/types';

interface ChatSidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  currentLanguage: LanguageCode;
  onSelectLanguage?: (lang: LanguageCode) => void;
  onClose?: () => void;
  onOpenKb?: () => void;
  onOpenChatPanel?: () => void;
}

const LANGUAGE_LABELS: Record<LanguageCode, { name: string; native: string; persona: string }> = {
  'en-IN': { name: 'English', native: 'English', persona: 'Sapphire' },
  'hi-IN': { name: 'Hindi', native: 'हिन्दी', persona: 'Rahu' },
  'ta-IN': { name: 'Tamil', native: 'தமிழ்', persona: 'Maragatham' },
};

export function ChatSidebar({
  isOpen,
  onToggle,
  currentLanguage,
  onSelectLanguage,
  onClose,
  onOpenKb,
  onOpenChatPanel,
}: ChatSidebarProps) {
  const [activeNav, setActiveNav] = useState<'home' | 'assistants' | 'kb' | 'chat'>('home');
  const [showSupportModal, setShowSupportModal] = useState(false);

  return (
    <>
      {/* Sidebar Navigation Drawer */}
      <aside
        onClick={(e) => e.stopPropagation()}
        className={`fixed top-0 bottom-0 left-0 z-50 h-full w-[285px] sm:w-[295px] flex flex-col shrink-0 bg-sidebar border-r border-sidebar-border text-sidebar-foreground shadow-[0_0_50px_rgba(0,0,0,0.8)] transition-transform duration-300 ease-in-out select-none ${
          isOpen
            ? 'translate-x-0 opacity-100 pointer-events-auto'
            : '-translate-x-full opacity-0 pointer-events-none'
        }`}
        aria-label="Persona AI Main Navigation"
      >
        <div className="flex flex-col h-full justify-between p-4 sm:p-5 pb-7 overflow-y-auto no-scrollbar">
          <div className="flex flex-col">
            {/* Header: App Brand & Close Button */}
            <div className="flex items-center justify-between pb-3 border-b border-sidebar-border">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-primary text-primary-foreground flex items-center justify-center shadow-sm shrink-0">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-bold tracking-tight text-foreground">Persona AI</h2>
                  <p className="text-[10px] text-muted-foreground">Voice & Agent Studio</p>
                </div>
              </div>

              <button
                onClick={onToggle}
                title="Close navigation panel"
                aria-label="Close navigation panel"
                className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-sidebar-accent transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Main Navigation Items */}
            <nav className="flex flex-col gap-1.5 mt-5" aria-label="Main Navigation">
              {/* 1. Home */}
              <button
                onClick={() => {
                  setActiveNav('home');
                  onToggle();
                }}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all duration-200 cursor-pointer ${
                  activeNav === 'home'
                    ? 'bg-sidebar-accent text-sidebar-accent-foreground font-semibold border border-sidebar-border shadow-xs'
                    : 'text-muted-foreground hover:text-foreground hover:bg-sidebar-accent/50'
                }`}
              >
                <LayoutGrid className="w-4 h-4 text-primary" />
                <span>Home (Voice Orb)</span>
              </button>

              {/* 2. Agent Chat */}
              <button
                onClick={() => {
                  setActiveNav('chat');
                  onOpenChatPanel?.();
                  onToggle();
                }}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all duration-200 cursor-pointer ${
                  activeNav === 'chat'
                    ? 'bg-sidebar-accent text-sidebar-accent-foreground font-semibold border border-sidebar-border shadow-xs'
                    : 'text-muted-foreground hover:text-foreground hover:bg-sidebar-accent/50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <MessageSquare className="w-4 h-4 text-indigo-400" />
                  <span>Agent Chat</span>
                </div>
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-indigo-500/15 text-indigo-300 font-semibold">
                  Live
                </span>
              </button>

              {/* 3. Assistant Personas */}
              <Link
                href="/assistants"
                onClick={() => onToggle()}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all duration-200 cursor-pointer ${
                  activeNav === 'assistants'
                    ? 'bg-sidebar-accent text-sidebar-accent-foreground font-semibold border border-sidebar-border shadow-xs'
                    : 'text-muted-foreground hover:text-foreground hover:bg-sidebar-accent/50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span>Assistant Personas</span>
                </div>
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-500/15 text-amber-300 font-semibold">
                  Studio
                </span>
              </Link>

              {/* 4. Knowledge Base */}
              <Link
                href="/knowledge"
                onClick={() => onToggle()}
                className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-sidebar-accent/50 transition-all duration-200 cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <Database className="w-4 h-4 text-emerald-400" />
                  <span>Knowledge Base</span>
                </div>
                <span className="text-[10px] text-muted-foreground">RAG</span>
              </Link>
            </nav>

            {/* Language Quick Switcher */}
            <div className="mt-6 pt-4 border-t border-sidebar-border flex flex-col gap-2">
              <div className="flex items-center gap-1.5 px-1 mb-1">
                <Globe2 className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="text-[11px] font-semibold text-muted-foreground tracking-wider uppercase">
                  Language Persona
                </span>
              </div>

              <div className="flex flex-col gap-1.5">
                {(Object.keys(LANGUAGE_LABELS) as LanguageCode[]).map((code) => {
                  const info = LANGUAGE_LABELS[code];
                  const isActive = currentLanguage === code;

                  return (
                    <button
                      key={code}
                      onClick={() => onSelectLanguage?.(code)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-colors cursor-pointer ${
                        isActive
                          ? 'bg-sidebar-accent text-sidebar-accent-foreground font-semibold border border-sidebar-border'
                          : 'text-muted-foreground hover:text-foreground hover:bg-sidebar-accent/40'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{info.persona}</span>
                        <span className="text-[11px] text-muted-foreground">({info.native})</span>
                      </div>
                      {isActive && <Check className="w-3.5 h-3.5 text-primary" />}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Bottom Settings & Support */}
          <div className="pt-4 border-t border-sidebar-border flex flex-col gap-1">
            <Link
              href="/assistants"
              onClick={() => onToggle()}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs text-muted-foreground hover:text-foreground hover:bg-sidebar-accent/50 transition-colors cursor-pointer"
            >
              <Settings className="w-4 h-4" />
              <span>Settings</span>
            </Link>

            <button
              onClick={() => setShowSupportModal(true)}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs text-muted-foreground hover:text-foreground hover:bg-sidebar-accent/50 transition-colors cursor-pointer"
            >
              <HelpCircle className="w-4 h-4" />
              <span>Support & Help</span>
            </button>
          </div>
        </div>
      </aside>



      {/* Support Modal */}
      {showSupportModal && (
        <div 
          onClick={() => setShowSupportModal(false)}
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-2xl bg-[#0D1126] border border-[#1B203B] p-6 shadow-2xl text-white"
          >
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <div className="flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-indigo-400" />
                <h3 className="font-semibold text-base">Support & Voice Commands</h3>
              </div>
              <button
                onClick={() => setShowSupportModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="py-4 space-y-3 text-xs text-slate-300">
              <p className="text-slate-400">
                You can trigger voice actions anytime by tapping the central Voice Orb or clicking the microphone icon.
              </p>
              <div className="bg-white/5 rounded-xl p-3 border border-white/10 space-y-1.5">
                <div className="font-semibold text-white">Voice Commands Examples:</div>
                <div className="text-[11px] text-slate-400">• &quot;When is our demo recording?&quot;</div>
                <div className="text-[11px] text-slate-400">• &quot;Aashirvaad atta price kya hai?&quot;</div>
                <div className="text-[11px] text-slate-400">• &quot;Airport metro train eppo start aagum?&quot;</div>
              </div>
            </div>

            <div className="pt-3 border-t border-white/10 flex justify-end">
              <button
                onClick={() => setShowSupportModal(false)}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default ChatSidebar;
