import { MicVAD } from '@ricky0123/vad-web';

export interface VadOptions {
  onSpeechStart: () => void;
  onSpeechEnd: (samples: Float32Array) => void;
  onVADMisfire?: () => void;
  minSpeechMs?: number;
  maxSpeechMs?: number;
}

export async function startVAD(opts: VadOptions): Promise<{ stop: () => void; isSupported: boolean }> {
  try {
    const vad = await MicVAD.new({
      baseAssetPath: '/vad/',
      onnxWASMBasePath: '/vad/',
      onSpeechStart: opts.onSpeechStart,
      onSpeechEnd: (audio) => {
        // Discard clips under minSpeechMs (default 400ms at 16kHz = 6400 samples)
        const minSamples = ((opts.minSpeechMs ?? 400) / 1000) * 16000;
        if (audio.length < minSamples) {
          opts.onVADMisfire?.();
          return;
        }

        // Hard cap at maxSpeechMs (default 20,000ms = 320,000 samples)
        const maxSamples = ((opts.maxSpeechMs ?? 20000) / 1000) * 16000;
        opts.onSpeechEnd(audio.slice(0, maxSamples));
      },
      onVADMisfire: opts.onVADMisfire,
      redemptionMs: 640, // ~640ms silence before concluding speech
    });

    vad.start();
    return {
      stop: () => {
        try {
          vad.destroy();
        } catch {}
      },
      isSupported: true,
    };
  } catch (err) {
    console.warn('[vad] WebVAD initialization failed, falling back to manual recording:', err);
    return {
      stop: () => {},
      isSupported: false,
    };
  }
}
