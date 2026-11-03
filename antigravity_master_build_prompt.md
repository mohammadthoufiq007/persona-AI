# Master Prompt for Antigravity: Build "PersonaVoice" from Scratch

> **How to use this prompt:** Copy everything inside the block below and paste it directly into Antigravity alongside your project plan `.md` file (or use this as the primary kick-off prompt in your workspace).

---

## COPY BELOW THIS LINE

You are an elite, autonomous Principal Full-Stack Engineer and Voice AI Architect. Your task is to build **PersonaVoice** from scratch — a web-based, voice-first, multi-persona RAG assistant powered by **Gnani AI (Prisma STT + Timbre TTS)**, **Supabase (Postgres + pgvector + Storage)**, and **Next.js (App Router)**.

This project is being built for the **Great Indian AI Internship Challenge (Gnani AI)** where the primary evaluation vehicle is a **public 60-second video demo on LinkedIn/X** and live public testing on a strict **5,000 credit budget**. Therefore, both **visual polish (for silent-autoplay video viewers)** and **strict API credit protection** are non-negotiable architectural requirements.

Read the attached project specification carefully and build the complete, production-ready application step-by-step without skipping files or leaving placeholder `TODO` stubs.

---

### 1. HARD CONSTRAINTS & GUARDRAILS (NEVER VIOLATE THESE)

1. **Mandatory Gnani AI Integration (`https://api.vachana.ai`)**:
   - **Speech-to-Text (STT)**: Must use Gnani Prisma v2.5 REST (`POST https://api.vachana.ai/stt/v3` as `multipart/form-data`) with header `X-API-Key-ID: process.env.GNANI_API_KEY`.
   - **Text-to-Speech (TTS)**: Must use Gnani Timbre SSE Streaming (`POST https://api.vachana.ai/api/v1/tts/sse` as JSON) with header `X-API-Key-ID: process.env.GNANI_API_KEY`.
   - **Zero Client-Side Secret Leakage**: `GNANI_API_KEY`, `GEMINI_API_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` must ONLY be accessed inside Next.js Server Route Handlers (`app/api/**`). Never prefix them with `NEXT_PUBLIC_`.

2. **Browser Audio Encoding Rule (CRITICAL)**:
   - Browser `MediaRecorder` defaults to `audio/webm`, which **Gnani Prisma STT rejects**.
   - You MUST capture audio using `@ricky0123/vad-web` (or Web Audio API `AudioContext` / `ScriptProcessorNode` / `AudioWorklet`) and explicitly encode the `Float32Array` audio buffer into a **16 kHz, 16-bit, mono PCM `.wav` Blob** in the browser before `POST`ing to `/api/stt`.
   - Enforce a maximum utterance duration of **30 seconds** (hard cap at 60s) and discard audio buffers shorter than **0.4 seconds** so silence/clicks never burn Gnani credits.

3. **5,000 Credit Survival & Rate Limiting**:
   - Implement an in-memory / IP-based rate limiter middleware on `/api/stt`, `/api/chat`, and `/api/tts` (e.g., max 15 turns per IP per 10 minutes, plus a global daily safety cap).
   - When rate-limited or if credits fail (HTTP 403/429), gracefully return a pre-generated/cached fallback audio response and caption: *"Demo limit reached for this session, please try again shortly or use text mode."*
   - Pre-cache or memoize TTS audio in memory/IndexedDB for each persona's initial `greeting` and standard error phrases so repeated page loads consume **0 TTS credits**.

4. **Spoken-Style LLM & TTS Normalization**:
   - Every LLM system prompt MUST enforce: **1–2 short spoken sentences maximum, zero markdown (`*`, `#`, `-`), zero bullet lists, and no emojis.**
   - Before sending any sentence to `/api/tts`, pass it through `lib/tts-normalizer.ts` which converts currency (`₹450` -> `four hundred fifty rupees`), percentages, dates, and digits into spoken words so Gnani Timbre pronounces Indian numbers and rupees naturally.

5. **Latency Budget (~2.0 Seconds End-of-Speech to First Audio)**:
   - Stream the LLM output from `/api/chat`, split tokens into complete sentences via `lib/sentence-splitter.ts`, and trigger `/api/tts` for **Sentence 1** immediately while Sentence 2 is still generating.
   - Log stage timings (`stt_ms`, `rag_ms`, `llm_first_sentence_ms`, `tts_first_byte_ms`) and display a subtle, toggleable **"Latency Telemetry Pill"** in the UI corner (looks incredible in technical demo videos).

---

