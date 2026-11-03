import fs from 'fs';
import path from 'path';

const fixturesDir = path.join(process.cwd(), 'fixtures');
if (!fs.existsSync(fixturesDir)) {
  fs.mkdirSync(fixturesDir, { recursive: true });
}

function createWavFile(outputPath, durationSeconds = 2.5, frequency = 440) {
  const sampleRate = 16000;
  const numChannels = 1;
  const bytesPerSample = 2;
  const numSamples = Math.floor(sampleRate * durationSeconds);
  const dataSize = numSamples * numChannels * bytesPerSample;
  const buffer = Buffer.alloc(44 + dataSize);

  // RIFF header
  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write('WAVE', 8);

  // fmt chunk
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20); // PCM
  buffer.writeUInt16LE(numChannels, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(sampleRate * numChannels * bytesPerSample, 28);
  buffer.writeUInt16LE(numChannels * bytesPerSample, 32);
  buffer.writeUInt16LE(16, 34);

  // data chunk
  buffer.write('data', 36);
  buffer.writeUInt32LE(dataSize, 40);

  // Speech-like amplitude modulated tone
  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    // Modulate with speech-cadence envelope (~3Hz)
    const envelope = Math.sin(2 * Math.PI * 3 * t) > 0 ? 0.3 : 0.05;
    const sample = Math.sin(2 * Math.PI * frequency * t) * envelope;
    const int16 = Math.floor(sample * 32767);
    buffer.writeInt16LE(int16, 44 + i * 2);
  }

  fs.writeFileSync(outputPath, buffer);
  console.log(`Generated fixture: ${outputPath} (${buffer.length} bytes)`);
}

createWavFile(path.join(fixturesDir, 'speech-en.wav'), 2.5, 300);
createWavFile(path.join(fixturesDir, 'speech-hi.wav'), 2.5, 450);
createWavFile(path.join(fixturesDir, 'speech-ta.wav'), 2.5, 600);
