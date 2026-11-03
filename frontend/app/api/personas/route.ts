import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { supabase } from '@/lib/db';

export const runtime = 'nodejs';

const PERSONAS_DIR = path.join(process.cwd(), 'content', 'personas');

// Normalized aliases
const SLUG_TO_FILE: Record<string, string> = {
  'english-assistant': 'english-assistant.json',
  'personal-assistant': 'english-assistant.json',
  'sapphire': 'english-assistant.json',
  'hindi-assistant': 'hindi-assistant.json',
  'shop-assistant': 'hindi-assistant.json',
  'rahu': 'hindi-assistant.json',
  'tamil-assistant': 'tamil-assistant.json',
  'tamil-companion': 'tamil-assistant.json',
  'maragatham': 'tamil-assistant.json',
};

export async function GET() {
  try {
    if (!fs.existsSync(PERSONAS_DIR)) {
      return NextResponse.json({ error: 'Personas directory not found' }, { status: 404 });
    }

    const files = ['english-assistant.json', 'hindi-assistant.json', 'tamil-assistant.json'];
    const personas = [];

    for (const f of files) {
      const p = path.join(PERSONAS_DIR, f);
      if (fs.existsSync(p)) {
        try {
          const raw = fs.readFileSync(p, 'utf-8');
          const json = JSON.parse(raw);
          personas.push(json);
        } catch (err) {
          console.warn(`[api/personas] Error parsing ${f}:`, err);
        }
      }
    }

    // Also load manifest if present for project metadata
    let manifest = null;
    const manifestPath = path.join(PERSONAS_DIR, 'manifest.json');
    if (fs.existsSync(manifestPath)) {
      try {
        manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
      } catch {}
    }

    return NextResponse.json({
      personas,
      manifest,
    });
  } catch (error: any) {
    console.error('[api/personas] GET error:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch personas' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { slug, personaData, reset } = body;

    if (!slug) {
      return NextResponse.json({ error: 'Persona slug is required' }, { status: 400 });
    }

    const targetFile = SLUG_TO_FILE[slug.toLowerCase()];
    if (!targetFile) {
      return NextResponse.json({ error: `Unknown persona slug: ${slug}` }, { status: 400 });
    }

    const filePath = path.join(PERSONAS_DIR, targetFile);

    // If reset requested, check if a backup / default exists or write base templates
    if (reset) {
      const manifestPath = path.join(PERSONAS_DIR, 'manifest.json');
      if (fs.existsSync(manifestPath)) {
        try {
          const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
          const defaultAgent = (manifest.agents || []).find((a: any) => 
            a.slug === slug || SLUG_TO_FILE[a.slug] === targetFile
          );
          if (defaultAgent) {
            fs.writeFileSync(filePath, JSON.stringify(defaultAgent, null, 2), 'utf-8');
            return NextResponse.json({ success: true, persona: defaultAgent, message: 'Reset to default configuration' });
          }
        } catch {}
      }
    }

    if (!personaData || typeof personaData !== 'object') {
      return NextResponse.json({ error: 'Invalid persona data' }, { status: 400 });
    }

    // Ensure slug and name are preserved
    const updatedData = {
      slug: personaData.slug || slug,
      name: personaData.name || 'Voice Assistant',
      public_config: {
        name: personaData.public_config?.name || 'Assistant',
        languageLabel: personaData.public_config?.languageLabel || 'Language',
        accentColor: personaData.public_config?.accentColor || '#3B82F6',
        greetingText: personaData.public_config?.greetingText || 'Hello! How can I help you?',
      },
      private_config: {
        systemPrompt: personaData.private_config?.systemPrompt || '',
        sttLanguage: personaData.private_config?.sttLanguage || 'en-IN',
        tone: personaData.private_config?.tone || 'Warm, professional, concise',
        speechStyle: personaData.private_config?.speechStyle || '1 to 2 spoken sentences, natural conversational pace, zero markdown',
        tts: {
          model: personaData.private_config?.tts?.model || 'timbre-v2.5',
          voice: personaData.private_config?.tts?.voice || 'Sapphire',
          language: personaData.private_config?.tts?.language || personaData.private_config?.sttLanguage || 'en-IN',
          speed: Number(personaData.private_config?.tts?.speed ?? 1.0),
        },
        biasWords: Array.isArray(personaData.private_config?.biasWords)
          ? personaData.private_config.biasWords
          : typeof personaData.private_config?.biasWords === 'string'
          ? (personaData.private_config.biasWords as string).split(',').map((w: string) => w.trim()).filter(Boolean)
          : [],
        retrieval: {
          top_k: Number(personaData.private_config?.retrieval?.top_k ?? 4),
          min_similarity: Number(personaData.private_config?.retrieval?.min_similarity ?? 0.6),
          inject_as: personaData.private_config?.retrieval?.inject_as || 'system_context',
          fallback_response: personaData.private_config?.retrieval?.fallback_response || "I could not find that information in your profile notes.",
        },
      },
    };

    // Save to primary file
    fs.writeFileSync(filePath, JSON.stringify(updatedData, null, 2), 'utf-8');

    // Also mirror to legacy alias files so both personal-assistant and english-assistant stay in sync
    if (targetFile === 'english-assistant.json') {
      const aliasPath = path.join(PERSONAS_DIR, 'personal-assistant.json');
      fs.writeFileSync(aliasPath, JSON.stringify(updatedData, null, 2), 'utf-8');
    } else if (targetFile === 'hindi-assistant.json') {
      const aliasPath = path.join(PERSONAS_DIR, 'shop-assistant.json');
      fs.writeFileSync(aliasPath, JSON.stringify(updatedData, null, 2), 'utf-8');
    } else if (targetFile === 'tamil-assistant.json') {
      const aliasPath = path.join(PERSONAS_DIR, 'tamil-companion.json');
      fs.writeFileSync(aliasPath, JSON.stringify(updatedData, null, 2), 'utf-8');
    }

    // Sync with manifest.json
    const manifestPath = path.join(PERSONAS_DIR, 'manifest.json');
    if (fs.existsSync(manifestPath)) {
      try {
        const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
        const idx = (manifest.agents || []).findIndex((a: any) => 
          a.slug === slug || SLUG_TO_FILE[a.slug] === targetFile
        );
        if (idx !== -1) {
          manifest.agents[idx] = updatedData;
          fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), 'utf-8');
        }
      } catch (mErr) {
        console.warn('[api/personas] Manifest sync warning:', mErr);
      }
    }

    // If Supabase is connected, sync persona record
    if (supabase) {
      try {
        await supabase
          .from('personas')
          .upsert({
            slug: updatedData.slug,
            name: updatedData.name,
            public_config: updatedData.public_config,
            private_config: updatedData.private_config,
          }, { onConflict: 'slug' });
      } catch (dbErr) {
        console.warn('[api/personas] Supabase sync warning:', dbErr);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Updated configuration for ${updatedData.public_config.name}`,
      persona: updatedData,
    });
  } catch (error: any) {
    console.error('[api/personas] POST error:', error);
    return NextResponse.json({ error: error.message || 'Failed to update persona' }, { status: 500 });
  }
}