### 2. TECH STACK & LOCKED ARCHITECTURAL DECISIONS

- **Framework**: Next.js 14/15 (App Router, TypeScript, Tailwind CSS)
- **State Machine**: `zustand` (`idle` | `listening` | `thinking` | `speaking` | `error`)
- **Animations**: `framer-motion` + HTML5 Canvas / CSS 3D shaders for the central reactive Voice Orb
- **Icons**: `lucide-react`
- **Voice Activity Detection**: `@ricky0123/vad-web` with automatic fallback to a **Push-to-Talk / Tap-to-Speak** mode if WASM/ONNX assets fail to load or if the user is in a noisy environment
- **LLM & Embeddings**: Google Gemini (`@google/generative-ai`)
  - Brain: `gemini-2.5-flash` (ultra-low time-to-first-token)
  - Embeddings: `text-embedding-004` (`768` dimensions — matches `vector(768)` in Supabase)
- **Database**: `@supabase/supabase-js` with Postgres + `pgvector`
- **Document Parsing**: `pdf-parse` (for PDFs) + native `.txt` and `.md` parsing

---

### 3. EXACT FILE TREE TO GENERATE

Build the project matching this exact structure:

```text
persona-voice/
├─ .env.example
├─ next.config.mjs
├─ package.json
├─ supabase/
│  ├─ migrations/
│  │  └─ 001_initial_schema.sql      # Full pgvector schema + match_chunks RPC
│  └─ seed.sql                       # Seed the 3 demo personas + initial KB chunks
├─ personas/
│  ├─ personal-assistant.json        # English/Tanglish ("Aria - Personal OS")
│  ├─ shop-assistant.json            # Hinglish ("Kadai / Kirana Helper")
│  └─ tamil-companion.json           # Tamil/Tanglish ("Namma Chennai Companion")
├─ lib/
│  ├─ supabase.ts                    # Server & client Supabase initializers
│  ├─ rate-limit.ts                  # IP token-bucket rate limiter to protect 5,000 credits
│  ├─ gnani.ts                       # Typed wrappers for Prisma STT (/stt/v3) & Timbre TTS (/api/v1/tts/sse)
│  ├─ wav-encoder.ts                 # Float32Array (16kHz mono) -> valid RIFF WAVE Blob
│  ├─ vad.ts                         # @ricky0123/vad-web wrapper + mic level analyzer + barge-in trigger
│  ├─ audio-queue.ts                 # Web Audio API gapless PCM/MP3 playback queue + instant stop() for barge-in
│  ├─ tts-normalizer.ts              # ₹, numbers, dates, abbreviations -> spoken Indian English/Hinglish words
│  ├─ sentence-splitter.ts           # Streaming token buffer -> emits complete sentences on [.?!।]
│  ├─ embed.ts                       # Gemini text-embedding-004 (768-d) wrapper
│  ├─ retrieval.ts                   # Supabase match_chunks RPC + persona memories fetcher
│  └─ llm.ts                         # Swappable streaming LLM interface (Gemini 2.5 Flash + memory intent detector)
├─ store/
│  └─ conversation.ts                # Zustand store: state machine, active persona, live captions, sources, latency metrics
├─ components/
│  ├─ VoiceOrb.tsx                   # Framer Motion + Web Audio AnalyserNode reactive orb (idle/listening/thinking/speaking)
│  ├─ LiveCaptions.tsx               # High-contrast burned-in style captions optimized for LinkedIn/X silent autoplay
│  ├─ PersonaSwitcher.tsx            # Instant persona pill selector showing language, voice badge, and theme accent
│  ├─ SourcesChip.tsx                # Popover chip showing exact KB document title + similarity score used for the answer
│  ├─ TelemetryBar.tsx               # Real-time stage latency pills (STT ms | RAG ms | LLM ms | TTS ms)
│  ├─ TextFallbackBar.tsx            # Keyboard input + Push-to-Talk toggle + "Remember that..." quick hint
│  └─ KbUploadModal.tsx              # Drag-and-drop file uploader (.pdf, .txt, .md) + "Create New Persona" modal for the 50-60s demo finale
└─ app/
   ├─ layout.tsx
   ├─ page.tsx                       # Main Voice-First Studio UI
   ├─ personas/
   │  └─ page.tsx                    # Full Persona & Knowledge Base Manager UI
   └─ api/
      ├─ stt/route.ts                # Validates WAV -> calls Gnani Prisma v2.5 -> returns transcript + timing
      ├─ chat/route.ts               # Detects "remember that..." -> embeds -> match_chunks -> streams LLM sentences + sources metadata
      ├─ tts/route.ts                # Normalizes text -> calls Gnani Timbre SSE -> streams audio chunks (with raw PCM & MP3 fallback)
      ├─ kb/ingest/route.ts          # Parses PDF/TXT/MD -> chunks (400 tokens, 50 overlap) -> embeds -> inserts into Supabase
      ├─ personas/route.ts           # GET/POST personas so the demo can create a persona in real time
      └─ memory/route.ts             # GET/POST/DELETE voice memories per persona
```

