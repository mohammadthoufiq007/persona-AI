'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { FloatingNav } from '@/components/FloatingNav';
import { 
  ArrowLeft, 
  Sparkles, 
  Save, 
  RotateCcw, 
  Volume2, 
  Code2, 
  SlidersHorizontal, 
  Check, 
  AlertCircle, 
  Copy, 
  Wand2, 
  FileJson,
  Layers,
  MessageSquare,
  ShieldCheck,
  CheckCircle2,
  Database,
  Sliders,
  Globe2,
  Bot
} from 'lucide-react';

interface PersonaData {
  slug: string;
  name: string;
  public_config: {
    name: string;
    languageLabel: string;
    accentColor: string;
    greetingText: string;
  };
  private_config: {
    systemPrompt: string;
    sttLanguage: string;
    tone?: string;
    speechStyle?: string;
    tts: {
      model: string;
      voice: string;
      language: string;
      speed: number;
    };
    biasWords: string[];
    retrieval: {
      top_k: number;
      min_similarity: number;
      inject_as: string;
      fallback_response: string;
    };
  };
}

const DEFAULT_PERSONAS: Record<string, PersonaData> = {
  'english-assistant': {
    slug: 'english-assistant',
    name: 'Sapphire – Personal Voice Assistant',
    public_config: {
      name: 'Sapphire',
      languageLabel: 'English',
      accentColor: '#3B82F6',
      greetingText: 'Hello! I am Sapphire, your personal voice assistant. How can I help you today?'
    },
    private_config: {
      systemPrompt: "You are Sapphire, an articulate, polite, and efficient personal voice assistant speaking clear, natural English. Always introduce yourself as Sapphire if asked. You have direct access to the user's identity, background, calendar, and preferences via the connected knowledge base. Prioritize context from the knowledge base to answer questions about the user accurately. For any general question, provide sharp, practical assistance. Keep all responses optimized for text-to-speech: 1 to 3 spoken sentences maximum, without markdown formatting, lists, emojis, asterisks, or unpronounceable symbols.",
      sttLanguage: 'en-IN',
      tone: 'Warm, professional, crisp & articulate',
      speechStyle: '1 to 2 spoken sentences, natural conversational pace, zero markdown or emojis',
      tts: {
        model: 'timbre-v2.5',
        voice: 'Sapphire',
        language: 'en-IN',
        speed: 1.0
      },
      biasWords: ['Sapphire', 'assistant', 'schedule', 'reminder', 'meeting', 'notes', 'profile', 'Thoufiq'],
      retrieval: {
        top_k: 5,
        min_similarity: 0.6,
        inject_as: 'system_context',
        fallback_response: 'I could not find that information in your profile notes. Is there anything else you would like me to check?'
      }
    }
  },
  'hindi-assistant': {
    slug: 'hindi-assistant',
    name: 'Rahu – Personal Voice Assistant',
    public_config: {
      name: 'Rahu',
      languageLabel: 'Hindi / Hinglish',
      accentColor: '#F59E0B',
      greetingText: 'Namaste! Main Rahu hoon, aapka personal voice assistant. Aaj main aapki kya madad kar sakta hoon?'
    },
    private_config: {
      systemPrompt: "You are Rahu, a sharp, polite, and dependable personal voice assistant speaking conversational Hindi and natural Hinglish. Always identify yourself as Rahu when asked. You have direct access to the user's personal knowledge base containing their identity, preferences, and records. Base answers about the user directly on retrieved context from their personal profile. Answer any general question concisely and helpfully. Keep speech output optimized for TTS: 1 to 2 spoken sentences, flowing naturally without lists, markdown, asterisks, emojis, or code blocks.",
      sttLanguage: 'hi-IN',
      tone: 'Respectful, lively, helpful & grounded',
      speechStyle: '1 to 2 spoken sentences in Hindi/Hinglish, natural rhythm, zero markdown or bullet points',
      tts: {
        model: 'timbre-v2.5',
        voice: 'Rahu',
        language: 'hi-IN',
        speed: 1.0
      },
      biasWords: ['Namaste', 'Rahu', 'Bataiye', 'Zaroor', 'Haanji', 'Shukriya', 'Assistant', 'Schedule', 'Kaam', 'Thoufiq'],
      retrieval: {
        top_k: 5,
        min_similarity: 0.6,
        inject_as: 'system_context',
        fallback_response: 'Maaf kijiyega, mujhe aapki profile details mein yeh jaankari nahi mili. Kya main kisi aur cheez mein madad karoon?'
      }
    }
  },
  'tamil-assistant': {
    slug: 'tamil-assistant',
    name: 'Maragatham – Personal Voice Assistant',
    public_config: {
      name: 'Maragatham',
      languageLabel: 'Tamil / Tanglish',
      accentColor: '#10B981',
      greetingText: 'Vanakkam! Naan Maragatham, ungalthu personal voice assistant. Ungalukku innaiku naan eppadi uthavattum?'
    },
    private_config: {
      systemPrompt: "You are Maragatham, a dedicated, warm, and highly capable personal assistant speaking natural spoken Tamil and casual Tanglish. Always identify yourself as Maragatham when asked. You have direct access to the user's personal knowledge base containing their identity, routines, notes, and preferences. Prioritize retrieved knowledge-base context to deliver accurate, personalized answers about the user. For general queries, answer naturally, reliably, and politely. Keep voice output clean: speak directly in 1 to 2 conversational sentences, and never use bullet points, asterisks, emojis, URLs, or markdown symbols.",
      sttLanguage: 'ta-IN',
      tone: 'Warm, hospitable, friendly & highly capable',
      speechStyle: '1 to 2 natural spoken sentences in Tamil/Tanglish, conversational cadence, zero markdown',
      tts: {
        model: 'timbre-v2.5',
        voice: 'Maragatham',
        language: 'ta-IN',
        speed: 1.0
      },
      biasWords: ['Vanakkam', 'Thambi', 'Anna', 'Maragatham', 'Chennai', 'Tanglish', 'Aama', 'Illa', 'Seringa', 'Sollunga', 'Thoufiq'],
      retrieval: {
        top_k: 5,
        min_similarity: 0.6,
        inject_as: 'system_context',
        fallback_response: 'Manikkavum, ungal profile la idhu pathina thagaval illa. Vera edhavadhu uthavi thevaiya?'
      }
    }
  }
};

