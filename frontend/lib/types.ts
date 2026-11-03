export type BotState = 'idle' | 'listening' | 'transcribing' | 'thinking' | 'speaking';

export type LanguageCode = 'en-IN' | 'hi-IN' | 'ta-IN';

export interface LanguageOption {
  code: LanguageCode;
  personaSlug: string;
  name: string;
  nativeName: string;
  displayName: string;
  color: string;
  hoverClass: string;
  activeClass: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string; // ISO or formatted
  mode: 'voice' | 'text';
  languageCode?: LanguageCode;
  languageLabel?: string;
  audioBlobUrl?: string; // audio replay for voice messages
  sources?: { title: string; similarity: number }[];
  timing?: { stt: number; rag: number; llm: number; tts: number };
}

export interface ChatSession {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  languageCode: LanguageCode;
  messages: ChatMessage[];
}

export type TurnEvent =
  | { t: 'transcript'; text: string }
  | { t: 'sources'; items: { title: string; similarity: number }[] }
  | { t: 'sentence'; i: number; text: string }
  | { t: 'audio'; i: number; seq: number; fmt: string; rate: number; b64: string }
  | { t: 'timing'; stt: number; rag: number; llm: number; tts: number }
  | { t: 'done' }
  | { t: 'error'; code: string; retryAfter?: number };
