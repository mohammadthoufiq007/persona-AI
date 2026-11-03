# PersonaVoice — Complete Product, Technical, UI/UX, Database & Architecture Specification

**Project Title:** PersonaVoice — Voice-First Persona Assistant on Gnani AI  
**Target Event:** The Great Indian AI Internship Challenge (Gnani AI)  
**Hard Deadline:** 10 November 2026 (Target Video Launch: 7 November 2026)  
**One-Line Pitch:** *"One voice engine, any persona — speak to it in your language and it already knows your world."*

---

## Part 1: Product Requirements Document (PRD)

### 1.1 Product Vision & Contest Strategy
Selection in the Great Indian AI Internship Challenge depends on two pillars:
1. **A genuinely working voice application** built on Gnani AI's core voice stack (**Prisma STT** + **Timbre TTS**).
2. **Verified public engagement on LinkedIn and X** on a 60-second demo video.

Because 80%+ of LinkedIn and X users scroll feeds with **muted autoplay** initially before tapping for sound, **PersonaVoice** is engineered simultaneously as an ultra-low-latency voice assistant ($\le 2.0\text{ s}$ turnaround) and a visually self-explanatory broadcast studio with cinema-grade live captions, reactive voice physics, visible RAG source citations, and instant persona colour-theme morphing.

### 1.2 Target Award Categories Addressed
By shipping three distinct personas out of the box on a single engine, PersonaVoice simultaneously qualifies for:
- **Regional Languages** (Tamil / `ta-IN`)
- **Hinglish / Code-Mixed** (Hinglish Shop Assistant / `hi-en` & Tanglish Personal Assistant)
- **Real-World Impact** (Small business Kirana/Kadai voice inventory & price assistant)
- **Best 60-Second Demo & Creativity** ("Zero-code persona creation" by dropping a PDF)

### 1.3 User Personas & Demo Scenarios

| Persona Name | Slug | STT Language | TTS Model & Voice | Knowledge Base (Seed) | Core Demo Query |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **1. Personal Assistant ("Aria / Us")** | `personal-assistant` | `en-IN` (with bias words) | `timbre-v2.5` · `Kaveri` (`en-IN`) | `our_projects_schedule.md` | *"Hey, what's our deadline for the Gnani challenge and what's left on our checklist?"* |
| **2. Shop Assistant ("Kadai Helper")** | `shop-assistant` | `hi-IN` | `timbre-v2.5` · `Poorvi` (`hi-en` Hinglish) | `sharma_kirana_catalog.md` | *"Bhaiya, 5 kilo Aashirvaad atta ka price kya hai, aur koi Diwali offer chal raha hai kya?"* |
| **3. Tamil Companion ("Namma Companion")** | `tamil-companion` | `ta-IN` | `timbre-v3.0` (or `v2.5` Tamil voice) (`ta-IN`) | `chennai_local_guide.md` | *"Chennai Central-la irundhu Airport-ku first metro eppo irukku, ticket evlo?"* |

### 1.4 Functional Requirements Matrix

