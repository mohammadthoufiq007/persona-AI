// Web Audio API 16kHz Mono Microphone Recorder with Silence Detection (VAD) & Live Audio Level
import { encodeWav } from './wav-encoder';

export interface RecorderOptions {
  onAudioLevel?: (level: number) => void;
  onSilenceTimeout?: () => void;
  silenceMs?: number; // default ~1500ms
  silenceThreshold?: number; // RMS threshold
}

export class VoiceRecorder {
  private mediaStream: MediaStream | null = null;
  private audioCtx: AudioContext | null = null;
  private sourceNode: MediaStreamAudioSourceNode | null = null;
  private processorNode: ScriptProcessorNode | null = null;
  private analyserNode: AnalyserNode | null = null;
  private recordedSamples: Float32Array[] = [];
  private totalSampleCount = 0;
  private isRecording = false;
  private hasSpoken = false;
  private silenceStartTime: number | null = null;
  private options: RecorderOptions;

  constructor(options: RecorderOptions = {}) {
    this.options = {
      silenceMs: 1500,
      silenceThreshold: 0.015,
      ...options,
    };
  }

  async start(): Promise<void> {
    if (this.isRecording) return;

    try {
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
    } catch (err: unknown) {
      const error = err as Error;
      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        throw new Error('Microphone permission denied. Please allow microphone access in your browser.');
      } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
        throw new Error('No microphone device found on your system.');
      } else {
        throw new Error(`Microphone access error: ${error.message || 'Unknown error'}`);
      }
    }

    try {
      // Initialize 16kHz AudioContext (or default context with downsampling)
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      try {
        this.audioCtx = new AudioCtx({ sampleRate: 16000 });
      } catch {
        // Fallback to hardware default if 16000 is not supported by device
        this.audioCtx = new AudioCtx();
      }
      if (this.audioCtx.state === 'suspended') {
        await this.audioCtx.resume();
      }

      this.sourceNode = this.audioCtx.createMediaStreamSource(this.mediaStream);
      this.analyserNode = this.audioCtx.createAnalyser();
      this.analyserNode.fftSize = 256;
    } catch (err) {
      if (this.mediaStream) {
        this.mediaStream.getTracks().forEach((t) => t.stop());
        this.mediaStream = null;
      }
      throw err;
    }

    // Buffer size 2048, 1 input channel, 1 output channel
    this.processorNode = this.audioCtx.createScriptProcessor(2048, 1, 1);

    this.recordedSamples = [];
    this.totalSampleCount = 0;
    this.isRecording = true;
    this.hasSpoken = false;
    this.silenceStartTime = null;

    this.processorNode.onaudioprocess = (e) => {
      if (!this.isRecording) return;

      const inputData = e.inputBuffer.getChannelData(0);
      const chunk = new Float32Array(inputData.length);
      chunk.set(inputData);
      this.recordedSamples.push(chunk);
      this.totalSampleCount += chunk.length;

      // Calculate Root Mean Square (RMS) for audio level & silence detection
      let sum = 0;
      for (let i = 0; i < inputData.length; i++) {
        sum += inputData[i] * inputData[i];
      }
      const rms = Math.sqrt(sum / inputData.length);
      const normalizedLevel = Math.min(1, rms * 4); // Boost visually

      this.options.onAudioLevel?.(normalizedLevel);

      const silenceThresh = this.options.silenceThreshold ?? 0.015;
      const silenceLimitMs = this.options.silenceMs ?? 1500;

      if (rms > silenceThresh) {
        this.hasSpoken = true;
        this.silenceStartTime = null;
      } else if (this.hasSpoken) {
        const now = Date.now();
        if (this.silenceStartTime === null) {
          this.silenceStartTime = now;
        } else if (now - this.silenceStartTime >= silenceLimitMs) {
          // 1.5s of silence reached after speech
          this.options.onSilenceTimeout?.();
        }
      }
    };

    this.sourceNode.connect(this.analyserNode);
    this.analyserNode.connect(this.processorNode);
    this.processorNode.connect(this.audioCtx.destination);
  }

  async stop(): Promise<{ blob: Blob; url: string; durationMs: number }> {
    this.isRecording = false;

    if (this.processorNode) {
      this.processorNode.disconnect();
      this.processorNode.onaudioprocess = null;
      this.processorNode = null;
    }

    if (this.analyserNode) {
      this.analyserNode.disconnect();
      this.analyserNode = null;
    }

    if (this.sourceNode) {
      this.sourceNode.disconnect();
      this.sourceNode = null;
    }

    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((t) => t.stop());
      this.mediaStream = null;
    }

    const sampleRate = this.audioCtx?.sampleRate || 16000;
    if (this.audioCtx && this.audioCtx.state !== 'closed') {
      try {
        await this.audioCtx.close();
      } catch {}
      this.audioCtx = null;
    }

    // Merge all Float32Array chunks into a single Float32Array
    const merged = new Float32Array(this.totalSampleCount);
    let offset = 0;
    for (const chunk of this.recordedSamples) {
      merged.set(chunk, offset);
      offset += chunk.length;
    }

    // Resample to 16kHz if hardware runs at a different rate
    let finalSamples: Float32Array<any> = merged;
    let finalSampleRate = sampleRate;
    if (sampleRate !== 16000 && sampleRate > 0 && merged.length > 0) {
      finalSamples = downsampleTo16k(merged, sampleRate);
      finalSampleRate = 16000;
    }

    // Encode to standard 16kHz 16-bit mono RIFF WAV
    const blob = encodeWav(finalSamples as Float32Array, finalSampleRate);
    const url = URL.createObjectURL(blob);
    const durationMs = Math.round((finalSamples.length / finalSampleRate) * 1000);

    return { blob, url, durationMs };
  }

  get active(): boolean {
    return this.isRecording;
  }
}

function downsampleTo16k(buffer: Float32Array<any>, inputSampleRate: number): Float32Array<any> {
  if (inputSampleRate === 16000) return buffer;
  const ratio = inputSampleRate / 16000;
  const newLength = Math.round(buffer.length / ratio);
  const result = new Float32Array(newLength);
  for (let i = 0; i < newLength; i++) {
    const origIndex = i * ratio;
    const index1 = Math.floor(origIndex);
    const index2 = Math.min(index1 + 1, buffer.length - 1);
    const fraction = origIndex - index1;
    result[i] = buffer[index1] * (1 - fraction) + buffer[index2] * fraction;
  }
  return result;
}