---

### 4. STEP-BY-STEP IMPLEMENTATION DETAILS

#### Step 1: Supabase Schema & Seed Data (`supabase/migrations/001_initial_schema.sql`)
- Create the `vector` extension and all 6 tables (`personas`, `documents`, `chunks` with `vector(768)` and `hnsw` cosine index, `memories`, `conversations`, `messages`).
- Update `match_chunks` RPC to also join `documents.title` so the UI's `SourcesChip` can immediately display **which document** answered the question:
  ```sql
  create or replace function match_chunks(
    query_embedding vector(768),
    p_persona uuid,
    match_count int default 4,
    min_similarity float default 0.55
  ) returns table (
    id uuid,
    document_id uuid,
    document_title text,
    content text,
    similarity float
  )
  language sql stable as $$
    select
      c.id,
      c.document_id,
      coalesce(d.title, 'Knowledge Base') as document_title,
      c.content,
      1 - (c.embedding <=> query_embedding) as similarity
    from chunks c
    left join documents d on d.id = c.document_id
    where c.persona_id = p_persona
      and (1 - (c.embedding <=> query_embedding)) >= min_similarity
    order by c.embedding <=> query_embedding
    limit match_count;
  $$;
  ```
- Also build an **automatic Local/Mock Fallback Mode** inside `lib/retrieval.ts` and `app/api/personas/route.ts`: if Supabase env vars are not yet connected during initial local testing, seamlessly fall back to reading the JSON files in `/personas/*.json` and performing in-memory cosine similarity over pre-seeded sample KB chunks so the app works out-of-the-box on first `npm run dev`.

#### Step 2: Gnani API Wrappers (`lib/gnani.ts`)
- **Prisma STT (`/stt/v3`)**:
  - Construct a `FormData` payload with `audio_file` (named `utterance.wav`, MIME `audio/wav`), `language_code` (from persona config: `en-IN`, `hi-IN`, `ta-IN`), `format: "verbatim"`, `bias_list` (JSON stringified array of single-word alphabetic strings from `persona.stt_bias_words`), and `bias_score: "1.5"`.
- **Timbre TTS (`/api/v1/tts/sse`)**:
  - Send `POST` to `https://api.vachana.ai/api/v1/tts/sse` with header `X-API-Key-ID`.
  - Support a configurable audio format switch (`PCM_24K` vs `MP3_FALLBACK`) so if `container: "raw", encoding: "linear_pcm", sample_rate: 24000` has browser framing issues, a single env or query flag switches to `mp3` decoding via `audioContext.decodeAudioData`.
  - Parse the SSE stream (`event: start`, `event: chunk`, `event: complete`), extracting base64 audio payloads in order and streaming them down to the client.

#### Step 3: Audio Pipeline & Barge-In (`lib/wav-encoder.ts`, `lib/audio-queue.ts`, `lib/vad.ts`)
- Implement a clean, dependency-free RIFF WAVE header writer in `lib/wav-encoder.ts` that takes `Float32Array` samples at `16000` Hz, clamps and converts to 16-bit PCM (`Int16Array`), prepends the 44-byte WAV header, and outputs an `audio/wav` `Blob`.
- Implement `AudioPlaybackQueue` in `lib/audio-queue.ts` using the Web Audio API:
  - Exposes `enqueuePcmChunk(base64Data, sampleRate = 24000)`, `enqueueEncodedAudio(base64Data)`, `stop()`, and an `AnalyserNode` for real-time output amplitude so the `VoiceOrb` ripples organically in sync with the assistant's voice.
  - **Barge-In**: When the user speaks while `state === 'speaking'` (or clicks the Orb to interrupt), call `audioQueue.stop()` and `abortController.abort()` on all active `/api/chat` and `/api/tts` requests immediately, transitioning straight to `listening`.

#### Step 4: Voice Memory ("Remember that...")
- In `/api/chat/route.ts`, inspect the user's transcript for memory triggers (case-insensitive regex for `remember that`, `note that`, `yaad rakhna`, `nyabagam vechuko`, or a lightweight classifier flag).
- When triggered, extract the fact, store it in the `memories` table for that `persona_id`, and emit a `memory_saved` SSE event so the UI pops a glowing **"Memory Saved"** toast badge (another high-impact visual moment for the 60-second video).

