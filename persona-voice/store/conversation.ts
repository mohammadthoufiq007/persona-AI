import { create } from 'zustand';

export type AppState = 'idle' | 'listening' | 'thinking' | 'speaking' | 'error' | 'busy';

export interface PublicPersona {
  slug: string;
  name: string;
  public_config: {
    name: string;
    languageLabel: string;
    accentColor: string;
    greetingText: string;
  };
}

export interface LatencyTelemetry {
  stt?: number;
  rag?: number;
  llm?: number;
  tts?: number;
}

export interface HistoryItem {
  role: 'user' | 'assistant';
  content: string;
}

interface ConversationStore {
  state: AppState;
  activePersona: PublicPersona | null;
  personas: PublicPersona[];
  transcript: string;
  reply: string;
  sources: { title: string; similarity: number }[];
  latency: LatencyTelemetry;
  memories: string[];
  quotaLeft: number;
  history: HistoryItem[];
  abortController: AbortController | null;
  errorMessage: string | null;

  setState: (s: AppState) => void;
  setPersona: (p: PublicPersona) => void;
  setPersonas: (ps: PublicPersona[]) => void;
  setTranscript: (t: string) => void;
  appendReply: (text: string) => void;
  clearTurn: () => void;
  setSources: (s: { title: string; similarity: number }[]) => void;
  setLatency: (l: Partial<LatencyTelemetry>) => void;
  setQuotaLeft: (q: number) => void;
  setErrorMessage: (msg: string | null) => void;
  startTurn: () => AbortController;
  barge: () => void;
}

export const useConversationStore = create<ConversationStore>((set, get) => ({
  state: 'idle',
  activePersona: null,
  personas: [],
  transcript: '',
  reply: '',
  sources: [],
  latency: {},
  memories: [],
  quotaLeft: 300,
  history: [],
  abortController: null,
  errorMessage: null,

  setState: (state) => set({ state }),
  setPersona: (activePersona) => set({ activePersona, reply: '', transcript: '', sources: [] }),
  setPersonas: (personas) => set({ personas }),
  setTranscript: (transcript) => set({ transcript }),
  appendReply: (text) => set((s) => ({ reply: s.reply + text })),
  clearTurn: () => set({ transcript: '', reply: '', sources: [], errorMessage: null }),
  setSources: (sources) => set({ sources }),
  setLatency: (latency) => set((s) => ({ latency: { ...s.latency, ...latency } })),
  setQuotaLeft: (quotaLeft) => set({ quotaLeft }),
  setErrorMessage: (errorMessage) => set({ errorMessage, state: 'error' }),

  startTurn: () => {
    const existing = get().abortController;
    if (existing) {
      existing.abort();
    }
    const ac = new AbortController();
    set({
      abortController: ac,
      transcript: '',
      reply: '',
      sources: [],
      errorMessage: null,
    });
    return ac;
  },

  barge: () => {
    const { abortController } = get();
    if (abortController) {
      abortController.abort();
    }
    set({
      abortController: null,
      state: 'listening',
    });
  },
}));
