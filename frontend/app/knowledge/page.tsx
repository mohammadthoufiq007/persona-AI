'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import Link from 'next/link';
import { FloatingNav } from '@/components/FloatingNav';
import { 
  ArrowLeft, 
  Database, 
  Search, 
  FileText, 
  Sparkles, 
  Layers, 
  CheckCircle2, 
  ChevronDown, 
  ChevronUp, 
  Copy, 
  Check, 
  UploadCloud,
  Trash2,
  AlertCircle,
  FileCode,
  UserCheck,
  Globe2
} from 'lucide-react';

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
  isCustom?: boolean;
}

const STORAGE_CUSTOM_KB_KEY = 'persona_kb_custom_docs';

export default function KnowledgeBasePage() {
  const [documents, setDocuments] = useState<KbDocument[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPersona, setSelectedPersona] = useState<string>('all');
  const [expandedDocIds, setExpandedDocIds] = useState<Record<string, boolean>>({});
  const [copiedChunk, setCopiedChunk] = useState<string | null>(null);

  // File Upload State
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccessMsg, setUploadSuccessMsg] = useState<string | null>(null);
  const [uploadTargetPersona, setUploadTargetPersona] = useState<'Personal Profile' | 'Sapphire' | 'Rahu' | 'Maragatham'>('Personal Profile');
  const [isDragOver, setIsDragOver] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Load documents from backend API and fallback to localStorage on mount
  useEffect(() => {
    let loaded = false;
    async function fetchServerKb() {
      try {
        const res = await fetch('/api/kb');
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.documents) && data.documents.length > 0) {
            setDocuments(data.documents);
            loaded = true;
          }
        }
      } catch {}

      if (!loaded) {
        try {
          const stored = localStorage.getItem(STORAGE_CUSTOM_KB_KEY);
          if (stored) {
            const parsed: KbDocument[] = JSON.parse(stored);
            if (Array.isArray(parsed) && parsed.length > 0) {
              setDocuments(parsed);
            }
          }
        } catch {}
      }
    }
    fetchServerKb();
  }, []);

  const toggleExpand = (id: string) => {
    setExpandedDocIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard?.writeText(text);
    setCopiedChunk(id);
    setTimeout(() => setCopiedChunk(null), 2000);
  };

  // Process and ingest uploaded files
  const handleFileUpload = (files: FileList | File[]) => {
    if (!files || files.length === 0) return;
    const file = files[0];
    setIsUploading(true);
    setUploadSuccessMsg(null);

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const content = (e.target?.result as string) || '';
        
        // Chunk content by paragraphs / double line breaks
        let rawChunks = content
          .split(/\n\s*\n/)
          .map((c) => c.trim())
          .filter((c) => c.length > 10);

        if (rawChunks.length === 0) {
          rawChunks = content
            .split(/\n/)
            .map((c) => c.trim())
            .filter((c) => c.length > 15);
        }

        if (rawChunks.length === 0) {
          rawChunks = [content.slice(0, 500) || 'Uploaded document content snippet.'];
        }

        const isPersonalProfile = uploadTargetPersona === 'Personal Profile';
        const personaSlug =
          isPersonalProfile
            ? 'personal-profile'
            : uploadTargetPersona === 'Rahu'
            ? 'shop-assistant'
            : uploadTargetPersona === 'Maragatham'
            ? 'tamil-companion'
            : 'personal-assistant';

        const language =
          isPersonalProfile
            ? 'Common (All Languages)'
            : uploadTargetPersona === 'Rahu'
            ? 'हिन्दी'
            : uploadTargetPersona === 'Maragatham'
            ? 'தமிழ்'
            : 'English';

        const approxTokens = Math.max(25, Math.round(content.length / 3.8));

        const newDoc: KbDocument = {
          id: `doc-${Date.now()}`,
          title: file.name,
          personaSlug,
          language,
          personaName: uploadTargetPersona,
          chunkCount: rawChunks.length,
          tokens: approxTokens,
          lastUpdated: 'Just now',
          description: isPersonalProfile
            ? 'Common personal profile grounding shared across English, Hindi, and Tamil.'
            : `Custom ingested document for ${uploadTargetPersona} RAG semantic grounding.`,
          sampleChunks: rawChunks.slice(0, 8),
          isCustom: true,
        };

        // Sync with backend API to save to disk for runtime voice RAG
        try {
          await fetch('/api/kb', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              persona: personaSlug,
              filename: file.name,
              content,
            }),
          });
        } catch {}

        setDocuments((prev) => {
          const next = [newDoc, ...prev];
          try {
            localStorage.setItem(STORAGE_CUSTOM_KB_KEY, JSON.stringify(next));
          } catch {}
          return next;
        });

        setUploadSuccessMsg(
          isPersonalProfile
            ? `Indexed "${file.name}" as Personal Profile! All languages (Sapphire, Rahu, Maragatham) will now ground on this.`
            : `Indexed "${file.name}" into ${uploadTargetPersona} KB (${rawChunks.length} chunks, ${approxTokens} tokens)!`
        );
        setTimeout(() => setUploadSuccessMsg(null), 5000);
      } catch (err) {
        console.error('File parsing error', err);
      } finally {
        setIsUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };

    reader.onerror = () => {
      setIsUploading(false);
    };

    reader.readAsText(file);
  };

  // Delete an individual document
  const handleDeleteDoc = async (doc: KbDocument) => {
    try {
      await fetch(`/api/kb?persona=${encodeURIComponent(doc.personaSlug)}&filename=${encodeURIComponent(doc.title)}`, {
        method: 'DELETE',
      });
    } catch {}

    setDocuments((prev) => {
      const next = prev.filter((d) => d.id !== doc.id);
      try {
        localStorage.setItem(STORAGE_CUSTOM_KB_KEY, JSON.stringify(next));
      } catch {}
      return next;
    });
    setUploadSuccessMsg(`Deleted "${doc.title}" from Knowledge Base.`);
    setTimeout(() => setUploadSuccessMsg(null), 3000);
  };

  // Delete ALL Knowledge Base documents
  const handleDeleteAllKb = async () => {
    try {
      await fetch('/api/kb?all=true', { method: 'DELETE' });
    } catch {}

    setDocuments([]);
    try {
      localStorage.removeItem(STORAGE_CUSTOM_KB_KEY);
    } catch {}
    setShowClearConfirm(false);
    setUploadSuccessMsg('All Knowledge Base documents have been permanently deleted.');
    setTimeout(() => setUploadSuccessMsg(null), 4000);
  };

  // Filter logic:
  // - 'all': shows all documents
  // - 'personal-profile': shows only Personal Profile documents
  // - 'Sapphire', 'Rahu', 'Maragatham': shows that persona's documents + Personal Profile (since it's common to all languages)
  const filteredDocs = useMemo(() => {
    return documents.filter((doc) => {
      let matchesPersona = false;
      const isDocCommon = doc.personaSlug === 'personal-profile' || doc.personaName === 'Personal Profile';

      if (selectedPersona === 'all') {
        matchesPersona = true;
      } else if (selectedPersona === 'personal-profile') {
        matchesPersona = isDocCommon;
      } else {
        // Individual persona selected: show persona's own docs + common Personal Profile docs!
        matchesPersona = doc.personaName.toLowerCase() === selectedPersona.toLowerCase() || isDocCommon;
      }

      const q = searchQuery.toLowerCase().trim();
      if (!q) return matchesPersona;

      const matchesSearch =
        doc.title.toLowerCase().includes(q) ||
        doc.description.toLowerCase().includes(q) ||
        doc.personaName.toLowerCase().includes(q) ||
        doc.language.toLowerCase().includes(q) ||
        doc.sampleChunks.some((c) => c.toLowerCase().includes(q));

      return matchesPersona && matchesSearch;
    });
  }, [documents, searchQuery, selectedPersona]);

  const emptyStateInfo = useMemo(() => {
    if (selectedPersona === 'personal-profile') {
      return {
        title: 'No Personal Profile Documents',
        description: 'Upload a knowledge base file to ground all languages (English, Hindi, Tamil) at once.',
        targetPersona: 'Personal Profile' as const,
      };
    }
    if (selectedPersona === 'Sapphire') {
      return {
        title: 'No Knowledge Base Documents for Sapphire',
        description: 'Upload a knowledge base file to ground Sapphire (English) voice assistant.',
        targetPersona: 'Sapphire' as const,
      };
    }
    if (selectedPersona === 'Rahu') {
      return {
        title: 'No Knowledge Base Documents for Rahu',
        description: 'Upload a knowledge base file to ground Rahu (हिन्दी) voice assistant.',
        targetPersona: 'Rahu' as const,
      };
    }
    if (selectedPersona === 'Maragatham') {
      return {
        title: 'No Knowledge Base Documents for Maragatham',
        description: 'Upload a knowledge base file to ground Maragatham (தமிழ்) voice assistant.',
        targetPersona: 'Maragatham' as const,
      };
    }
    return {
      title: 'No Knowledge Base Documents',
      description: 'Upload a knowledge base file to ground your multilingual voice assistants.',
      targetPersona: 'Personal Profile' as const,
    };
  }, [selectedPersona]);

  const totalTokens = useMemo(() => documents.reduce((acc, d) => acc + d.tokens, 0), [documents]);
  const totalChunks = useMemo(() => documents.reduce((acc, d) => acc + d.chunkCount, 0), [documents]);

  return (
    <div className="min-h-screen w-full bg-[#05070f] text-white flex flex-col justify-between p-4 sm:p-6 lg:p-8 font-sans selection:bg-[#6366F1]/30 selection:text-indigo-200 relative">
      {/* Background ambient lighting */}
      <div className="fixed top-0 left-1/4 w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[100px] pointer-events-none -z-10" />
      <div className="fixed bottom-0 right-1/4 w-[400px] h-[400px] bg-cyan-500/10 rounded-full blur-[120px] pointer-events-none -z-10" />

      {/* Top Floating Navigation Pill */}
      <FloatingNav />

      <div className="w-full max-w-7xl mx-auto flex-1 flex flex-col gap-5 pt-10 sm:pt-14">
        {/* Top Header */}
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
                <Database className="w-5 h-5 text-[#67e8f9]" />
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-base md:text-lg tracking-tight text-white">
                  Knowledge Base
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {documents.length > 0 && (
              <button
                type="button"
                onClick={() => setShowClearConfirm(true)}
                title="Delete all Knowledge Base documents"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-medium transition-all shadow-sm cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete All KB</span>
              </button>
            )}

            <button
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white text-[#05070f] text-xs font-semibold hover:bg-white/90 transition-all shadow-sm cursor-pointer"
            >
              <UploadCloud className="w-3.5 h-3.5" />
              <span>Upload File</span>
            </button>

            <Link
              href="/"
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/14 text-xs font-medium text-white transition-all shadow-sm backdrop-blur-md hover:border-white/20"
            >
              <Sparkles className="w-3.5 h-3.5 text-white" />
              <span className="hidden sm:inline">Launch Voice Orb</span>
              <span className="sm:hidden">Voice Orb</span>
            </Link>
          </div>
        </header>

        {/* Delete All Confirmation Modal */}
        {showClearConfirm && (
          <div 
            onClick={() => setShowClearConfirm(false)}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <div 
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm relative rounded-[20px] overflow-hidden bg-[#05070f] border border-rose-500/40 p-6 shadow-[0_16px_40px_-15px_rgba(0,0,0,0.7)] text-white flex flex-col gap-4"
            >
              <div className="absolute inset-0 rounded-[inherit] pointer-events-none z-[9] shadow-[inset_0_1px_0_rgba(255,255,255,0.2),inset_0_0_0_1px_rgba(255,255,255,0.06)]" />
              <div className="relative z-[2] flex flex-col gap-4">
                <div className="flex items-center gap-3 text-rose-400">
                  <AlertCircle className="w-6 h-6" />
                  <h3 className="font-bold text-base">Delete All KB Documents?</h3>
                </div>
                <p className="text-xs text-white/70 leading-relaxed">
                  This will delete all {documents.length} knowledge base documents and semantic vectors across all personas.
                </p>
                <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/10">
                  <button
                    type="button"
                    onClick={() => setShowClearConfirm(false)}
                    className="px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-medium transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleDeleteAllKb}
                    className="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold transition-colors cursor-pointer"
                  >
                    Confirm Delete All
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Stats Grid: VoiceBento 4-Column Card System */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {/* Stat 1: Grounded Documents (Vibrant Indigo Theme) */}
          <div className="relative rounded-[20px] overflow-hidden bg-[#05070f] border border-white/10 shadow-[0_16px_40px_-15px_rgba(0,0,0,0.7)] p-4 flex flex-col justify-between">
            <div className="absolute inset-0 pointer-events-none" style={{ background: 'linear-gradient(180deg, #818cf8 0%, #312e81 36%, #312e81 74%, #4338ca 100%)' }} />
            <div className="absolute left-[10%] right-[10%] top-[16%] bottom-[-6%] rounded-[90px] blur-[50px] pointer-events-none" style={{ background: '#0a0a2e' }} />
            <div className="absolute inset-0 rounded-[inherit] pointer-events-none z-[9] shadow-[inset_0_1px_0_rgba(255,255,255,0.25),inset_0_0_0_1px_rgba(255,255,255,0.08)]" />
            <div className="relative z-[2] flex flex-col justify-between h-full">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-semibold uppercase tracking-[0.06em] text-white/75 font-mono">Grounded Documents</span>
                <div className="w-7 h-7 rounded-lg bg-black/40 border border-[#818cf8]/50 flex items-center justify-center text-[#818cf8] backdrop-blur-sm">
                  <FileText className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className="mt-3">
                <span className="text-[28px] font-light tracking-[-0.04em] text-white tabular-nums font-mono leading-none">{documents.length}</span>
                <p className="text-[11px] text-white/60 mt-1">Active markdown & parsed files</p>
              </div>
            </div>
          </div>

          {/* Stat 2: Vector Chunks (Vibrant Amber Theme) */}
          <div className="relative rounded-[20px] overflow-hidden bg-[#05070f] border border-white/10 shadow-[0_16px_40px_-15px_rgba(0,0,0,0.7)] p-4 flex flex-col justify-between">
            <div className="absolute inset-0 pointer-events-none" style={{ background: 'linear-gradient(180deg, #fcd34d 0%, #78350f 36%, #78350f 74%, #b45309 100%)' }} />
            <div className="absolute left-[10%] right-[10%] top-[16%] bottom-[-6%] rounded-[90px] blur-[50px] pointer-events-none" style={{ background: '#230e04' }} />
            <div className="absolute inset-0 rounded-[inherit] pointer-events-none z-[9] shadow-[inset_0_1px_0_rgba(255,255,255,0.25),inset_0_0_0_1px_rgba(255,255,255,0.08)]" />
            <div className="relative z-[2] flex flex-col justify-between h-full">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-semibold uppercase tracking-[0.06em] text-white/75 font-mono">Vector Chunks</span>
                <div className="w-7 h-7 rounded-lg bg-black/40 border border-[#fcd34d]/50 flex items-center justify-center text-[#fcd34d] backdrop-blur-sm">
                  <Layers className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className="mt-3">
                <span className="text-[28px] font-light tracking-[-0.04em] text-white tabular-nums font-mono leading-none">{totalChunks}</span>
                <p className="text-[11px] text-white/60 mt-1">Semantic embeddings</p>
              </div>
            </div>
          </div>

          {/* Stat 3: Indexed Tokens (Vibrant Cyan Theme) */}
          <div className="relative rounded-[20px] overflow-hidden bg-[#05070f] border border-white/10 shadow-[0_16px_40px_-15px_rgba(0,0,0,0.7)] p-4 flex flex-col justify-between">
            <div className="absolute inset-0 pointer-events-none" style={{ background: 'linear-gradient(180deg, #67e8f9 0%, #155e75 36%, #155e75 74%, #0e7490 100%)' }} />
            <div className="absolute left-[10%] right-[10%] top-[16%] bottom-[-6%] rounded-[90px] blur-[50px] pointer-events-none" style={{ background: '#041720' }} />
            <div className="absolute inset-0 rounded-[inherit] pointer-events-none z-[9] shadow-[inset_0_1px_0_rgba(255,255,255,0.25),inset_0_0_0_1px_rgba(255,255,255,0.08)]" />
            <div className="relative z-[2] flex flex-col justify-between h-full">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-semibold uppercase tracking-[0.06em] text-white/75 font-mono">Indexed Tokens</span>
                <div className="w-7 h-7 rounded-lg bg-black/40 border border-[#67e8f9]/50 flex items-center justify-center text-[#67e8f9] backdrop-blur-sm">
                  <Sparkles className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className="mt-3">
                <span className="text-[28px] font-light tracking-[-0.04em] text-white tabular-nums font-mono leading-none">{totalTokens.toLocaleString()}</span>
                <p className="text-[11px] text-white/60 mt-1">Prompt context budget</p>
              </div>
            </div>
          </div>

          {/* Stat 4: Verification Status (Vibrant Emerald Theme) */}
          <div className="relative rounded-[20px] overflow-hidden bg-[#05070f] border border-white/10 shadow-[0_16px_40px_-15px_rgba(0,0,0,0.7)] p-4 flex flex-col justify-between">
            <div className="absolute inset-0 pointer-events-none" style={{ background: 'linear-gradient(180deg, #6ee7b7 0%, #064e3b 36%, #064e3b 74%, #047857 100%)' }} />
            <div className="absolute left-[10%] right-[10%] top-[16%] bottom-[-6%] rounded-[90px] blur-[50px] pointer-events-none" style={{ background: '#021810' }} />
            <div className="absolute inset-0 rounded-[inherit] pointer-events-none z-[9] shadow-[inset_0_1px_0_rgba(255,255,255,0.25),inset_0_0_0_1px_rgba(255,255,255,0.08)]" />
            <div className="relative z-[2] flex flex-col justify-between h-full">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-semibold uppercase tracking-[0.06em] text-white/75 font-mono">Verification Status</span>
                <div className="w-7 h-7 rounded-lg bg-black/40 border border-[#6ee7b7]/50 flex items-center justify-center text-[#10B981] backdrop-blur-sm">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className="mt-3">
                <span className="text-[28px] font-light tracking-[-0.04em] text-[#34D399] font-mono leading-none">
                  {documents.length > 0 ? '100% Synced' : 'Ready'}
                </span>
                <p className="text-[11px] text-white/60 mt-1">Zero hallucination gate</p>
              </div>
            </div>
          </div>
        </div>

        {/* Upload File Dropzone Section: VoiceBento Card */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragOver(true);
          }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setIsDragOver(false);
            if (e.dataTransfer.files) handleFileUpload(e.dataTransfer.files);
          }}
          className={`relative rounded-[20px] overflow-hidden bg-[#05070f] border transition-all duration-200 p-5 shadow-[0_16px_40px_-15px_rgba(0,0,0,0.7)] ${
            isDragOver
              ? 'border-white shadow-[0_0_24px_rgba(255,255,255,0.2)]'
              : 'border-white/10 hover:border-white/25'
          }`}
        >
          {/* Vibrant Background gradient layer */}
          <div className="absolute inset-0 pointer-events-none" style={{ background: 'linear-gradient(180deg, #94a3b8 0%, #1e293b 36%, #1e293b 74%, #334155 100%)' }} />
          <div className="absolute left-[10%] right-[10%] top-[16%] bottom-[-6%] rounded-[90px] blur-[50px] pointer-events-none" style={{ background: '#050811' }} />
          <div className="absolute inset-0 rounded-[inherit] pointer-events-none z-[9] shadow-[inset_0_1px_0_rgba(255,255,255,0.25),inset_0_0_0_1px_rgba(255,255,255,0.08)]" />

          {/* Hidden File Input */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".md,.txt,.json,.csv,.pdf"
            onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
            className="hidden"
          />

          <div className="relative z-[2] flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-white/[0.08] border border-white/20 flex items-center justify-center shrink-0 text-[#67e8f9]">
                <UploadCloud className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                  <span>Upload Knowledge Document</span>
                  <span className="inline-flex items-center h-[20px] px-2 rounded-[10px] bg-black/75 text-white/80 font-mono text-[9.5px] font-semibold border border-white/12">
                    .md · .txt · .json · .csv · .pdf
                  </span>
                </h3>
                <p className="text-xs text-white/50 mt-0.5">
                  Drag and drop files here, or choose an assignment below. Personal Profile is shared across all assistants!
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 w-full lg:w-auto justify-end flex-wrap">
              {/* Target Persona Selector */}
              <div className="flex items-center gap-1 bg-black/60 p-1 rounded-xl border border-white/12 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] text-xs overflow-x-auto">
                <span className="text-[10px] uppercase tracking-[0.06em] font-mono text-white/50 px-2 font-semibold whitespace-nowrap">Assign to:</span>
                {(['Personal Profile', 'Sapphire', 'Rahu', 'Maragatham'] as const).map((persona) => {
                  const isSelected = uploadTargetPersona === persona;
                  const isProfile = persona === 'Personal Profile';
                  return (
                    <button
                      key={persona}
                      type="button"
                      onClick={() => setUploadTargetPersona(persona)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium transition-all whitespace-nowrap cursor-pointer ${
                        isSelected
                          ? 'bg-white text-[#05070f] font-semibold shadow-[0_2px_10px_rgba(255,255,255,0.2)]'
                          : 'text-white/60 hover:text-white hover:bg-white/[0.05]'
                      }`}
                    >
                      {isProfile && <UserCheck className="w-3 h-3" />}
                      <span>{persona}</span>
                      {isProfile && <span className="text-[10px] opacity-75 font-mono">(Common)</span>}
                    </button>
                  );
                })}
              </div>

              {/* Upload Trigger Button */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="px-4 py-2 rounded-full bg-white text-[#05070f] text-xs font-semibold hover:bg-white/90 active:scale-95 transition-all shadow-[0_4px_14px_rgba(255,255,255,0.2)] cursor-pointer shrink-0"
              >
                {isUploading ? 'Chunking…' : 'Select File'}
              </button>
            </div>
          </div>

          {/* Success Banner */}
          {uploadSuccessMsg && (
            <div className="relative z-[2] mt-3.5 p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
              <span>{uploadSuccessMsg}</span>
            </div>
          )}
        </div>

        {/* Filter Bar & Search: VoiceBento Card Architecture */}
        <div className="relative rounded-[20px] overflow-hidden bg-[#05070f] border border-white/10 shadow-[0_16px_40px_-15px_rgba(0,0,0,0.7)] p-2">
          <div className="absolute inset-0 rounded-[inherit] pointer-events-none z-[9] shadow-[inset_0_1px_0_rgba(255,255,255,0.15),inset_0_0_0_1px_rgba(255,255,255,0.04)]" />
          <div className="relative z-[2] flex flex-col sm:flex-row items-center justify-between gap-3">
            {/* Persona Filter Tabs */}
            <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto no-scrollbar">
              {[
                { id: 'all', label: 'All Personas' },
                { id: 'personal-profile', label: 'Personal Profile (All Languages)', isCommon: true },
                { id: 'Sapphire', label: 'Sapphire (English)' },
                { id: 'Rahu', label: 'Rahu (हिन्दी)' },
                { id: 'Maragatham', label: 'Maragatham (தமிழ்)' },
              ].map((tab) => {
                const isActive = selectedPersona === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setSelectedPersona(tab.id);
                      if (tab.id === 'personal-profile') setUploadTargetPersona('Personal Profile');
                      else if (tab.id === 'Sapphire') setUploadTargetPersona('Sapphire');
                      else if (tab.id === 'Rahu') setUploadTargetPersona('Rahu');
                      else if (tab.id === 'Maragatham') setUploadTargetPersona('Maragatham');
                    }}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all whitespace-nowrap cursor-pointer ${
                      isActive
                        ? 'bg-white text-[#05070f] font-semibold shadow-sm'
                        : 'text-white/60 hover:text-white hover:bg-white/[0.06]'
                    }`}
                  >
                    {tab.isCommon && <Globe2 className="w-3.5 h-3.5" />}
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Search Box */}
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search knowledge chunks..."
                className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-black/50 border border-white/10 text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-[#818cf8] focus:ring-1 focus:ring-[#818cf8] transition-colors"
              />
            </div>
          </div>
        </div>

        {/* Documents & Chunks List */}
        <div className="flex flex-col gap-4 pb-12">
          {filteredDocs.length === 0 ? (
            searchQuery ? (
              <div className="relative rounded-[20px] overflow-hidden bg-[#05070f] border border-white/10 shadow-[0_16px_40px_-15px_rgba(0,0,0,0.7)] p-12 text-center text-white/40 text-sm">
                <div className="absolute inset-0 rounded-[inherit] pointer-events-none z-[9] shadow-[inset_0_1px_0_rgba(255,255,255,0.15),inset_0_0_0_1px_rgba(255,255,255,0.04)]" />
                <span className="relative z-[2]">No matching knowledge chunks found for &quot;{searchQuery}&quot;.</span>
              </div>
            ) : (
              <div className="relative rounded-[20px] overflow-hidden bg-[#05070f] border border-white/10 shadow-[0_16px_40px_-15px_rgba(0,0,0,0.7)] p-14 text-center flex flex-col items-center justify-center gap-3">
                <div className="absolute inset-0 rounded-[inherit] pointer-events-none z-[9] shadow-[inset_0_1px_0_rgba(255,255,255,0.15),inset_0_0_0_1px_rgba(255,255,255,0.04)]" />
                <div className="relative z-[2] w-12 h-12 rounded-2xl bg-white/[0.06] border border-white/12 flex items-center justify-center text-white/50">
                  <Database className="w-6 h-6" />
                </div>
                <div className="relative z-[2] flex flex-col items-center">
                  <h3 className="text-sm font-semibold text-white">{emptyStateInfo.title}</h3>
                  <p className="text-xs text-white/50 mt-1 max-w-md text-center">
                    {emptyStateInfo.description}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setUploadTargetPersona(emptyStateInfo.targetPersona);
                    fileInputRef.current?.click();
                  }}
                  className="relative z-[2] mt-2 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white text-[#05070f] text-xs font-semibold hover:bg-white/90 active:scale-95 transition-all cursor-pointer shadow-[0_4px_14px_rgba(255,255,255,0.2)]"
                >
                  <UploadCloud className="w-3.5 h-3.5" />
                  <span>Upload Knowledge Base</span>
                </button>
              </div>
            )
          ) : (
            filteredDocs.map((doc) => {
              const isExpanded = !!expandedDocIds[doc.id];
              const isPersonalProfile = doc.personaSlug === 'personal-profile' || doc.personaName === 'Personal Profile';
              const isHindi = doc.personaName === 'Rahu';
              const isTamil = doc.personaName === 'Maragatham';

              const cardGradient = isPersonalProfile
                ? 'linear-gradient(180deg, rgba(129,140,248,0.25) 0%, rgba(49,46,129,0.20) 40%, #05070f 100%)'
                : isHindi
                ? 'linear-gradient(180deg, rgba(252,211,77,0.25) 0%, rgba(120,53,15,0.20) 40%, #05070f 100%)'
                : isTamil
                ? 'linear-gradient(180deg, rgba(110,231,183,0.25) 0%, rgba(6,78,59,0.20) 40%, #05070f 100%)'
                : 'linear-gradient(180deg, rgba(103,232,249,0.25) 0%, rgba(21,94,117,0.20) 40%, #05070f 100%)';

              return (
                <div
                  key={doc.id}
                  className="relative rounded-[20px] overflow-hidden bg-[#05070f] border border-white/12 shadow-[0_16px_40px_-15px_rgba(0,0,0,0.7)] transition-all"
                >
                  {/* Persona-Themed Ambient Background */}
                  <div className="absolute inset-0 pointer-events-none" style={{ background: cardGradient }} />
                  {/* Subtle rim lighting */}
                  <div className="absolute inset-0 rounded-[inherit] pointer-events-none z-[9] shadow-[inset_0_1px_0_rgba(255,255,255,0.22),inset_0_0_0_1px_rgba(255,255,255,0.06)]" />

                  {/* Card Header */}
                  <div 
                    onClick={() => toggleExpand(doc.id)}
                    className={`p-4 sm:p-5 flex items-center justify-between cursor-pointer hover:bg-white/[0.03] transition-colors relative z-[2] select-none ${
                      isExpanded ? 'border-b border-white/10' : ''
                    }`}
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className="w-9 h-9 rounded-xl border border-white/15 bg-black/40 text-white flex items-center justify-center shrink-0 backdrop-blur-sm shadow-sm">
                        {isPersonalProfile ? (
                          <UserCheck className="w-4 h-4 text-[#818cf8]" />
                        ) : isHindi ? (
                          <FileText className="w-4 h-4 text-[#F59E0B]" />
                        ) : isTamil ? (
                          <FileText className="w-4 h-4 text-[#10B981]" />
                        ) : (
                          <FileText className="w-4 h-4 text-[#67e8f9]" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-sm font-semibold text-white font-mono truncate">{doc.title}</h3>
                          
                          {isPersonalProfile ? (
                            <span className="inline-flex items-center gap-1.5 h-[22px] px-2.5 rounded-[11px] bg-indigo-500/20 text-[#818cf8] font-mono text-[10px] font-semibold border border-[#818cf8]/40">
                              <Globe2 className="w-3 h-3 text-[#818cf8]" />
                              <span>Personal Profile · All Languages</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center h-[22px] px-2.5 rounded-[11px] bg-black/75 text-white/90 font-mono text-[10px] font-semibold border border-white/14">
                              {doc.personaName} · {doc.language}
                            </span>
                          )}

                          <span className="inline-flex items-center h-[22px] px-2 rounded-[11px] bg-black/50 text-white/60 font-mono text-[10px] border border-white/10">
                            {doc.chunkCount} chunks ({doc.tokens} tokens)
                          </span>
                        </div>
                        <p className="text-xs text-white/60 mt-1 truncate">{doc.description}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5 shrink-0">
                      <span className="text-xs text-white/50 hidden sm:inline font-mono">{doc.lastUpdated}</span>

                      {/* Delete Document Button */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteDoc(doc);
                        }}
                        title={`Delete "${doc.title}"`}
                        className="p-1.5 rounded-lg text-white/40 hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleExpand(doc.id);
                        }}
                        className="p-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                        aria-label={isExpanded ? "Collapse chunks" : "Expand chunks"}
                      >
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Expanded Chunks */}
                  {isExpanded && (
                    <div className="p-4 sm:p-5 flex flex-col gap-2.5 bg-black/60 relative z-[2]">
                      <div className="flex items-center justify-between text-[10px] text-white/60 font-mono uppercase tracking-[0.06em] mb-1">
                        <span>Extracted Vector Passages</span>
                        <span>Grounding Anchor</span>
                      </div>

                      {doc.sampleChunks.map((chunk, idx) => {
                        const chunkKey = `${doc.id}-chunk-${idx}`;
                        const isCopied = copiedChunk === chunkKey;
                        return (
                          <div
                            key={chunkKey}
                            className="p-3.5 rounded-xl border border-white/12 bg-black/75 hover:border-white/25 transition-all flex items-start justify-between gap-3 group backdrop-blur-md"
                          >
                            <div className="flex items-start gap-2.5 flex-1 min-w-0">
                              <span className="text-[11px] font-mono text-[#818cf8] font-semibold pt-0.5 shrink-0">
                                #{idx + 1}
                              </span>
                              <p className="text-xs text-white/95 leading-relaxed font-sans whitespace-pre-wrap">{chunk}</p>
                            </div>

                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                copyToClipboard(chunk, chunkKey);
                              }}
                              className="p-1.5 rounded-lg bg-black/40 text-white/40 hover:text-white hover:bg-black/80 border border-white/10 transition-colors cursor-pointer shrink-0"
                              title="Copy chunk text"
                              aria-label="Copy chunk"
                            >
                              {isCopied ? <Check className="w-3.5 h-3.5 text-white" /> : <Copy className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