#### Step 5: Video-First UI/UX (`app/page.tsx` & `components/*`)
Design a dark, atmospheric, glassmorphic interface ("Obsidian Studio" aesthetic) explicitly tailored so that anyone scrolling LinkedIn or X on mute immediately understands what is happening:
1. **Top Header**: Brand logo (`PersonaVoice`), active Gnani AI engine badges (`Prisma v2.5 STT` · `Timbre SSE TTS`), and the `TelemetryBar` showing live millisecond latencies.
2. **Persona Switcher Dock**: 3 distinct cards with distinct color themes:
   - **Personal Assistant ("Aria / Us")** — Electric Indigo theme (`en-IN` / Tanglish)
   - **Shop Assistant ("Kadai Helper")** — Amber Gold theme (`hi-IN` / Hinglish `hi-en`, Voice: `Poorvi`)
   - **Tamil Companion ("Namma Companion")** — Emerald Teal theme (`ta-IN` / Tanglish)
   - Plus a **"+ Add Persona / Upload KB"** button that opens `KbUploadModal` for the 50–60s video climax.
3. **Center Stage**:
   - Large animated `VoiceOrb` with clear state ring, real-time microphone/speaker waveform reactivity, and a status pill (`Idle — Tap or Speak` | `Listening (hi-IN)...` | `Searching KB + Thinking...` | `Speaking (Timbre Poorvi)...`).
4. **Cinema-Grade Live Captions & Sources Chip**:
   - Directly beneath the Orb, render large, high-contrast live captions showing both the User's transcribed utterance (with language tag) and the Assistant's spoken response word-by-word/sentence-by-sentence.
   - Next to the assistant's reply, animate in the **`SourcesChip`** (e.g., `📄 Source: kirana_price_list_oct2026.pdf · 91% match`) and any **`🧠 Memory Saved`** badge.

---

### 5. SEED DATA FOR THE 60-SECOND DEMO VIDEO

Populate `/personas/*.json` and the fallback/seed store with rich, realistic sample knowledge bases so the 60-second demo script works immediately after boot:
1. **Personal Assistant (`personal-assistant`)**:
   - Seed KB (`our_projects_and_schedule.md`): Contains details about building PersonaVoice for the Gnani AI Great Indian AI Internship Challenge, the deadline of November 10, 2026, team preferences (filter coffee, late-night coding), and upcoming demo recording at 6 PM.
2. **Shop Assistant (`shop-assistant`)**:
   - Seed KB (`sharma_kirana_catalog.md`): Contains prices and stock for Amul Taaza Milk (54 rupees per liter, in stock), Aashirvaad Select Atta 5kg (285 rupees, Diwali offer 20 rupees off), Parle-G family pack (80 rupees), and store timing (7 AM to 10 PM, free home delivery above 500 rupees).
3. **Tamil Companion (`tamil-companion`)**:
   - Seed KB (`chennai_local_guide.md`): Contains local Chennai tips, Metro timings from Central to Airport (first train 5 AM, fare 40 rupees), best spots for evening murukku sandwich in T. Nagar, and auto/cab tips during North-East monsoon rains.

---

### 6. EXECUTION ORDER

1. Initialize configuration (`package.json`, `tsconfig.json`, Tailwind setup, `.env.example`).
2. Create the SQL migration and seed files (`supabase/migrations/001_initial_schema.sql`) and seed JSON personas (`/personas/*.json`).
3. Build the core `/lib` utilities (`wav-encoder.ts`, `tts-normalizer.ts`, `sentence-splitter.ts`, `rate-limit.ts`, `gnani.ts`, `embed.ts`, `retrieval.ts`, `llm.ts`, `audio-queue.ts`, `vad.ts`).
4. Build the Zustand state machine (`store/conversation.ts`).
5. Build all Next.js API Route Handlers (`app/api/stt`, `app/api/chat`, `app/api/tts`, `app/api/kb/ingest`, `app/api/personas`, `app/api/memory`).
6. Build all UI components (`VoiceOrb`, `LiveCaptions`, `PersonaSwitcher`, `SourcesChip`, `TelemetryBar`, `KbUploadModal`, `TextFallbackBar`) and assemble `app/page.tsx` and `app/personas/page.tsx`.
7. Verify TypeScript compilation, ensure zero client-side secret imports, and provide a concise `README.md` with setup and demo recording instructions.