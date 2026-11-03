import 'server-only';
import { GoogleGenAI } from '@google/genai';

const apiKey = process.env.GEMINI_API_KEY;
const model = process.env.GEMINI_EMBED_MODEL ?? 'gemini-embedding-001';

let client: GoogleGenAI | null = null;
if (apiKey && !apiKey.includes('REPLACE_WITH')) {
  try {
    client = new GoogleGenAI({ apiKey });
  } catch (err) {
    console.error('[embed] Failed initializing GoogleGenAI:', err);
  }
}

export async function embedText(text: string, taskType: 'QUERY' | 'DOCUMENT' = 'QUERY'): Promise<number[]> {
  if (!client || !apiKey) {
    console.warn('[embed] GEMINI_API_KEY not set — returning zero vector');
    return new Array(768).fill(0);
  }

  try {
    const result = await client.models.embedContent({
      model,
      contents: [{ role: 'user', parts: [{ text }] }],
      config: {
        taskType: taskType === 'QUERY' ? 'RETRIEVAL_QUERY' : 'RETRIEVAL_DOCUMENT',
        outputDimensionality: 768,
      },
    });

    const values = result.embeddings?.[0]?.values;
    if (values && values.length > 0) {
      return values;
    }
  } catch (err) {
    console.warn('[embed] Embedding API call failed, falling back to zero vector:', err);
  }

  return new Array(768).fill(0);
}
