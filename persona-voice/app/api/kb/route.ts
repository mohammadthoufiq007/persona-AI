import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    const kbRoot = path.join(process.cwd(), 'content', 'kb');
    if (!fs.existsSync(kbRoot)) {
      return NextResponse.json({ documents: [] });
    }

    const documents: any[] = [];
    const dirs = fs.readdirSync(kbRoot);

    for (const d of dirs) {
      const dPath = path.join(kbRoot, d);
      if (!fs.statSync(dPath).isDirectory()) continue;

      const files = fs.readdirSync(dPath).filter(f => f.endsWith('.md') || f.endsWith('.txt') || f.endsWith('.json') || f.endsWith('.csv'));
      for (const f of files) {
        const filePath = path.join(dPath, f);
        const content = fs.readFileSync(filePath, 'utf-8');
        const stats = fs.statSync(filePath);

        const isPersonalProfile = d === 'personal-profile';
        const personaName = isPersonalProfile
          ? 'Personal Profile'
          : d === 'shop-assistant'
          ? 'Rahu'
          : d === 'tamil-companion'
          ? 'Maragatham'
          : 'Sapphire';

        const language = isPersonalProfile
          ? 'Common (All Languages)'
          : d === 'shop-assistant'
          ? 'हिन्दी'
          : d === 'tamil-companion'
          ? 'தமிழ்'
          : 'English';

        let chunks = content
          .split(/\n\s*\n/)
          .map(c => c.trim())
          .filter(c => c.length > 10);

        if (chunks.length === 0) {
          chunks = [content.slice(0, 500) || 'Knowledge snippet'];
        }

        documents.push({
          id: `fs-${d}-${f}`,
          title: f,
          personaSlug: d,
          personaName,
          language,
          chunkCount: chunks.length,
          tokens: Math.max(25, Math.round(content.length / 3.8)),
          lastUpdated: stats.mtime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          description: isPersonalProfile
            ? 'Common personal profile grounding shared across English, Hindi, and Tamil.'
            : `Grounded knowledge base for ${personaName}.`,
          sampleChunks: chunks.slice(0, 6),
          isCustom: true,
        });
      }
    }

    return NextResponse.json({ documents });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { persona = 'personal-profile', filename, content } = body;

    if (!filename || !content) {
      return NextResponse.json({ error: 'Filename and content are required' }, { status: 400 });
    }

    const safeFilename = path.basename(filename).replace(/[^a-zA-Z0-9._-]/g, '_');
    const targetDir = path.join(process.cwd(), 'content', 'kb', persona);

    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    const filePath = path.join(targetDir, safeFilename);
    fs.writeFileSync(filePath, content, 'utf-8');

    return NextResponse.json({
      success: true,
      message: `Saved ${safeFilename} to ${persona}`,
      path: filePath,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const persona = searchParams.get('persona');
    const filename = searchParams.get('filename');
    const deleteAll = searchParams.get('all') === 'true';

    const kbRoot = path.join(process.cwd(), 'content', 'kb');

    if (deleteAll) {
      if (fs.existsSync(kbRoot)) {
        const dirs = fs.readdirSync(kbRoot);
        for (const d of dirs) {
          const dPath = path.join(kbRoot, d);
          if (fs.statSync(dPath).isDirectory()) {
            const files = fs.readdirSync(dPath);
            for (const f of files) {
              fs.unlinkSync(path.join(dPath, f));
            }
          }
        }
      }
      return NextResponse.json({ success: true, message: 'All KB files deleted' });
    }

    if (persona && filename) {
      const safeFilename = path.basename(filename);
      const filePath = path.join(kbRoot, persona, safeFilename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      return NextResponse.json({ success: true, message: `Deleted ${filename}` });
    }

    return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