| ID | Feature | Priority | Acceptance Criteria |
| :--- | :--- | :--- | :--- |
| **FR-01** | **In-Browser VAD & 16kHz WAV Capture** | **P0 (MVP)** | Detects speech start/end via `@ricky0123/vad-web` (plus manual Tap-to-Speak fallback) and encodes a valid 16 kHz mono 16-bit PCM `.wav` file ($\le 30\text{ s}$). |
| **FR-02** | **Gnani Prisma v2.5 STT Integration** | **P0 (MVP)** | Sends `.wav` + persona `language_code` + `bias_list` to `POST /stt/v3` via server route; returns transcript in $< 600\text{ ms}$. |
| **FR-03** | **Per-Persona RAG Retrieval** | **P0 (MVP)** | Embeds transcript (`768`-dim), queries Supabase `pgvector` filtered strictly by `persona_id`, returns top 4 chunks + document titles. |
| **FR-04** | **Spoken-Style LLM Generation** | **P0 (MVP)** | Streams 1–2 concise spoken sentences with zero markdown, zero bullet points, and grounded strictly in KB + Persona Memories. |
| **FR-05** | **TTS Normalization & Gnani Timbre Streaming** | **P0 (MVP)** | Converts symbols (`₹`, digits, dates) to words, streams sentences to `POST /api/v1/tts/sse`, and plays gapless audio in the browser. |
| **FR-06** | **Live Captions & Sources Chip** | **P0 (MVP)** | Displays real-time user and assistant captions plus a clickable chip showing which document answered the query. |
| **FR-07** | **Document Upload & Instant KB Ingestion** | **P0 (MVP)** | Allows uploading `.pdf`, `.txt`, or `.md` files, chunks at ~400 tokens (50 overlap), embeds, and makes them immediately queryable. |
| **FR-08** | **Credit Protection & Rate Limiting** | **P0 (MVP)** | Server-side API keys only, IP rate limiting, silence rejection, and cached greeting/error TTS audio to preserve the 5,000 Gnani credits. |
| **FR-09** | **Voice Memory ("Remember that...")** | **P1 (Stretch)** | Detects memory intent in user speech, persists the fact in `memories` table for that persona, and injects it into future prompts. |
| **FR-10** | **Barge-In (Interrupt Assistant)** | **P1 (Stretch)** | Speaking or tapping while the assistant is talking immediately halts Web Audio playback and aborts in-flight LLM/TTS streams. |

---

## Part 2: Technical Requirements Document (TRD)

### 2.1 Resolved Open Decisions (Locked Defaults for Fast Execution)
To eliminate ambiguity before coding begins on 24 Oct:
1. **Brain LLM:** **Google Gemini 2.5 Flash** (`gemini-2.5-flash`) via Google AI Studio API key (`GEMINI_API_KEY`). Chosen for sub-400ms time-to-first-token and native Indian language/code-mixed fluency. Placed behind `lib/llm.ts` so Gnani Evon or another OpenAI-compatible endpoint can be swapped in via 1 env var.
2. **Embeddings Model:** **Google `text-embedding-004`** (`768` dimensions). Free/high-quota tier on AI Studio, fast (~120ms), and matches `vector(768)` in Supabase `pgvector`.
3. **Audio Transport Format:**
   - **Browser $\rightarrow$ `/api/stt`:** `audio/wav` (16,000 Hz, 1 channel, 16-bit PCM).
   - **`/api/tts` $\rightarrow$ Browser:** Server-Sent Events (SSE) carrying base64-encoded 24,000 Hz 16-bit mono `linear_pcm` (`container: "raw"`), with a one-flag fallback to `mp3` per sentence if raw PCM experiences browser jitter.

### 2.2 End-to-End Latency Budget ($\le 2,000\text{ ms}$)

$$\text{Total Turnaround} = t_{\text{VAD}} + t_{\text{STT}} + t_{\text{RAG}} + t_{\text{LLM\_S1}} + t_{\text{TTS\_TTFB}}$$

| Pipeline Stage | Target Latency | Engineering Optimization |
| :--- | :--- | :--- |
| **1. VAD End-of-Speech (`t_VAD`)** | $450\text{ ms}$ | Configure `redemptionFrames` in `@ricky0123/vad-web` to ~450ms (plus instant manual tap-to-finish button for demo recording). |
| **2. Gnani Prisma STT (`t_STT`)** | $450\text{ ms}$ | Downsample to 16 kHz mono WAV in browser (~32 KB/sec payload size). |
| **3. Embed + pgvector Search (`t_RAG`)** | $200\text{ ms}$ | Parallel `Promise.all([embedAndMatchChunks(), fetchPersonaMemories()])` with HNSW index. |
| **4. LLM First Sentence (`t_LLM_S1`)** | $550\text{ ms}$ | Stream tokens into `sentence-splitter.ts`; flush as soon as the first `.` `?` `!` or `।` appears. |
| **5. Gnani Timbre First Audio Byte (`t_TTS_TTFB`)** | $250\text{ ms}$ | Stream SSE chunks directly into Web Audio `AudioBufferSourceNode` queue. |
| **Total Time to First Spoken Word** | **$\approx 1,900\text{ ms}$** | Logged per turn and surfaced in the UI telemetry bar. |

