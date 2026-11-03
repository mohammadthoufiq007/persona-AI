import { describe, it, expect } from 'vitest';

const BACKEND_URL = process.env.TEST_BACKEND_URL || 'http://localhost:3000';
const FRONTEND_URL = process.env.TEST_FRONTEND_URL || 'http://localhost:3001';

// Helper to create valid 16kHz mono 16-bit PCM WAV in Node.js
function createSyntheticWav(durationSeconds: number, sampleRate = 16000): Buffer {
  const numChannels = 1;
  const bytesPerSample = 2; // 16-bit
  const numSamples = Math.floor(sampleRate * durationSeconds);
  const dataSize = numSamples * numChannels * bytesPerSample;
  const buffer = Buffer.alloc(44 + dataSize);

  // RIFF header
  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write('WAVE', 8);

  // fmt subchunk
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16); // Subchunk1Size
  buffer.writeUInt16LE(1, 20);  // AudioFormat (1 = PCM)
  buffer.writeUInt16LE(numChannels, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(sampleRate * numChannels * bytesPerSample, 28); // ByteRate
  buffer.writeUInt16LE(numChannels * bytesPerSample, 32); // BlockAlign
  buffer.writeUInt16LE(16, 34); // BitsPerSample

  // data subchunk
  buffer.write('data', 36);
  buffer.writeUInt32LE(dataSize, 40);

  // Sine wave audio samples
  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    const sample = Math.sin(2 * Math.PI * 440 * t) * 0.25; // 440Hz tone
    const int16 = Math.floor(sample * 32767);
    buffer.writeInt16LE(int16, 44 + i * 2);
  }

  return buffer;
}

describe('PersonaVoice API Contract & Hardening Verification', () => {
  it('1. GET /api/health returns 200 OK', async () => {
    const res = await fetch(`${BACKEND_URL}/api/health`);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.status).toBe('ok');
    expect(json.service).toBe('PersonaVoice');
  });

  it('2. POST /api/session issues valid session token, cookie, and 3 personas', async () => {
    const res = await fetch(`${FRONTEND_URL}/api/session`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ turnstileToken: 'bypass_dev_token' }),
    });

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.sessionId).toBeDefined();
    expect(data.quota).toBeDefined();
    expect(data.personas).toHaveLength(3);

    const slugs = data.personas.map((p: { slug: string }) => p.slug);
    expect(slugs).toContain('personal-assistant');
    expect(slugs).toContain('shop-assistant');
    expect(slugs).toContain('tamil-companion');

    // Verify Set-Cookie header contains pv_s
    const setCookie = res.headers.get('set-cookie');
    expect(setCookie).toBeTruthy();
    expect(setCookie).toMatch(/pv_s=/);
  }, 15000);

  it('3. POST /api/turn streams valid NDJSON event sequence for text turn', async () => {
    const form = new FormData();
    form.append('persona', 'personal-assistant');
    form.append('history', JSON.stringify([]));
    form.append('text', 'What is PersonaVoice?');

    const res = await fetch(`${FRONTEND_URL}/api/turn`, {
      method: 'POST',
      body: form,
    });

    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toContain('application/x-ndjson');

    const text = await res.text();
    const lines = text.split('\n').filter(l => l.trim().length > 0);
    const events = lines.map(l => JSON.parse(l));

    const eventTypes = events.map(e => e.t);
    expect(eventTypes).toContain('transcript');
    expect(eventTypes).toContain('sources');
    expect(eventTypes).toContain('timing');
    expect(eventTypes).toContain('done');

    const transcriptEvent = events.find(e => e.t === 'transcript');
    expect(transcriptEvent.text).toBe('What is PersonaVoice?');

    const doneEvent = events.find(e => e.t === 'done');
    expect(doneEvent).toBeDefined();
  }, 30000);

  it('4. POST /api/turn rejects non-WAV audio with invalid_audio_format', async () => {
    // 100 bytes of non-WAV data
    const fakeAudio = Buffer.alloc(100, 0x41); // 'AAAA...'
    const form = new FormData();
    form.append('persona', 'personal-assistant');
    form.append('history', JSON.stringify([]));
    form.append('audio', new Blob([new Uint8Array(fakeAudio)], { type: 'audio/wav' }), 'fake.wav');

    const res = await fetch(`${FRONTEND_URL}/api/turn`, {
      method: 'POST',
      body: form,
    });

    expect(res.status).toBe(200);
    const text = await res.text();
    const event = JSON.parse(text.trim());
    expect(event.t).toBe('error');
    expect(event.code).toBe('invalid_audio_format');
  });

  it('5. POST /api/turn rejects audio longer than 20 seconds with audio_too_large', async () => {
    // Generate a 22-second WAV file
    const longWav = createSyntheticWav(22);
    const form = new FormData();
    form.append('persona', 'personal-assistant');
    form.append('history', JSON.stringify([]));
    form.append('audio', new Blob([new Uint8Array(longWav)], { type: 'audio/wav' }), 'long.wav');

    const res = await fetch(`${FRONTEND_URL}/api/turn`, {
      method: 'POST',
      body: form,
    });

    expect(res.status).toBe(200);
    const text = await res.text();
    const event = JSON.parse(text.trim());
    expect(event.t).toBe('error');
    expect(event.code).toBe('audio_too_large');
  });

  it('6. POST /api/turn rejects missing input with missing_input error', async () => {
    const form = new FormData();
    form.append('persona', 'personal-assistant');
    form.append('history', JSON.stringify([]));

    const res = await fetch(`${FRONTEND_URL}/api/turn`, {
      method: 'POST',
      body: form,
    });

    expect(res.status).toBe(200);
    const text = await res.text();
    const event = JSON.parse(text.trim());
    expect(event.t).toBe('error');
    expect(event.code).toBe('missing_input');
  });

  it('7. Persona definitions have correct voices matching Sapphire, Rahu, Maragatham', async () => {
    const fs = await import('fs');
    const path = await import('path');

    const enRaw = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'content/personas/personal-assistant.json'), 'utf8'));
    const hiRaw = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'content/personas/shop-assistant.json'), 'utf8'));
    const taRaw = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'content/personas/tamil-companion.json'), 'utf8'));

    expect(['Sapphire', 'Saphire']).toContain(enRaw.private_config.tts.voice);
    expect(enRaw.private_config.sttLanguage).toBe('en-IN');

    expect(hiRaw.private_config.tts.voice).toBe('Rahu');
    expect(hiRaw.private_config.sttLanguage).toBe('hi-IN');

    expect(taRaw.private_config.tts.voice).toBe('Maragatham');
    expect(taRaw.private_config.sttLanguage).toBe('ta-IN');
  });
});
