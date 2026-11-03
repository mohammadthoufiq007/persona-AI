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

const BASE = 'https://api.vachana.ai';
const KEY = process.env.GNANI_API_KEY;

async function generateStaticAudio(text: string, voice: string, language: string, outputFile: string) {
  if (!KEY || KEY.includes('REPLACE_WITH')) {
    console.warn(`[gen-audio] No GNANI_API_KEY. Skipping ${outputFile}`);
    return;
  }

  console.log(`Generating static audio for "${text}" -> ${outputFile}`);
  const res = await fetch(`${BASE}/api/v1/tts/sse`, {
    method: 'POST',
    headers: {
      'X-API-Key-ID': KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      text,
      voice,
      model: 'timbre-v2.5',
      language,
      speed: 1.0,
      audio_config: {
        encoding: 'linear_pcm',
        sample_rate: 24000,
        num_channels: 1,
        sample_width: 2,
        container: 'raw',
      },
    }),
  });

  if (!res.ok) {
    console.error(`Failed generating audio: ${res.status}`);
    return;
  }

  const reader = res.body?.getReader();
  if (!reader) return;

  const chunks: Buffer[] = [];
  const decoder = new TextDecoder();
  let buf = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += decoder.decode(value, { stream: true });
    const lines = buf.split('\n');
    buf = lines.pop() ?? '';

    for (const line of lines) {
      if (!line.startsWith('data:')) continue;
      try {
        const payload = JSON.parse(line.slice(5).trim());
        const audioData = payload.audio || (payload.event === 'chunk' ? payload.data : undefined) || payload.data;
        if (typeof audioData === 'string' && audioData.length > 0) {
          chunks.push(Buffer.from(audioData, 'base64'));
        }
      } catch {}
    }
  }

  const targetDir = path.dirname(outputFile);
  if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir, { recursive: true });

  const totalBuffer = Buffer.concat(chunks);
  fs.writeFileSync(outputFile, totalBuffer);
  console.log(`Saved ${outputFile} (${totalBuffer.length} bytes)`);
}

async function main() {
  const audioDir = path.join(process.cwd(), 'public', 'audio');
  if (!fs.existsSync(audioDir)) fs.mkdirSync(audioDir, { recursive: true });

  await generateStaticAudio(
    "Hey! I'm Aria, your personal assistant. What's on your mind today?",
    'Kaveri',
    'en-IN',
    path.join(audioDir, 'personal-assistant-greeting.pcm')
  );

  await generateStaticAudio(
    "Namaste! Welcome to Sharma Kirana. Aaj main aapki kya seva kar sakta hoon?",
    'Poorvi',
    'hi-IN',
    path.join(audioDir, 'shop-assistant-greeting.pcm')
  );

  await generateStaticAudio(
    "Vanakkam! Naan ungalthu Chennai companion. Enga polam, enna theriyanum sollu?",
    'Kaveri',
    'ta-IN',
    path.join(audioDir, 'tamil-companion-greeting.pcm')
  );

  await generateStaticAudio(
    "Demo limit reached for this session. Please try again shortly or use text mode.",
    'Kaveri',
    'en-IN',
    path.join(audioDir, 'limit-reached.pcm')
  );
}

main().catch(console.error);