### 2.3 Internal API Contracts

#### `POST /api/stt`
- **Request:** `multipart/form-data`
  - `audio`: `Blob` (`audio/wav`, 16kHz mono, max 1.9 MB / 60s)
  - `language_code`: `"en-IN" | "hi-IN" | "ta-IN" | ...`
  - `bias_words`: JSON string array (e.g., `["Gnani", "Prisma", "Timbre", "Aashirvaad"]`)
- **Upstream Call:** `POST https://api.vachana.ai/stt/v3` with header `X-API-Key-ID: process.env.GNANI_API_KEY`
- **Response (`200 OK`):**
  ```json
  {
    "transcript": "Bhaiya 5 kilo Aashirvaad atta ka price kya hai?",
    "request_id": "gnani-req-98231",
    "latency_ms": 412
  }
  ```

#### `POST /api/chat` (Streaming NDJSON / SSE)
- **Request (`application/json`):**
  ```json
  {
    "persona_id": "uuid-or-slug",
    "conversation_id": "uuid",
    "transcript": "Bhaiya 5 kilo Aashirvaad atta ka price kya hai?",
    "history": [
      { "role": "user", "content": "..." },
      { "role": "assistant", "content": "..." }
    ]
  }
  ```
- **Streamed Events:**
  - `event: sources` $\rightarrow$ `{"sources": [{"document_title": "sharma_kirana_catalog.md", "similarity": 0.91}], "rag_ms": 184}`
  - `event: memory_saved` $\rightarrow$ `{"fact": "User prefers filter coffee without sugar"}` (only if memory intent detected)
  - `event: sentence` $\rightarrow$ `{"index": 0, "text": "Aashirvaad Select 5 kilo atta ka price two hundred eighty five rupees hai.", "llm_ms": 520}`
  - `event: sentence` $\rightarrow$ `{"index": 1, "text": "Abhi Diwali offer mein aapko twenty rupees ka instant discount bhi milega."}`
  - `event: done` $\rightarrow$ `{"full_text": "..."}`

#### `POST /api/tts` (SSE Audio Passthrough)
- **Request (`application/json`):**
  ```json
  {
    "text": "Aashirvaad Select 5 kilo atta ka price two hundred eighty five rupees hai.",
    "voice": "Poorvi",
    "model": "timbre-v2.5",
    "language": "hi-en",
    "speed": 1.0
  }
  ```
- **Pre-Processing:** Runs `normalizeForTts(text)` so `₹285` becomes `two hundred eighty five rupees` and `5kg` becomes `five kilos`.
- **Upstream Call:** `POST https://api.vachana.ai/api/v1/tts/sse` with `X-API-Key-ID`.
- **Streamed Response:** Passes through `event: start`, `event: chunk` (base64 audio frame), and `event: complete`.

### 2.4 TTS Normalizer Specification (`lib/tts-normalizer.ts`)
Gnani Timbre requires numbers, dates, and currency to be expanded into spoken words for natural prosody:
1. **Currency (`₹` / `Rs.` / `INR`):** `₹1,250` $\rightarrow$ `one thousand two hundred and fifty rupees`.
2. **Units:** `5kg` $\rightarrow$ `five kilos`, `500g` $\rightarrow$ `five hundred grams`, `1L` $\rightarrow$ `one liter`.
3. **Percentages & Times:** `15%` $\rightarrow$ `fifteen percent`, `6:30 PM` $\rightarrow$ `six thirty P M`.
4. **Markdown Stripping:** Strips any accidental `*`, `_`, `#`, backticks, or bracketed citations `[1]` before synthesis.

