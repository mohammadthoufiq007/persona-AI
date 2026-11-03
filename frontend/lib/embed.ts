import 'server-only';
import { GoogleGenAI } from '@google/genai';

function getEmbedClient(): { client: GoogleGenAI; model: string } | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey.includes('REPLACE_WITH') || apiKey.includes('your_gemini')) {
    return null;
  }
  const model = process.env.GEMINI_EMBED_MODEL || 'text-embedding-004';
  try {
    return { client: new GoogleGenAI({ apiKey }), model };
  } catch (err) {
    console.error('[embed] Failed initializing GoogleGenAI:', err);
    return null;
  }
}

export async function embedText(text: string, taskType: 'QUERY' | 'DOCUMENT' = 'QUERY'): Promise<number[]> {
  const embedder = getEmbedClient();
  if (!embedder) {
    return new Array(768).fill(0);
  }

  const { client, model } = embedder;

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
