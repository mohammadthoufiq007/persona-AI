'use client';

import React, { useState } from 'react';
import { 
  Database, 
  X, 
  FileText, 
  Search, 
  CheckCircle2, 
  Sparkles, 
  Layers, 
  ExternalLink,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { LanguageCode } from '@/lib/types';

interface KnowledgeBasePaneProps {
  isOpen: boolean;
  onClose: () => void;
  activeLanguage: LanguageCode;
  onSelectLanguage?: (lang: LanguageCode) => void;
}

interface KbDocument {
  id: string;
  title: string;
  personaSlug: string;
  language: string;
  personaName: string;
  chunkCount: number;
  tokens: number;
  lastUpdated: string;
  description: string;
  sampleChunks: string[];
}

const KB_DOCUMENTS: Record<LanguageCode, KbDocument[]> = {
  'en-IN': [
    {
      id: 'doc-sapphire-1',
      title: 'our_projects_schedule.md',
      personaSlug: 'personal-assistant',
      language: 'English',
      personaName: 'Sapphire',
      chunkCount: 3,
      tokens: 420,
      lastUpdated: 'Updated today',
      description: 'Sprint milestones, demo recordings, and team review calendars.',
      sampleChunks: [
        'Demo recording session scheduled for today at 10:00 AM IST with team lead.',
        'Architecture review call for PersonaVoice with executive stakeholders at 2:00 PM IST.',
        'Thoufiq prefers filter coffee during morning coding sessions and avoids dairy after 6 PM.'
      ]
    }
  ],
  'hi-IN': [
    {
      id: 'doc-rahu-1',
      title: 'sharma_kirana_catalog.md',
      personaSlug: 'shop-assistant',
      language: 'हिन्दी',
      personaName: 'Rahu',
      chunkCount: 5,
      tokens: 580,
      lastUpdated: 'Live Inventory',
      description: 'Daily grocery catalog, real-time item prices, and bulk discount rates.',
      sampleChunks: [
        'Aashirvaad Shudh Chakki Atta (10kg packet): ₹420 (Special Diwali discount available).',
        'Tata Sampann Unpolished Toor Dal (1kg): ₹165 (Grade-A quality).',
        'Fresh Malai Paneer (200g pack): ₹90. Amul Taaza Toned Milk (1 Litre): ₹54.',
        'Fortune Sunlite Refined Sunflower Oil (1L Pouch): ₹135.'
      ]
    }
  ],
  'ta-IN': [
    {
      id: 'doc-maragatham-1',
      title: 'chennai_local_guide.md',
      personaSlug: 'tamil-companion',
      language: 'தமிழ்',
      personaName: 'Maragatham',
      chunkCount: 4,
      tokens: 610,
      lastUpdated: 'Transit & Metro',
      description: 'Chennai metro schedules, airport routes, and traditional South Indian food landmarks.',
      sampleChunks: [
        'Chennai Airport Blue Line first train departs from Chennai Central at 04:30 AM.',
        'Peak hours metro frequency is every 5 minutes between Guindy and Airport.',
        'Filter Coffee & Tiffin: Ratna Cafe in Triplicane opens at 6:00 AM for Sambhar Vadai.'
      ]
    },
    {
      id: 'doc-maragatham-2',
      title: 'thoufiq_master_profile.json.md',
      personaSlug: 'tamil-companion',
      language: 'தமிழ் / Tanglish',
      personaName: 'Maragatham',
      chunkCount: 8,
      tokens: 1250,
      lastUpdated: 'Creator Profile',
      description: 'Creator background, AI architecture, and project portfolio records.',
      sampleChunks: [
        'Mohammed Thoufiq is an AI engineer and developer specializing in voice agent architectures.',
        'Key projects include OncoAI, Wisp personal voice agent, and Flyrank vector pipelines.'
      ]
    }
  ]
};

export function KnowledgeBasePane({
  isOpen,
  onClose,
  activeLanguage,
  onSelectLanguage
}: KnowledgeBasePaneProps) {
  const [selectedPersonaLang, setSelectedPersonaLang] = useState<LanguageCode>(activeLanguage);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedDocId, setExpandedDocId] = useState<string | null>(null);

  // Sync with parent when language changes
  React.useEffect(() => {
    setSelectedPersonaLang(activeLanguage);
  }, [activeLanguage]);

  const docs = KB_DOCUMENTS[selectedPersonaLang] || [];
  const filteredDocs = docs.filter(
    (d) =>
      d.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.sampleChunks.some((c) => c.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <aside
      onClick={(e) => e.stopPropagation()}
      className={`fixed top-0 bottom-0 right-0 z-50 h-full w-[330px] sm:w-[390px] flex flex-col shrink-0 bg-[#0B0E1E] border-l border-[#1B203B] shadow-[0_0_50px_rgba(0,0,0,0.85)] transition-transform duration-300 ease-in-out select-none ${
        isOpen
          ? 'translate-x-0 opacity-100 pointer-events-auto'
          : 'translate-x-full opacity-0 pointer-events-none'
      }`}
      aria-label="Knowledge Base Side Pane"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-[#1B203B] bg-white/[0.01]">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shadow-md shadow-indigo-500/10">
            <Database className="w-5 h-5" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-white tracking-tight">
                Knowledge Base
              </span>
              <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                Live RAG
              </span>
            </div>
            <span className="text-[11px] text-slate-400 font-medium">
              Vector Grounding & Chunks
            </span>
          </div>
        </div>

        <button
          onClick={onClose}
          title="Close Knowledge Base"
          aria-label="Close Knowledge Base"
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Language / Persona Switcher Tabs */}
      <div className="px-4 pt-3 pb-2 border-b border-[#1B203B]/60 bg-black/20 flex items-center gap-1.5">
        {[
          { code: 'en-IN' as LanguageCode, label: 'Sapphire', lang: 'English' },
          { code: 'hi-IN' as LanguageCode, label: 'Rahu', lang: 'हिन्दी' },
          { code: 'ta-IN' as LanguageCode, label: 'Maragatham', lang: 'தமிழ்' },
        ].map((item) => {
          const isActive = selectedPersonaLang === item.code;
          return (
            <button
              key={item.code}
              onClick={() => {
                setSelectedPersonaLang(item.code);
                onSelectLanguage?.(item.code);
              }}
              className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-medium transition-all text-center cursor-pointer border ${
                isActive
                  ? 'bg-indigo-600/25 border-indigo-500/50 text-white shadow-sm'
                  : 'bg-white/[0.03] border-white/5 text-slate-400 hover:text-slate-200 hover:bg-white/[0.06]'
              }`}
            >
              <div className="leading-tight">{item.label}</div>
              <div className="text-[9px] opacity-75 font-normal">{item.lang}</div>
            </button>
          );
        })}
      </div>

      {/* Search Input */}
      <div className="p-4 pb-2">
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search indexed knowledge chunks..."
            className="w-full pl-9 pr-3 py-2 bg-white/[0.04] border border-[#1B203B] rounded-xl text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500/50 transition-colors"
          />
        </div>
      </div>

      {/* Document & Chunks List */}
      <div className="flex-1 overflow-y-auto px-4 py-2 space-y-3 scrollbar-thin scrollbar-thumb-white/10">
        <div className="text-[11px] text-slate-400 font-semibold px-1 flex items-center justify-between">
          <span>Connected Documents ({filteredDocs.length})</span>
          <span className="text-[10px] text-indigo-400 font-mono">pgvector: 768-d</span>
        </div>

        {filteredDocs.map((doc) => {
          const isExpanded = expandedDocId === doc.id;
          return (
            <div
              key={doc.id}
              className="rounded-2xl border border-[#1B203B] bg-white/[0.02] p-3.5 transition-all hover:border-indigo-500/30"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shrink-0">
                    <FileText className="w-4 h-4 text-indigo-400" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-xs text-white tracking-tight truncate max-w-[190px]">
                      {doc.title}
                    </h4>
                    <span className="text-[10px] text-slate-400">
                      {doc.chunkCount} chunks • {doc.tokens} tokens
                    </span>
                  </div>
                </div>

                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-medium border border-emerald-500/20 shrink-0">
                  {doc.lastUpdated}
                </span>
              </div>

              <p className="text-[11px] text-slate-400 mt-2 leading-relaxed">
                {doc.description}
              </p>

              {/* Toggle Chunks Button */}
              <button
                onClick={() => setExpandedDocId(isExpanded ? null : doc.id)}
                className="mt-3 w-full flex items-center justify-between py-1.5 px-2.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-[11px] text-slate-300 transition-colors cursor-pointer"
              >
                <span className="flex items-center gap-1.5">
                  <Layers className="w-3 h-3 text-indigo-400" />
                  <span>{isExpanded ? 'Hide Chunks' : 'View Grounding Chunks'}</span>
                </span>
                {isExpanded ? (
                  <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                )}
              </button>

              {/* Expanded Chunks Preview */}
              {isExpanded && (
                <div className="mt-2.5 pt-2.5 border-t border-[#1B203B] space-y-2 animate-in fade-in duration-200">
                  {doc.sampleChunks.map((chunk, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-xl bg-black/40 border border-white/5 text-[11px] text-slate-300 leading-relaxed font-sans"
                    >
                      <div className="text-[9px] font-mono text-indigo-400 mb-1 flex items-center justify-between">
                        <span>Chunk #{idx + 1}</span>
                        <span>similarity &gt; 0.55</span>
                      </div>
                      <p>{chunk}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Vector Specs Footer */}
      <div className="p-4 border-t border-[#1B203B] bg-black/40 text-[11px] text-slate-400 space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="text-slate-500">Vector Index:</span>
          <span className="font-mono text-slate-300">Supabase pgvector (HNSW)</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-slate-500">Cosine Threshold:</span>
          <span className="font-mono text-slate-300">0.55 similarity</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-slate-500">Embedding Dim:</span>
          <span className="font-mono text-emerald-400">768-d text-embedding-004</span>
        </div>
      </div>
    </aside>
  );
}