---

## Part 3: UI/UX Specification

### 3.1 Design Philosophy: "Built for the 60-Second Video"
When a judge or viewer scrolls past the post on LinkedIn or X:
- Within **2 seconds**, they must visually recognize:
  1. Who the active persona is and what language they speak.
  2. Whether the system is **Listening**, **Thinking (RAG)**, or **Speaking**.
  3. What the user said and what the AI replied (via large, high-contrast captions).
  4. Which knowledge base document grounded the answer (`SourcesChip`).

### 3.2 Viewport Wireframe (Single-Screen Studio Layout)

```text
+-----------------------------------------------------------------------------------+
|  (o) PersonaVoice    [Gnani Prisma v2.5 · Timbre SSE]    STT 390ms | RAG 170ms    |
+-----------------------------------------------------------------------------------+
|                                                                                   |
|   +-----------------------+  +-----------------------+  +-----------------------+ |
|   | * Personal Assistant  |  | o Kadai Shop Helper   |  | o Tamil Companion     | |
|   |   en-IN / Tanglish    |  |   hi-IN / Hinglish    |  |   ta-IN / Tanglish    | |
|   +-----------------------+  +-----------------------+  +-----------------------+ |
|                                                          [+ New Persona / Upload] |
|                                                                                   |
|                                   . - ~ ~ ~ - .                                   |
|                               . '   (  (o)  )   ' .                               |
|                              /   REACTIVE VOICE    \                              |
|                             |         ORB           |                             |
|                              \   (Speaking 24kHz)  /                              |
|                               ' .               . '                               |
|                                   ' - ~ ~ ~ - '                                   |
|                                                                                   |
|                         [ STATE: SPEAKING · TAP TO INTERRUPT ]                    |
|                                                                                   |
|   +---------------------------------------------------------------------------+   |
|   | YOU (hi-IN): "Bhaiya 5 kilo Aashirvaad atta ka price kya hai?"            |   |
|   |                                                                           |   |
|   | KADAI HELPER (Poorvi · hi-en):                                            |   |
|   | "Aashirvaad Select five kilo atta ka price two hundred eighty five        |   |
|   |  rupees hai, aur Diwali offer mein twenty rupees off milega."             |   |
|   |                                                                           |   |
|   | [📄 Source: sharma_kirana_catalog.md (92% match)]  [🧠 Memory Active (3)] |   |
|   +---------------------------------------------------------------------------+   |
|                                                                                   |
|   [ Mic: Auto VAD ON ]  [ Type a message or say "Remember that..."      ] [Send]  |
+-----------------------------------------------------------------------------------+
```

### 3.3 Reactive Orb State Machine & Visual Tokens

| State | Visual Behaviour (`VoiceOrb.tsx`) | Dynamic Accent Per Persona | Caption Area Behaviour |
| :--- | :--- | :--- | :--- |
| **`idle`** | Slow, organic breathing scale ($1.0 \leftrightarrow 1.05$, $4\text{s}$ loop), subtle ambient glow. | **Personal:** Indigo `#6366F1`<br>**Shop:** Amber `#F59E0B`<br>**Tamil:** Emerald `#10B981` | Shows suggested voice prompt for the selected persona. |
| **`listening`** | Expands dynamically ($1.0 \leftrightarrow 1.35$) driven by microphone RMS amplitude from Web Audio `AnalyserNode`; outer ring turns vibrant cyan/green. | High-luminance ring pulse | Shows *"Listening in [Language]..."* waveform bars. |
| **`thinking`** | Dual counter-rotating orbital rings ($180^\circ/\text{s}$) with particle shimmer while STT + RAG + LLM first sentence resolve. | Shimmering gradient | Displays user's transcribed words + `"Retrieving from KB..."` |
| **`speaking`** | Concentric liquid ripples synced to the Web Audio output `AnalyserNode` of Gnani Timbre's audio stream. | Persona primary + secondary glow | Reveals assistant's spoken sentence in real time + `SourcesChip`. |
| **`error`** | Brief coral-red pulse (`#EF4444`), settles back to `idle` after playing cached spoken fallback. | Coral `#EF4444` | Shows clear actionable message + enables text fallback input. |

