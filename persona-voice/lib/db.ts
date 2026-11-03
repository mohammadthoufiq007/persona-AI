import 'server-only';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export const supabase = (supabaseUrl && supabaseKey && !supabaseKey.includes('REPLACE_WITH'))
  ? createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false } })
  : null;

// Local fallback loader for personas
const SLUG_ALIASES: Record<string, string> = {
  sapphire: 'personal-assistant',
  saphire: 'personal-assistant',
  aria: 'personal-assistant',
  'english-assistant': 'personal-assistant',
  'personal-assistant': 'personal-assistant',
  rahu: 'shop-assistant',
  sharma: 'shop-assistant',
  'hindi-assistant': 'shop-assistant',
  'shop-assistant': 'shop-assistant',
  maragatham: 'tamil-companion',
  chennai: 'tamil-companion',
  'tamil-assistant': 'tamil-companion',
  'tamil-companion': 'tamil-companion',
};

function loadLocalPersona(slug: string) {
  try {
    const canonicalSlug = SLUG_ALIASES[slug.toLowerCase()] || slug;
    const filePath = path.join(process.cwd(), 'content', 'personas', `${canonicalSlug}.json`);
    if (fs.existsSync(filePath)) {
      const raw = fs.readFileSync(filePath, 'utf-8');
      const json = JSON.parse(raw);
      return {
        id: json.slug,
        slug: json.slug,
        name: json.name,
        public_config: json.public_config,
        private_config: json.private_config,
      };
    }
  } catch (e) {
    console.warn(`[db] Failed loading local persona for ${slug}:`, e);
  }
  return null;
}

function loadAllLocalPersonas() {
  try {
    const dir = path.join(process.cwd(), 'content', 'personas');
    const files = ['personal-assistant.json', 'shop-assistant.json', 'tamil-companion.json'];
    return files
      .filter(f => fs.existsSync(path.join(dir, f)))
      .map(f => {
        const raw = fs.readFileSync(path.join(dir, f), 'utf-8');
        const json = JSON.parse(raw);
        return {
          slug: json.slug,
          name: json.name,
          public_config: json.public_config,
        };
      });
  } catch (e) {
    console.warn('[db] Failed loading local personas dir:', e);
  }
  return [];
}

export async function getPersonaBySlug(slug: string) {
  const canonicalSlug = SLUG_ALIASES[slug.toLowerCase()] || slug;
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('personas')
        .select('id, slug, name, public_config, private_config')
        .eq('slug', canonicalSlug)
        .maybeSingle();
      if (!error && data) return data;
    } catch (e) {
      console.warn(`[db] Supabase getPersonaBySlug query failed, falling back to local:`, e);
    }
  }
  return loadLocalPersona(slug);
}

export async function getAllPublicPersonas() {
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('personas')
        .select('slug, name, public_config')
        .in('slug', ['personal-assistant', 'shop-assistant', 'tamil-companion']);
      if (!error && data && data.length > 0) return data;
    } catch (e) {
      console.warn('[db] Supabase getAllPublicPersonas query failed, falling back to local:', e);
    }
  }
  return loadAllLocalPersonas();
}

// Helper: Flatten a JSON object into readable topical markdown sections
function parseJsonToSections(obj: any, prefix = ''): { title: string; content: string }[] {
  const sections: { title: string; content: string }[] = [];
  if (!obj || typeof obj !== 'object') return sections;

  for (const [key, value] of Object.entries(obj)) {
    const formattedKey = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    const sectionTitle = prefix ? `${prefix} - ${formattedKey}` : formattedKey;

    if (Array.isArray(value)) {
      const items = value.map(item => {
        if (typeof item === 'object') {
          return Object.entries(item).map(([k, v]) => `${k.replace(/_/g, ' ')}: ${typeof v === 'object' ? JSON.stringify(v) : v}`).join(' | ');
        }
        return String(item);
      }).join('\n- ');
      sections.push({
        title: sectionTitle,
        content: `### ${sectionTitle}\n- ${items}`,
      });
    } else if (typeof value === 'object' && value !== null) {
      const nested = parseJsonToSections(value, sectionTitle);
      if (nested.length > 0) {
        sections.push(...nested);
      } else {
        sections.push({
          title: sectionTitle,
          content: `### ${sectionTitle}\n${JSON.stringify(value, null, 2)}`,
        });
      }
    } else {
      sections.push({
        title: sectionTitle,
        content: `**${formattedKey}**: ${String(value)}`,
      });
    }
  }

  return sections;
}

