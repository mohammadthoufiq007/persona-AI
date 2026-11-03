// RIFF WAV encoder for 16-bit mono PCM audio with buffer allocation safety
export function encodeWav(samples: Float32Array, sampleRate = 16000): Blob {
  if (!samples || samples.length === 0 || !Number.isFinite(samples.length)) {
    return new Blob([], { type: 'audio/wav' });
  }

  // Cap maximum samples to 30 seconds to prevent huge buffer allocations
  const maxSamples = Math.floor(sampleRate * 30);
  const safeSamples = samples.length > maxSamples ? samples.subarray(0, maxSamples) : samples;

  const numChannels = 1;
  const bitsPerSample = 16;
  const byteRate = sampleRate * numChannels * (bitsPerSample / 8);
  const blockAlign = numChannels * (bitsPerSample / 8);
  const dataSize = safeSamples.length * (bitsPerSample / 8);

  if (!Number.isFinite(dataSize) || dataSize <= 0) {
    return new Blob([], { type: 'audio/wav' });
  }

  try {
    const buffer = new ArrayBuffer(44 + dataSize);
    const view = new DataView(buffer);

    const writeString = (offset: number, str: string) => {
      for (let i = 0; i < str.length; i++) {
        view.setUint8(offset + i, str.charCodeAt(i));
      }
    };

    // RIFF Chunk Descriptor
    writeString(0, 'RIFF');
    view.setUint32(4, 36 + dataSize, true);
    writeString(8, 'WAVE');

    // "fmt " sub-chunk
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true); // Subchunk1Size (16 for PCM)
    view.setUint16(20, 1, true);  // AudioFormat (1 for PCM)
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, byteRate, true);
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, bitsPerSample, true);

    // "data" sub-chunk
    writeString(36, 'data');
    view.setUint32(40, dataSize, true);

    // Write PCM audio samples (Float32 to Int16)
    let offset = 44;
    for (let i = 0; i < safeSamples.length; i++, offset += 2) {
      const s = Math.max(-1, Math.min(1, safeSamples[i]));
      view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
    }

    return new Blob([buffer], { type: 'audio/wav' });
  } catch (err) {
    console.warn('[wav-encoder] Error allocating WAV buffer:', err);
    return new Blob([], { type: 'audio/wav' });
  }
}