---

## Part 4: Database Schema & RAG Architecture (Supabase)

### 4.1 Entity-Relationship Diagram

```text
+------------------+       1:N       +-------------------+
|     personas     |---------------->|     documents     |
|------------------|                 |-------------------|
| id (uuid) PK     |                 | id (uuid) PK      |
| slug (text) UQ   |                 | persona_id FK     |
| name (text)      |                 | title (text)      |
| config (jsonb)   |                 | storage_path      |
+--------+---------+                 +---------+---------+
         |                                     |
         | 1:N                                 | 1:N
         +-----------------+-------------------+
         |                 |
         v                 v
+------------------+   +---------------------------------+
|     memories     |   |             chunks              |
|------------------|   |---------------------------------|
| id (uuid) PK     |   | id (uuid) PK                    |
| persona_id FK    |   | document_id FK                  |
| fact (text)      |   | persona_id FK                   |
| created_at       |   | content (text)                  |
+------------------+   | embedding vector(768) [HNSW]    |
                       +---------------------------------+
```

### 4.2 Complete SQL Migration (`supabase/migrations/001_initial_schema.sql`)

```sql
-- Enable pgvector extension
create extension if not exists vector;

-- 1. Personas Table
create table if not exists personas (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  config jsonb not null,
  created_at timestamptz default now()
);

-- 2. Documents Table (Raw uploaded KB metadata)
create table if not exists documents (
  id uuid primary key default gen_random_uuid(),
  persona_id uuid references personas(id) on delete cascade not null,
  title text not null,
  storage_path text,
  created_at timestamptz default now()
);

-- 3. Chunks Table (Vector store per persona)
create table if not exists chunks (
  id uuid primary key default gen_random_uuid(),
  document_id uuid references documents(id) on delete cascade,
  persona_id uuid references personas(id) on delete cascade not null,
  content text not null,
  embedding vector(768) not null,
  created_at timestamptz default now()
);

-- HNSW Index for fast cosine similarity search
create index if not exists chunks_embedding_hnsw_idx
  on chunks using hnsw (embedding vector_cosine_ops);

create index if not exists chunks_persona_id_idx
  on chunks (persona_id);

-- 4. Voice Memories Table ("Remember that...")
create table if not exists memories (
  id uuid primary key default gen_random_uuid(),
  persona_id uuid references personas(id) on delete cascade not null,
  fact text not null,
  created_at timestamptz default now()
);

-- 5. Conversations Table
create table if not exists conversations (
  id uuid primary key default gen_random_uuid(),
  persona_id uuid references personas(id) on delete cascade,
  created_at timestamptz default now()
);

-- 6. Messages Table
create table if not exists messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid references conversations(id) on delete cascade,
  role text check (role in ('user', 'assistant')) not null,
  content text not null,
  sources jsonb default '[]'::jsonb,
  latency_ms jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

-- 7. Vector Similarity Search RPC with Document Title Join
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
    coalesce(d.title, 'Persona Knowledge Base') as document_title,
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

---

## Part 5: High-Level Architecture & Sequence Flow

### 5.1 Conversational Turn Sequence & Streaming Pipeline

```text
User (Mic)        Browser (Next.js)          Server Routes (/api/*)        Gnani AI / Supabase / Gemini
   |                     |                             |                                |
   |--- Speaks --------->|                             |                                |
   |                     |-- VAD detects end (450ms)   |                                |
   |                     |-- Encode 16kHz Mono WAV     |                                |
   |                     |                             |                                |
   |                     |== POST /api/stt (WAV) =====>|                                |
   |                     |                             |== POST /stt/v3 (Prisma) ======>|
   |                     |                             |<-- { transcript } (400ms) =====|
   |                     |<-- { transcript } ==========|                                |
   |                     |-- Render User Caption       |                                |
   |                     |                             |                                |
   |                     |== POST /api/chat ==========>|                                |
   |                     |                             |== Embed + match_chunks() =====>| (Supabase pgvector)
   |                     |                             |<-- Top 4 Chunks + Memories ====|
   |                     |<-- SSE: event: sources =====|                                |
   |                     |-- Render SourcesChip        |                                |
   |                     |                             |== Stream Prompt ==============>| (Gemini 2.5 Flash)
   |                     |                             |<-- Tokens for Sentence 1 ======|
   |                     |<-- SSE: sentence #1 ========|                                |
   |                     |                             |                                |
   |                     |== POST /api/tts (Sent #1) =>|                                |
   |                     |                             |-- Normalize ₹/numbers          |
   |                     |                             |== POST /api/v1/tts/sse =======>| (Gnani Timbre)
   |                     |<-- SSE: PCM audio chunks ===|<-- SSE: base64 audio chunks ===|
   |<== Plays Sent #1 ===|-- Web Audio Queue starts    |                                |
   |                     |   (while Sent #2 generates) |                                |
   |                     |                             |                                |
   |--- Interrupts! ---->|                             |                                |
   |   (Barge-in)        |-- audioQueue.stop()         |                                |
   |                     |-- abortController.abort() ->| (Cancels in-flight streams)    |
```

### 5.2 Prompt Assembly Architecture (`lib/llm.ts`)

Every conversational turn dynamically compiles the prompt in this strict hierarchy:

```text
[1. CORE SPOKEN VOICE DIRECTIVE]
You are speaking out loud to a user via a real-time voice interface.
- Reply in 1 to 2 short, natural spoken sentences maximum.
- NEVER use markdown, bullet points, numbered lists, asterisks, or emojis.
- Write all numbers, prices, and currencies out as spoken words.
- Ground your answer strictly in the PROVIDED KNOWLEDGE BASE and MEMORIES. If the answer is not there, say naturally that you don't have that information right now.

[2. PERSONA IDENTITY & LANGUAGE DIRECTIVE]
Name: {persona.name}
Role & Tone: {persona.system_prompt}

[3. PERSONA VOICE MEMORIES (Facts the user asked you to remember)]
- {memory_1}
- {memory_2}

[4. RETRIEVED KNOWLEDGE BASE CHUNKS]
Source [{doc_title_1}]: {chunk_content_1}
Source [{doc_title_2}]: {chunk_content_2}

[5. RECENT CONVERSATION HISTORY (Last 4 turns)]
User: ...
Assistant: ...

[6. CURRENT USER UTTERANCE]
User: {transcript}
```

### 5.3 Credit Conservation & Production Checklist (Before Posting Video on Nov 7)
1. **Greeting Cache:** Pre-synthesize each persona's `greeting` once and cache the audio buffer so switching personas in the UI plays instantly in $0\text{ ms}$ and uses $0$ Gnani credits.
2. **Silence & Noise Gate:** Reject any WAV file under $400\text{ ms}$ or below an RMS energy threshold before calling `/api/stt`.
3. **IP Rate Limiter:** Cap public visitors at `15` voice turns per 10-minute window per IP so viral LinkedIn/X traffic cannot exhaust the 5,000 credits before the judges test the deployment.
4. **Spoken Quota Fallback:** If Gnani returns `403` or `429`, automatically switch the UI badge to `"High Traffic — Browser Voice Fallback"` while keeping the RAG chat live so the public demo link never appears broken.