// Helper: Calculate keyword relevance score between a query and text chunk
function scoreChunkRelevance(query: string, title: string, content: string): number {
  if (!query || !query.trim()) return 0.5;

  const qLower = query.toLowerCase();
  const titleLower = title.toLowerCase();
  const contentLower = content.toLowerCase();

  let score = 0;

  // Exact phrase match in title or content
  if (titleLower.includes(qLower)) score += 5;
  if (contentLower.includes(qLower)) score += 3;

  // Tokenize query words (>2 letters, ignore stopwords)
  const stopWords = new Set(['the', 'and', 'for', 'with', 'about', 'what', 'who', 'how', 'when', 'where', 'tell', 'can', 'you', 'are', 'was', 'were', 'does', 'did', 'have', 'has']);
  const tokens = qLower.match(/[a-z0-9]+/g)?.filter(t => t.length > 2 && !stopWords.has(t)) || [];

  for (const token of tokens) {
    if (titleLower.includes(token)) score += 2.5;
    if (contentLower.includes(token)) score += 1.0;
  }

  return score;
}

export async function matchChunks(
  embedding: number[], 
  personaId: string, 
  topK = 5,
  queryText = ''
) {
  if (supabase) {
    try {
      // Query chunks for this persona
      const p1 = supabase.rpc('match_chunks', {
        query_embedding: embedding,
        p_persona: personaId,
        match_count: topK,
      });

      // Always also query chunks for common personal-profile
      const p2 = supabase.rpc('match_chunks', {
        query_embedding: embedding,
        p_persona: 'personal-profile',
        match_count: topK,
      });

      const [res1, res2] = await Promise.all([p1, p2]);
      const combined = [...(res1.data || []), ...(res2.data || [])];
      if (combined.length > 0) {
        // Deduplicate by content
        const seen = new Set<string>();
        const unique = combined.filter(c => {
          if (seen.has(c.content)) return false;
          seen.add(c.content);
          return true;
        });
        return unique.slice(0, topK) as { id: string; document_title: string; content: string; similarity: number }[];
      }
    } catch (e) {
      console.warn('[db] Supabase match_chunks failed, using enhanced local fallback:', e);
    }
  }

  const allChunks: { id: string; document_title: string; content: string; similarity: number; score: number }[] = [];

  // Helper to load and chunk files from a directory
  const processDir = (dirPath: string, isCommon: boolean) => {
    if (!fs.existsSync(dirPath)) return;
    const files = fs.readdirSync(dirPath).filter(f => f.endsWith('.md') || f.endsWith('.txt') || f.endsWith('.json') || f.endsWith('.csv'));

    for (const f of files) {
      const fullPath = path.join(dirPath, f);
      try {
        const raw = fs.readFileSync(fullPath, 'utf-8');
        const docLabel = isCommon ? `Personal Profile: ${f.replace(/\.[^/.]+$/, '').replace(/_/g, ' ')}` : f.replace(/\.[^/.]+$/, '').replace(/_/g, ' ');

        if (f.endsWith('.json')) {
          try {
            const parsed = JSON.parse(raw);
            const sections = parseJsonToSections(parsed);
            for (let i = 0; i < sections.length; i++) {
              const sec = sections[i];
              const score = scoreChunkRelevance(queryText, `${docLabel} ${sec.title}`, sec.content);
              allChunks.push({
                id: `${f}-sec-${i}`,
                document_title: `${docLabel} (${sec.title})`,
                content: sec.content,
                similarity: 0.9,
                score: score + (isCommon ? 1.5 : 0), // Give high priority to personal profile
              });
            }
          } catch {
            allChunks.push({
              id: `${f}-raw`,
              document_title: docLabel,
              content: raw.slice(0, 1500),
              similarity: 0.85,
              score: scoreChunkRelevance(queryText, docLabel, raw),
            });
          }
        } else {
          // Markdown / text chunking by headers or paragraphs
          const blocks = raw.split(/\n\s*#{1,3}\s+/).filter(Boolean);
          if (blocks.length > 1) {
            blocks.forEach((block, idx) => {
              const lines = block.split('\n');
              const header = lines[0]?.trim() || `Section ${idx + 1}`;
              const body = lines.slice(1).join('\n').trim();
              const score = scoreChunkRelevance(queryText, `${docLabel} ${header}`, body);
              allChunks.push({
                id: `${f}-block-${idx}`,
                document_title: `${docLabel} - ${header}`,
                content: body.slice(0, 1200),
                similarity: 0.88,
                score: score + (isCommon ? 1.5 : 0),
              });
            });
          } else {
            // Paragraph split
            const paras = raw.split(/\n\s*\n/).filter(p => p.trim().length > 15);
            paras.forEach((p, idx) => {
              const score = scoreChunkRelevance(queryText, docLabel, p);
              allChunks.push({
                id: `${f}-para-${idx}`,
                document_title: `${docLabel} (Part ${idx + 1})`,
                content: p.trim().slice(0, 1000),
                similarity: 0.85,
                score: score + (isCommon ? 1.5 : 0),
              });
            });
          }
        }
      } catch (fileErr) {
        console.warn(`[db] Error processing file ${f}:`, fileErr);
      }
    }
  };

  // 1. Process common Personal Profile directory
  const commonKbDir = path.join(process.cwd(), 'content', 'kb', 'personal-profile');
  processDir(commonKbDir, true);

  // 2. Process persona-specific directory
  const knownSlugs = ['personal-assistant', 'shop-assistant', 'tamil-companion', 'english-assistant', 'hindi-assistant', 'tamil-assistant'];
  const canonicalSlug = SLUG_ALIASES[personaId.toLowerCase()] || personaId;
  const targetSlug = knownSlugs.find(s => s === canonicalSlug) || 'personal-assistant';
  const personaKbDir = path.join(process.cwd(), 'content', 'kb', targetSlug);
  processDir(personaKbDir, false);

  // Sort chunks by score descending
  allChunks.sort((a, b) => b.score - a.score);

  return allChunks.slice(0, topK).map(c => ({
    id: c.id,
    document_title: c.document_title,
    content: c.content,
    similarity: c.score > 0 ? Math.min(0.99, 0.7 + c.score * 0.05) : c.similarity,
  }));
}

const localSessionMemories = new Map<string, string[]>();

export async function getSessionMemories(sessionId: string, personaSlug: string) {
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('session_memories')
        .select('fact')
        .eq('session_id', sessionId)
        .eq('persona_slug', personaSlug)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(20);
      if (!error && data) return data.map(r => r.fact);
    } catch (e) {
      console.warn('[db] getSessionMemories failed, using local map:', e);
    }
  }
  return localSessionMemories.get(`${sessionId}:${personaSlug}`) ?? [];
}

export async function saveMemory(sessionId: string, personaSlug: string, fact: string) {
  const existing = await getSessionMemories(sessionId, personaSlug);
  if (existing.length >= 20) return;

  if (supabase) {
    try {
      await supabase.from('session_memories').insert({
        session_id: sessionId,
        persona_slug: personaSlug,
        fact,
      });
      return;
    } catch (e) {
      console.warn('[db] saveMemory Supabase insert failed, saving to local map:', e);
    }
  }

  const key = `${sessionId}:${personaSlug}`;
  const list = localSessionMemories.get(key) ?? [];
  list.unshift(fact);
  localSessionMemories.set(key, list);
}