export default function AssistantsPage() {
  const [personas, setPersonas] = useState<Record<string, PersonaData>>(DEFAULT_PERSONAS);
  const [activeSlug, setActiveSlug] = useState<string>('english-assistant');
  const [viewMode, setViewMode] = useState<'form' | 'json'>('form');
  const [rawJsonText, setRawJsonText] = useState<string>('');
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  // Load latest personas from server API on mount
  useEffect(() => {
    async function loadServerPersonas() {
      try {
        const res = await fetch('/api/personas');
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.personas) && data.personas.length > 0) {
            const map: Record<string, PersonaData> = { ...DEFAULT_PERSONAS };
            data.personas.forEach((p: any) => {
              const slugKey = p.slug.includes('english') || p.slug.includes('personal')
                ? 'english-assistant'
                : p.slug.includes('hindi') || p.slug.includes('shop')
                ? 'hindi-assistant'
                : 'tamil-assistant';
              map[slugKey] = {
                slug: slugKey,
                name: p.name || map[slugKey].name,
                public_config: { ...map[slugKey].public_config, ...(p.public_config || {}) },
                private_config: { ...map[slugKey].private_config, ...(p.private_config || {}) },
              };
            });
            setPersonas(map);
          }
        }
      } catch (err) {
        console.warn('[assistants] Server load fallback to defaults:', err);
      }
    }
    loadServerPersonas();
  }, []);

  const currentPersona = personas[activeSlug] || DEFAULT_PERSONAS['english-assistant'];

  // Keep raw JSON in sync when switching personas or switching to JSON mode
  useEffect(() => {
    setRawJsonText(JSON.stringify(currentPersona, null, 2));
    setJsonError(null);
  }, [activeSlug, personas]);

  // Form field updater helper
  const updateCurrentPersona = (updater: (prev: PersonaData) => PersonaData) => {
    setPersonas((prev) => {
      const updated = updater({ ...prev[activeSlug] });
      return { ...prev, [activeSlug]: updated };
    });
  };

  // Switch View Mode with validation
  const handleViewModeChange = (mode: 'form' | 'json') => {
    if (mode === 'form' && viewMode === 'json') {
      try {
        const parsed = JSON.parse(rawJsonText);
        setPersonas((prev) => ({ ...prev, [activeSlug]: parsed }));
        setJsonError(null);
      } catch (err: any) {
        setJsonError(`Invalid JSON format: ${err.message}`);
        return;
      }
    }
    setViewMode(mode);
  };

  // Save current configurations
  const handleSave = async () => {
    setIsSaving(true);
    setSaveSuccessMsg(null);
    setJsonError(null);

    let personaToSave = currentPersona;
    if (viewMode === 'json') {
      try {
        personaToSave = JSON.parse(rawJsonText);
      } catch (err: any) {
        setJsonError(`Cannot save: invalid JSON (${err.message})`);
        setIsSaving(false);
        return;
      }
    }

    try {
      const res = await fetch('/api/personas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update',
          persona: personaToSave
        })
      });

      if (res.ok) {
        setSaveSuccessMsg(`Saved "${personaToSave.public_config.name}" preferences successfully`);
        setTimeout(() => setSaveSuccessMsg(null), 3000);
      } else {
        const errData = await res.json().catch(() => ({}));
        setJsonError(errData.error || 'Failed to save changes to server');
      }
    } catch (err: any) {
      setJsonError(err.message || 'Network error while saving persona');
    } finally {
      setIsSaving(false);
    }
  };

  // Reset to default settings
  const handleReset = async () => {
    if (!confirm(`Reset ${currentPersona.public_config.name} to default script preferences?`)) return;
    setIsSaving(true);
    try {
      const res = await fetch('/api/personas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'reset',
          slug: activeSlug
        })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.persona) {
          setPersonas((prev) => ({ ...prev, [activeSlug]: data.persona }));
        } else {
          setPersonas((prev) => ({ ...prev, [activeSlug]: DEFAULT_PERSONAS[activeSlug] }));
        }
        setSaveSuccessMsg(`Reset ${currentPersona.public_config.name} configuration to default`);
        setTimeout(() => setSaveSuccessMsg(null), 3000);
      }
    } catch {
      setPersonas((prev) => ({ ...prev, [activeSlug]: DEFAULT_PERSONAS[activeSlug] }));
    } finally {
      setIsSaving(false);
    }
  };

  // Preview Voice Synthesis
  const handleTestGreeting = () => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(currentPersona.public_config.greetingText);
    utterance.rate = currentPersona.private_config.tts.speed || 1.0;
    utterance.lang = currentPersona.private_config.tts.language || 'en-IN';

    utterance.onend = () => setIsPlayingAudio(false);
    utterance.onerror = () => setIsPlayingAudio(false);

    setIsPlayingAudio(true);
    window.speechSynthesis.speak(utterance);
  };

  const copyJson = () => {
    navigator.clipboard?.writeText(rawJsonText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen w-full bg-[#05070f] text-white flex flex-col justify-between p-3 sm:p-5 lg:p-6 font-sans selection:bg-[#6366F1]/30 selection:text-indigo-200 relative">
      {/* Background ambient lighting */}
      <div className="fixed top-0 left-1/4 w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[100px] pointer-events-none -z-10" />
      <div className="fixed bottom-0 right-1/4 w-[400px] h-[400px] bg-amber-500/10 rounded-full blur-[120px] pointer-events-none -z-10" />

      {/* Top Floating Navigation Pill */}
      <FloatingNav />

      <div className="w-full max-w-7xl mx-auto flex-1 flex flex-col gap-4 pt-10 sm:pt-12">
        {/* Top Header - Matches VoiceBento Aesthetic Exactly */}
        <header className="w-full flex items-center justify-between pb-3.5 border-b border-white/10">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              title="Return to Voice Orb"
              aria-label="Return to Voice Orb"
              className="p-2.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/14 text-white transition-all shadow-sm cursor-pointer hover:border-white/20 group backdrop-blur-md"
            >
              <ArrowLeft className="w-4 h-4 text-white group-hover:-translate-x-1 transition-transform" />
            </Link>

            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl overflow-hidden border border-white/20 shadow-md flex items-center justify-center bg-[#05070f]">
                <Sliders className="w-5 h-5 text-white" />
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-base md:text-lg tracking-tight text-white">
                  Assistant Preferences
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleReset}
              title="Reset to default script"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/14 text-xs font-medium text-white/80 hover:text-white transition-all shadow-sm cursor-pointer backdrop-blur-md"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Reset</span>
            </button>

            <button
              onClick={handleSave}
              disabled={isSaving}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white text-[#05070f] text-xs font-semibold hover:bg-white/90 transition-all shadow-sm cursor-pointer disabled:opacity-50"
            >
              {isSaving ? (
                <div className="w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin" />
              ) : (
                <Save className="w-3.5 h-3.5 text-[#05070f]" />
              )}
              <span>Save Changes</span>
            </button>

            <Link
              href="/"
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/14 text-xs font-medium text-white transition-all shadow-sm backdrop-blur-md hover:border-white/20"
            >
              <Sparkles className="w-3.5 h-3.5 text-white" />
              <span className="hidden sm:inline">Voice Orb</span>
            </Link>
          </div>
        </header>

        {/* Alerts / Feedback Banner */}
        {saveSuccessMsg && (
          <div className="relative rounded-2xl bg-[#05070f] border border-emerald-500/30 p-3 shadow-[0_16px_40px_-15px_rgba(0,0,0,0.7)] flex items-center justify-between overflow-hidden">
            <div className="absolute inset-0 rounded-[inherit] pointer-events-none z-[9] shadow-[inset_0_1px_0_rgba(255,255,255,0.2),inset_0_0_0_1px_rgba(255,255,255,0.06)]" />
            <div className="relative z-[2] flex items-center gap-2 text-xs text-emerald-300 font-medium">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>{saveSuccessMsg}</span>
            </div>
          </div>
        )}

        {jsonError && (
          <div className="relative rounded-2xl bg-[#05070f] border border-rose-500/30 p-3 shadow-[0_16px_40px_-15px_rgba(0,0,0,0.7)] flex items-center gap-2 text-xs text-rose-300 overflow-hidden">
            <div className="absolute inset-0 rounded-[inherit] pointer-events-none z-[9] shadow-[inset_0_1px_0_rgba(255,255,255,0.2),inset_0_0_0_1px_rgba(255,255,255,0.06)]" />
            <div className="relative z-[2] flex items-center gap-2 text-xs text-rose-300">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{jsonError}</span>
            </div>
          </div>
        )}

        {/* Assistant Tabs & View Mode Bar */}
        <div className="relative rounded-2xl bg-[#05070f] border border-white/10 shadow-[0_16px_40px_-15px_rgba(0,0,0,0.7)] p-2 overflow-hidden flex flex-wrap items-center justify-between gap-3">
          <div className="absolute inset-0 rounded-[inherit] pointer-events-none z-[9] shadow-[inset_0_1px_0_rgba(255,255,255,0.2),inset_0_0_0_1px_rgba(255,255,255,0.06)]" />
          
          {/* Persona Selection Tabs */}
          <div className="relative z-[2] flex items-center gap-1.5 sm:gap-2">
            {[
              { slug: 'english-assistant', name: 'Sapphire', lang: 'English' },
              { slug: 'hindi-assistant', name: 'Rahu', lang: 'हिन्दी' },
              { slug: 'tamil-assistant', name: 'Maragatham', lang: 'தமிழ்' },
            ].map((tab) => {
              const isSelected = activeSlug === tab.slug;
              return (
                <button
                  key={tab.slug}
                  onClick={() => setActiveSlug(tab.slug)}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer border ${
                    isSelected
                      ? 'bg-white text-[#05070f] border-white font-semibold shadow-sm'
                      : 'bg-white/[0.06] border-white/10 text-white/70 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <Bot className={`w-3.5 h-3.5 ${isSelected ? 'text-[#05070f]' : 'text-white/60'}`} />
                  <span>{tab.name}</span>
                  <span className={`text-[10px] ${isSelected ? 'text-[#05070f]/70' : 'text-white/40'}`}>
                    ({tab.lang})
                  </span>
                </button>
              );
            })}
          </div>

          {/* Right Mode Toggle & Quick Metrics */}
          <div className="relative z-[2] flex items-center gap-2">
            <div className="hidden md:flex items-center gap-2 px-2.5 py-1 rounded-[11px] bg-black/75 border border-white/12 text-[11px] text-white/70 font-mono">
              <span>{currentPersona.private_config.tts.voice}</span>
              <span className="text-white/30">•</span>
              <span>{currentPersona.private_config.tts.speed}x</span>
              <span className="text-white/30">•</span>
              <span>Top-{currentPersona.private_config.retrieval?.top_k ?? 5} Chunks</span>
            </div>

            <div className="flex items-center gap-1 bg-black/70 p-0.5 rounded-xl border border-white/10">
              <button
                onClick={() => handleViewModeChange('form')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                  viewMode === 'form'
                    ? 'bg-white text-[#05070f] font-semibold shadow-sm'
                    : 'text-white/60 hover:text-white'
                }`}
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span>Form</span>
              </button>
              <button
                onClick={() => handleViewModeChange('json')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                  viewMode === 'json'
                    ? 'bg-white text-[#05070f] font-semibold shadow-sm'
                    : 'text-white/60 hover:text-white'
                }`}
              >
                <Code2 className="w-3.5 h-3.5" />
                <span>JSON Script</span>
              </button>
            </div>
          </div>
        </div>

        {/* Form View: High-Efficiency Bento Grid Engineered to Fit Standard Page Size */}
        {viewMode === 'form' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-3.5 flex-1">
            
            {/* Bento Card 1: Tone, Voice Engine & Speech (4 cols - Vibrant Indigo Theme) */}
            <div className="lg:col-span-4 relative rounded-[20px] overflow-hidden bg-[#05070f] border border-white/10 shadow-[0_16px_40px_-15px_rgba(0,0,0,0.7)] flex flex-col justify-between">
              {/* Vibrant Background gradient layer */}
              <div 
                className="absolute inset-0 pointer-events-none" 
                style={{ background: 'linear-gradient(180deg, #818cf8 0%, #312e81 36%, #312e81 74%, #4338ca 100%)' }} 
              />
              {/* Core glow layer */}
              <div 
                className="absolute left-[10%] right-[10%] top-[16%] bottom-[-6%] rounded-[90px] blur-[50px] pointer-events-none" 
                style={{ background: '#0a0a2e' }} 
              />
              {/* Inner rim lighting */}
              <div className="absolute inset-0 rounded-[inherit] pointer-events-none z-[9] shadow-[inset_0_1px_0_rgba(255,255,255,0.25),inset_0_0_0_1px_rgba(255,255,255,0.08)]" />

              {/* Content Wrapper */}
              <div className="relative z-[2] p-4 flex flex-col justify-between gap-3.5 h-full">
                <div className="flex items-center justify-between pb-2 border-b border-white/15">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-black/40 border border-[#818cf8]/50 flex items-center justify-center text-[#818cf8] backdrop-blur-sm">
                      <Wand2 className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <h2 className="text-xs font-bold text-white uppercase tracking-wider font-mono">Voice & Speech Engine</h2>
                      <p className="text-[10px] text-white/60">Tone, voice timbre & spoken style</p>
                    </div>
                  </div>

                  <button
                    onClick={handleTestGreeting}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-black/50 hover:bg-black/70 border border-white/15 text-[11px] font-medium text-white transition-all cursor-pointer shadow-sm backdrop-blur-md"
                  >
                    <Volume2 className={`w-3 h-3 ${isPlayingAudio ? 'animate-pulse text-[#818cf8]' : 'text-white/80'}`} />
                    <span className="font-mono">{isPlayingAudio ? 'Speaking' : 'Test Voice'}</span>
                  </button>
                </div>

                {/* Tone of Voice */}
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-white/80 flex items-center justify-between">
                    <span>Assistant Tone</span>
                    <span className="text-[10px] font-semibold uppercase tracking-[0.06em] text-white/70 font-mono">Personality vibe</span>
                  </label>
                  <input
                    type="text"
                    value={currentPersona.private_config.tone || ''}
                    onChange={(e) => updateCurrentPersona((p) => ({
                      ...p,
                      private_config: { ...p.private_config, tone: e.target.value }
                    }))}
                    placeholder="e.g. Warm, professional, crisp & articulate"
                    className="w-full px-3 py-1.5 rounded-[10px] bg-black/65 border border-white/15 text-[13px] text-white placeholder-white/30 focus:outline-none focus:border-white focus:ring-1 focus:ring-white/80 shadow-[inset_0_1px_2px_rgba(0,0,0,0.6)] backdrop-blur-md transition-all"
                  />
                </div>

                {/* Voice Model & Speaker Selection */}
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-white/80 flex items-center justify-between">
                    <span>Voice Model & Speaker</span>
                    <span className="text-[10px] font-semibold uppercase tracking-[0.06em] text-white/70 font-mono">Timbre engine</span>
                  </label>
                  <select
                    value={currentPersona.private_config.tts.voice}
                    onChange={(e) => updateCurrentPersona((p) => ({
                      ...p,
                      private_config: {
                        ...p.private_config,
                        tts: { ...p.private_config.tts, voice: e.target.value }
                      }
                    }))}
                    className="w-full px-3 py-1.5 rounded-[10px] bg-black/65 border border-white/15 text-[13px] text-white focus:outline-none focus:border-white focus:ring-1 focus:ring-white/80 shadow-[inset_0_1px_2px_rgba(0,0,0,0.6)] backdrop-blur-md cursor-pointer transition-all"
                  >
                    <option value="Sapphire" className="bg-[#05070f] text-white">Sapphire (Natural English Female)</option>
                    <option value="Saphire" className="bg-[#05070f] text-white">Saphire (Expressive English)</option>
                    <option value="Rahu" className="bg-[#05070f] text-white">Rahu (Dynamic Hindi Male)</option>
                    <option value="Maragatham" className="bg-[#05070f] text-white">Maragatham (Authentic Tamil Female)</option>
                    <option value="Aria" className="bg-[#05070f] text-white">Aria (Neutral Crisp)</option>
                  </select>
                </div>

                {/* Speech Style Rules */}
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-white/80 flex items-center justify-between">
                    <span>Speech Constraints</span>
                    <span className="text-[10px] font-semibold uppercase tracking-[0.06em] text-white/70 font-mono">Spoken length</span>
                  </label>
                  <input
                    type="text"
                    value={currentPersona.private_config.speechStyle || ''}
                    onChange={(e) => updateCurrentPersona((p) => ({
                      ...p,
                      private_config: { ...p.private_config, speechStyle: e.target.value }
                    }))}
                    placeholder="e.g. 1 to 2 spoken sentences, zero markdown"
                    className="w-full px-3 py-1.5 rounded-[10px] bg-black/65 border border-white/15 text-[13px] text-white placeholder-white/30 focus:outline-none focus:border-white focus:ring-1 focus:ring-white/80 shadow-[inset_0_1px_2px_rgba(0,0,0,0.6)] backdrop-blur-md transition-all"
                  />
                </div>

                {/* Voice Speed */}
                <div className="space-y-1 pt-1 border-t border-white/15">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-white/80 font-medium">Speech Speed</span>
                    <span className="font-mono text-white text-[11px] font-semibold">{currentPersona.private_config.tts.speed}x</span>
                  </div>
                  <input
                    type="range"
                    min="0.8"
                    max="1.4"
                    step="0.05"
                    value={currentPersona.private_config.tts.speed}
                    onChange={(e) => updateCurrentPersona((p) => ({
                      ...p,
                      private_config: {
                        ...p.private_config,
                        tts: { ...p.private_config.tts, speed: parseFloat(e.target.value) }
                      }
                    }))}
                    className="w-full cursor-pointer h-1.5 bg-black/40 rounded-sm accent-[#818cf8]"
                    style={{ accentColor: '#818cf8' }}
                  />
                </div>

                {/* Initial Greeting Text */}
                <div className="space-y-1 pt-1 border-t border-white/15">
                  <label className="text-[11px] font-medium text-white/80 flex items-center justify-between">
                    <span>Spoken Greeting</span>
                    <span className="text-[10px] font-semibold uppercase tracking-[0.06em] text-white/70 font-mono">First contact message</span>
                  </label>
                  <textarea
                    rows={2}
                    value={currentPersona.public_config.greetingText}
                    onChange={(e) => updateCurrentPersona((p) => ({
                      ...p,
                      public_config: { ...p.public_config, greetingText: e.target.value }
                    }))}
                    className="w-full px-3 py-1.5 rounded-[10px] bg-black/65 border border-white/15 text-[13px] text-white placeholder-white/30 focus:outline-none focus:border-white focus:ring-1 focus:ring-white/80 shadow-[inset_0_1px_2px_rgba(0,0,0,0.6)] backdrop-blur-md resize-none transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Bento Card 2: System Prompt & Behavioral Instructions (5 cols - Vibrant Graph Theme) */}
            <div className="lg:col-span-5 relative rounded-[20px] overflow-hidden bg-[#05070f] border border-white/10 shadow-[0_16px_40px_-15px_rgba(0,0,0,0.7)] flex flex-col justify-between">
              {/* Vibrant Background gradient layer */}
              <div 
                className="absolute inset-0 pointer-events-none" 
                style={{ background: 'linear-gradient(180deg, #94a3b8 0%, #1e293b 36%, #1e293b 74%, #334155 100%)' }} 
              />
              {/* Core glow layer */}
              <div 
                className="absolute left-[10%] right-[10%] top-[16%] bottom-[-6%] rounded-[90px] blur-[50px] pointer-events-none" 
                style={{ background: '#050811' }} 
              />
              {/* Inner rim lighting */}
              <div className="absolute inset-0 rounded-[inherit] pointer-events-none z-[9] shadow-[inset_0_1px_0_rgba(255,255,255,0.25),inset_0_0_0_1px_rgba(255,255,255,0.08)]" />

              {/* Content Wrapper */}
              <div className="relative z-[2] p-4 flex flex-col justify-between gap-3 h-full">
                <div className="flex items-center justify-between pb-2 border-b border-white/15">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-black/40 border border-[#94a3b8]/50 flex items-center justify-center text-[#94a3b8] backdrop-blur-sm">
                      <MessageSquare className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <h2 className="text-xs font-bold text-white uppercase tracking-wider font-mono">System Prompt & Guardrails</h2>
                      <p className="text-[10px] text-white/60">Core behavior & LLM guidelines</p>
                    </div>
                  </div>
                  <span className="inline-flex items-center h-[22px] px-2.5 rounded-[11px] bg-black/75 text-white font-mono text-[10px] font-semibold border border-white/14">
                    {currentPersona.private_config.systemPrompt.length} chars
                  </span>
                </div>

                {/* Prompt Editor: Elevated Frosted Well */}
                <div className="space-y-1.5 flex-1 flex flex-col min-h-0">
                  <label className="text-[11px] font-medium text-white/80 flex items-center justify-between">
                    <span>Assistant Prompt Script</span>
                    <span className="text-[10px] font-semibold uppercase tracking-[0.06em] text-white/70 font-mono">TTS optimized, concise speech</span>
                  </label>
                  <textarea
                    value={currentPersona.private_config.systemPrompt}
                    onChange={(e) => updateCurrentPersona((p) => ({
                      ...p,
                      private_config: { ...p.private_config, systemPrompt: e.target.value }
                    }))}
                    placeholder="Enter system instructions..."
                    className="w-full flex-1 h-full min-h-[280px] p-3 rounded-[12px] bg-black/70 border border-white/15 text-xs text-white/95 leading-relaxed font-mono shadow-[inset_0_2px_4px_rgba(0,0,0,0.6)] backdrop-blur-md focus:outline-none focus:border-white focus:ring-1 focus:ring-white/80 resize-none transition-all"
                  />
                </div>

                {/* Identity & Display Name Mini-Row */}
                <div className="grid grid-cols-2 gap-2.5 pt-2 border-t border-white/15">
                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold uppercase tracking-[0.06em] text-white/70 font-mono">Display Name</label>
                    <input
                      type="text"
                      value={currentPersona.public_config.name}
                      onChange={(e) => updateCurrentPersona((p) => ({
                        ...p,
                        public_config: { ...p.public_config, name: e.target.value }
                      }))}
                      className="w-full px-3 py-1.5 rounded-[10px] bg-black/65 border border-white/15 text-[13px] text-white focus:outline-none focus:border-white focus:ring-1 focus:ring-white/80 shadow-[inset_0_1px_2px_rgba(0,0,0,0.6)] backdrop-blur-md transition-all"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold uppercase tracking-[0.06em] text-white/70 font-mono">Language Label</label>
                    <input
                      type="text"
                      value={currentPersona.public_config.languageLabel}
                      onChange={(e) => updateCurrentPersona((p) => ({
                        ...p,
                        public_config: { ...p.public_config, languageLabel: e.target.value }
                      }))}
                      className="w-full px-3 py-1.5 rounded-[10px] bg-black/65 border border-white/15 text-[13px] text-white focus:outline-none focus:border-white focus:ring-1 focus:ring-white/80 shadow-[inset_0_1px_2px_rgba(0,0,0,0.6)] backdrop-blur-md transition-all"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Bento Card 3: Knowledge Base Grounding & STT Phonetics (3 cols - Vibrant Cyan Theme) */}
            <div className="lg:col-span-3 relative rounded-[20px] overflow-hidden bg-[#05070f] border border-white/10 shadow-[0_16px_40px_-15px_rgba(0,0,0,0.7)] flex flex-col justify-between">
              {/* Vibrant Background gradient layer */}
              <div 
                className="absolute inset-0 pointer-events-none" 
                style={{ background: 'linear-gradient(180deg, #67e8f9 0%, #155e75 36%, #155e75 74%, #0e7490 100%)' }} 
              />
              {/* Core glow layer */}
              <div 
                className="absolute left-[10%] right-[10%] top-[16%] bottom-[-6%] rounded-[90px] blur-[50px] pointer-events-none" 
                style={{ background: '#041720' }} 
              />
              {/* Inner rim lighting */}
              <div className="absolute inset-0 rounded-[inherit] pointer-events-none z-[9] shadow-[inset_0_1px_0_rgba(255,255,255,0.25),inset_0_0_0_1px_rgba(255,255,255,0.08)]" />

              {/* Content Wrapper */}
              <div className="relative z-[2] p-4 flex flex-col justify-between gap-3 h-full">
                <div className="flex items-center justify-between pb-2 border-b border-white/15">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-black/40 border border-[#67e8f9]/50 flex items-center justify-center text-[#67e8f9] backdrop-blur-sm">
                      <Database className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <h2 className="text-xs font-bold text-white uppercase tracking-wider font-mono">Grounding & STT</h2>
                      <p className="text-[10px] text-white/60">RAG vectors & bias boost</p>
                    </div>
                  </div>
                  <span className="inline-flex items-center h-[22px] px-2.5 rounded-[11px] bg-emerald-500/25 text-[#34D399] border border-emerald-500/50 font-mono text-[10px] font-semibold tracking-wider">
                    Active
                  </span>
                </div>

                {/* Top-K Retrieval Chunks */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-white/80 font-medium">Top-K Context Chunks</span>
                    <span className="font-mono text-white text-[11px] font-semibold">{currentPersona.private_config.retrieval?.top_k ?? 5}</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="8"
                    step="1"
                    value={currentPersona.private_config.retrieval?.top_k ?? 5}
                    onChange={(e) => updateCurrentPersona((p) => ({
                      ...p,
                      private_config: {
                        ...p.private_config,
                        retrieval: {
                          ...p.private_config.retrieval,
                          top_k: parseInt(e.target.value)
                        }
                      }
                    }))}
                    className="w-full cursor-pointer h-1.5 bg-black/40 rounded-sm accent-[#67e8f9]"
                    style={{ accentColor: '#67e8f9' }}
                  />
                </div>

                {/* Min Similarity Threshold */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-white/80 font-medium">Min Similarity</span>
                    <span className="font-mono text-white text-[11px] font-semibold">{currentPersona.private_config.retrieval?.min_similarity ?? 0.6}</span>
                  </div>
                  <input
                    type="range"
                    min="0.2"
                    max="0.9"
                    step="0.05"
                    value={currentPersona.private_config.retrieval?.min_similarity ?? 0.6}
                    onChange={(e) => updateCurrentPersona((p) => ({
                      ...p,
                      private_config: {
                        ...p.private_config,
                        retrieval: {
                          ...p.private_config.retrieval,
                          min_similarity: parseFloat(e.target.value)
                        }
                      }
                    }))}
                    className="w-full cursor-pointer h-1.5 bg-black/40 rounded-sm accent-[#67e8f9]"
                    style={{ accentColor: '#67e8f9' }}
                  />
                </div>

                {/* STT Phonetic Bias Words */}
                <div className="space-y-1 pt-1 border-t border-white/15">
                  <label className="text-[11px] font-medium text-white/80 flex items-center justify-between">
                    <span>Phonetic Bias Words</span>
                    <span className="text-[10px] font-semibold uppercase tracking-[0.06em] text-white/70 font-mono">Comma-separated</span>
                  </label>
                  <input
                    type="text"
                    value={currentPersona.private_config.biasWords?.join(', ') || ''}
                    onChange={(e) => updateCurrentPersona((p) => ({
                      ...p,
                      private_config: {
                        ...p.private_config,
                        biasWords: e.target.value.split(',').map((w) => w.trim()).filter(Boolean)
                      }
                    }))}
                    placeholder="e.g. Thoufiq, Sapphire, Chennai"
                    className="w-full px-3 py-1.5 rounded-[10px] bg-black/65 border border-white/15 text-[13px] text-white placeholder-white/30 focus:outline-none focus:border-white focus:ring-1 focus:ring-white/80 shadow-[inset_0_1px_2px_rgba(0,0,0,0.6)] backdrop-blur-md transition-all"
                  />
                  <div className="flex flex-wrap gap-1 max-h-[38px] overflow-hidden pt-0.5">
                    {currentPersona.private_config.biasWords?.slice(0, 6).map((word, idx) => (
                      <span key={idx} className="inline-flex items-center h-[20px] px-2 rounded-[10px] bg-black/80 text-white font-mono text-[9.5px] font-medium border border-white/15">
                        {word}
                      </span>
                    ))}
                    {(currentPersona.private_config.biasWords?.length || 0) > 6 && (
                      <span className="inline-flex items-center h-[20px] px-1.5 rounded-[10px] bg-black/60 text-white/60 font-mono text-[9px] border border-white/10">
                        +{(currentPersona.private_config.biasWords?.length || 0) - 6} more
                      </span>
                    )}
                  </div>
                </div>

                {/* Shared Personal Profile Pill */}
                <div className="p-2.5 rounded-xl bg-black/65 border border-white/15 flex items-start gap-2 backdrop-blur-md">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#67e8f9] shrink-0 mt-0.5" />
                  <div className="flex flex-col">
                    <span className="font-semibold text-white text-[11px] font-mono">Personal Profile Linked</span>
                    <span className="text-[10px] text-white/60 leading-tight">
                      Master KB is indexed & grounded across all languages.
                    </span>
                  </div>
                </div>
              </div>
            </div>

          </div>
        )}

        {/* View Mode 2: Raw JSON Script View (VoiceBento Styled) */}
        {viewMode === 'json' && (
          <div className="relative rounded-[20px] overflow-hidden bg-[#05070f] border border-white/10 shadow-[0_16px_40px_-15px_rgba(0,0,0,0.7)] p-4 sm:p-5 flex flex-col gap-3 flex-1">
            {/* Vibrant Background gradient layer */}
            <div 
              className="absolute inset-0 pointer-events-none" 
              style={{ background: 'linear-gradient(180deg, #94a3b8 0%, #1e293b 36%, #1e293b 74%, #334155 100%)' }} 
            />
            {/* Core glow layer */}
            <div 
              className="absolute left-[10%] right-[10%] top-[16%] bottom-[-6%] rounded-[90px] blur-[50px] pointer-events-none" 
              style={{ background: '#050811' }} 
            />
            {/* Inner rim lighting */}
            <div className="absolute inset-0 rounded-[inherit] pointer-events-none z-[9] shadow-[inset_0_1px_0_rgba(255,255,255,0.25),inset_0_0_0_1px_rgba(255,255,255,0.08)]" />

            <div className="relative z-[2] flex flex-col gap-3 flex-1">
              <div className="flex items-center justify-between border-b border-white/15 pb-2.5">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-black/40 border border-[#94a3b8]/50 flex items-center justify-center text-[#94a3b8] backdrop-blur-sm">
                    <FileJson className="w-4 h-4" />
                  </div>
                  <h3 className="font-bold text-xs uppercase tracking-wider text-white font-mono">
                    JSON Script Specification — {currentPersona.public_config.name}
                  </h3>
                </div>

                <button
                  onClick={copyJson}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-black/50 hover:bg-black/70 border border-white/15 text-xs font-medium text-white transition-all cursor-pointer shadow-sm backdrop-blur-md"
                >
                  {copied ? <Check className="w-3 h-3 text-[#10B981]" /> : <Copy className="w-3 h-3 text-white/80" />}
                  <span className="font-mono">{copied ? 'Copied' : 'Copy JSON'}</span>
                </button>
              </div>

              <textarea
                value={rawJsonText}
                onChange={(e) => {
                  setRawJsonText(e.target.value);
                  try {
                    const parsed = JSON.parse(e.target.value);
                    setPersonas((prev) => ({ ...prev, [activeSlug]: parsed }));
                    setJsonError(null);
                  } catch (err: any) {
                    setJsonError(err.message);
                  }
                }}
                rows={18}
                className="w-full p-3.5 rounded-[12px] bg-black/70 border border-white/15 font-mono text-xs text-white/95 leading-relaxed shadow-[inset_0_2px_4px_rgba(0,0,0,0.6)] backdrop-blur-md focus:outline-none focus:border-white focus:ring-1 focus:ring-white/80 resize-none flex-1 min-h-[360px] transition-all"
                spellCheck={false}
              />

              <div className="text-[11px] text-white/60 flex items-center justify-between font-mono">
                <span>Syncs to <code className="text-[#818cf8]">content/personas/{currentPersona.slug}.json</code></span>
                <span>Valid edits immediately update the Form controls</span>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
