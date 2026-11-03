import { createClient } from '@supabase/supabase-js';
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';
import { GoogleGenAI } from '@google/genai';
import fs from 'fs';
import path from 'path';

// Load .env.local
try {
  if (fs.existsSync('.env.local')) {
    const lines = fs.readFileSync('.env.local', 'utf-8').split('\n');
    for (const line of lines) {
      const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
      if (match && !process.env[match[1]]) {
        process.env[match[1]] = match[2]?.trim().replace(/^['"]|['"]$/g, '') || '';
      }
    }
  }
} catch {}

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const geminiApiKey = process.env.GEMINI_API_KEY!;
const embedModel = process.env.GEMINI_EMBED_MODEL ?? 'gemini-embedding-001';

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false },
});

const genAI = new GoogleGenAI({ apiKey: geminiApiKey });

async function embed(text: string): Promise<number[]> {
  try {
    const res = await genAI.models.embedContent({
      model: embedModel,
      contents: [{ role: 'user', parts: [{ text }] }],
      config: {
        taskType: 'RETRIEVAL_DOCUMENT',
        outputDimensionality: 768,
      },
    });
    return res.embeddings?.[0]?.values ?? new Array(768).fill(0);
  } catch (e) {
    console.warn(`Failed embedding: ${e}`);
    return new Array(768).fill(0);
  }
}

async function ingestFile(personaSlug: string, filePath: string) {
  console.log(`Ingesting for ${personaSlug}: ${filePath}`);

  // 1. Get persona ID
  const { data: persona, error: pErr } = await supabase
    .from('personas')
    .select('id')
    .eq('slug', personaSlug)
    .single();

  if (pErr || !persona) {
    console.error(`Persona not found for slug ${personaSlug}. Run npm run seed first.`);
    return;
  }

  const content = fs.readFileSync(filePath, 'utf-8');
  const title = path.basename(filePath, path.extname(filePath)).replace(/_/g, ' ');

  // 2. Create document record
  const { data: doc, error: dErr } = await supabase
    .from('documents')
    .insert({
      persona_id: persona.id,
      title,
    })
    .select('id')
    .single();

  if (dErr || !doc) {
    console.error(`Failed to create document:`, dErr);
    return;
  }

  // 3. Chunk content
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 400,
    chunkOverlap: 50,
  });

  const docs = await splitter.createDocuments([content]);
  console.log(`Created ${docs.length} chunks for ${title}`);

  // 4. Embed and insert chunks
  for (let i = 0; i < docs.length; i++) {
    const chunkText = docs[i].pageContent;
    const embedding = await embed(chunkText);

    const { error: cErr } = await supabase.from('chunks').insert({
      document_id: doc.id,
      persona_id: persona.id,
      content: chunkText,
      embedding,
    });

    if (cErr) {
      console.error(`Failed inserting chunk ${i}:`, cErr.message);
    } else {
      process.stdout.write(`.` );
    }
  }
  console.log(`\nDone ingesting ${title}`);
}

async function main() {
  const customFile = process.argv[2];
  const targetPersona = process.env.PERSONA_SLUG;

  if (customFile && targetPersona) {
    await ingestFile(targetPersona, customFile);
    return;
  }

  // Scan all folders in content/kb/
  const kbRoot = path.join(process.cwd(), 'content', 'kb');
  if (!fs.existsSync(kbRoot)) {
    console.log('No content/kb directory found.');
    return;
  }

  const personaDirs = fs.readdirSync(kbRoot);
  for (const pDir of personaDirs) {
    const pPath = path.join(kbRoot, pDir);
    if (!fs.statSync(pPath).isDirectory()) continue;

    const files = fs.readdirSync(pPath).filter(f => f.endsWith('.md') || f.endsWith('.txt'));
    for (const f of files) {
      await ingestFile(pDir, path.join(pPath, f));
    }
  }
}

main().catch(console.error);
