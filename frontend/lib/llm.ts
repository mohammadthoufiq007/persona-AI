import 'server-only';
import { GoogleGenAI } from '@google/genai';

const apiKey = process.env.GEMINI_API_KEY;
const llmModel = process.env.GEMINI_MODEL ?? 'gemini-2.0-flash-lite';

let client: GoogleGenAI | null = null;
if (apiKey && !apiKey.includes('REPLACE_WITH')) {
  try {
    client = new GoogleGenAI({ apiKey });
  } catch (e) {
    console.error('[llm] Error initializing GoogleGenAI:', e);
  }
}

export async function* streamLLMTokens(
  personaPrivConfig: Record<string, unknown>,
  transcript: string,
  chunks: { document_title: string; content: string }[],
  memories: string[],
  history: { role: string; content: string }[],
  signal?: AbortSignal,
): AsyncGenerator<string> {
  if (!client || !apiKey) {
    yield "I'm running in demo preview mode. You can ask me anything about your project or schedule.";
    return;
  }

  const langCode = (personaPrivConfig.sttLanguage as string) || 'en-IN';
  let languageDirective = 'CRITICAL: Your name is Sapphire. The user is speaking in English. You MUST reply in clear, natural spoken English as Sapphire.';
  if (langCode === 'hi-IN') {
    languageDirective = 'CRITICAL: Your name is Rahu. The user is speaking in Hindi. You MUST understand Hindi and reply strictly in spoken Hindi (हिन्दी or conversational Hinglish) as Rahu. Speak in Hindi so that the Hindi TTS voice pronounces it naturally. Do not answer in pure English.';
  } else if (langCode === 'ta-IN') {
    languageDirective = 'CRITICAL: Your name is Maragatham. The user is speaking in Tamil. You MUST understand Tamil and reply strictly in spoken Tamil (தமிழ் or conversational Tanglish) as Maragatham. Speak in Tamil so that the Tamil TTS voice pronounces it naturally. Do not answer in pure English.';
  }

  const systemParts = [
    'You are speaking out loud through a real-time voice interface.',
    languageDirective,
    'Reply in 1 to 2 short, natural spoken sentences maximum.',
    'NEVER use markdown formatting (*, _, #, `), bullet lists, numbered lists, or emojis.',
    'Always speak numbers, prices, and currencies in words (e.g. fifty rupees, two thousand twenty six).',
    `\nPERSONA ROLE:\n${(personaPrivConfig.systemPrompt as string) || 'Helpful spoken AI assistant.'}`,
  ];

  if (memories && memories.length > 0) {
    systemParts.push(`\nSESSION MEMORIES:\n${memories.map(m => `- ${m}`).join('\n')}`);
  }

  if (chunks && chunks.length > 0) {
    systemParts.push('\nKNOWLEDGE BASE & PERSONAL PROFILE CONTEXT:');
    systemParts.push('CRITICAL GROUNDING INSTRUCTIONS:');
    systemParts.push('1. The following KNOWLEDGE BASE contains verified, authoritative details regarding the user (Thoufiq) and this assistant persona.');
    systemParts.push('2. If the user query is about the user, their background, education, skills, projects, contact info, identity, or any topic found in this knowledge base, you MUST base your answer strictly on these verified facts.');
    systemParts.push('3. If the user query is a general knowledge question or common task NOT covered in the knowledge base, use your broad AI model knowledge to answer conversationally, accurately, and politely.');
    systemParts.push('4. Do NOT refuse to answer general questions or say "I do not know" simply because they are not in the profile notes.');
    chunks.forEach(c => systemParts.push(`\n[Source: ${c.document_title}]\n${c.content}`));
  }

  const contents = [
    ...history.map(h => ({
      role: h.role === 'user' ? ('user' as const) : ('model' as const),
      parts: [{ text: h.content }],
    })),
    {
      role: 'user' as const,
      parts: [{ text: transcript }],
    },
  ];

  try {
    const result = await client.models.generateContentStream({
      model: llmModel,
      contents,
      config: {
        systemInstruction: systemParts.join('\n'),
        maxOutputTokens: Number(process.env.MAX_REPLY_TOKENS ?? 120),
        temperature: 0.7,
      },
    });

    for await (const chunk of result) {
      if (signal?.aborted) break;
      const text = chunk.text ?? '';
      if (text) yield text;
    }
  } catch (err) {
    console.error('[llm] generateContentStream error:', err);
    yield "I heard you, but I couldn't reach the model right now. Please try again.";
  }
}
