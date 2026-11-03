// Web Audio API Sequential Playback Queue for 24kHz PCM / Audio Chunks
import { encodeWav } from './wav-encoder';

export class AudioPlaybackQueue {
  private ctx: AudioContext | null = null;
  public analyser: AnalyserNode | null = null;
  private nextStart = 0;
  private nodes: AudioBufferSourceNode[] = [];
  private carry: Uint8Array = new Uint8Array(0);
  private checkInterval: ReturnType<typeof setInterval> | null = null;
  private recordedFloatChunks: Float32Array[] = [];
  private totalRecordedSamples = 0;
  public onPlaybackComplete?: () => void;
  public onPlaybackStart?: () => void;

  private initContext() {
    try {
      if (!this.ctx || this.ctx.state === 'closed') {
        const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        this.ctx = new AudioCtx();
        this.analyser = this.ctx.createAnalyser();
        this.analyser.fftSize = 256;
        this.analyser.connect(this.ctx.destination);
      }
      if (this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }
    } catch (err) {
      console.warn('[audio-queue] AudioContext init warning:', err);
    }
  }

  // Ensure AudioContext is awakened within a synchronous user gesture
  ensureContextResumed(): void {
    try {
      this.initContext();
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }
    } catch {}
  }

  enqueuePcmChunk(b64: string, sampleRate = 24000): void {
    if (!b64 || typeof b64 !== 'string') return;
    const cleanB64 = b64.replace(/\s/g, '');
    if (!cleanB64) return;

    try {
      this.initContext();
      if (!this.ctx || !this.analyser) return;

      const binaryString = atob(cleanB64);
      const raw = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        raw[i] = binaryString.charCodeAt(i);
      }

      // Prepend carry from previous chunk if present
      let bytes: Uint8Array;
      if (this.carry.length > 0) {
        bytes = new Uint8Array(this.carry.length + raw.length);
        bytes.set(this.carry);
        bytes.set(raw, this.carry.length);
        this.carry = new Uint8Array(0);
      } else {
        bytes = raw;
      }

      // Handle odd-length (PCM int16 = 2 bytes per sample)
      if (bytes.length % 2 !== 0) {
        this.carry = bytes.slice(-1);
        bytes = bytes.slice(0, -1);
      }

      if (bytes.length < 2) return;

      const numSamples = Math.floor(bytes.length / 2);
      if (numSamples <= 0 || !Number.isFinite(numSamples)) return;

      const abuf = this.ctx.createBuffer(1, numSamples, sampleRate);
      const channel = abuf.getChannelData(0);
      const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);

      for (let i = 0; i < numSamples; i++) {
        channel[i] = view.getInt16(i * 2, true) / 32768;
      }

      // Save chunk in memory for replay (capped at 30 seconds to prevent leak)
      if (this.totalRecordedSamples < sampleRate * 30) {
        const chunkCopy = new Float32Array(channel);
        this.recordedFloatChunks.push(chunkCopy);
        this.totalRecordedSamples += chunkCopy.length;
      }

      const node = this.ctx.createBufferSource();
      node.buffer = abuf;
      node.connect(this.analyser);

      const now = this.ctx.currentTime;
      const startAt = Math.max(now, this.nextStart);
      node.start(startAt);
      this.nextStart = startAt + abuf.duration;
      this.nodes.push(node);

      this.onPlaybackStart?.();
      this.startCompletionWatch();
    } catch (err) {
      console.warn('[audio-queue] Error enqueueing PCM chunk:', err);
    }
  }

  private startCompletionWatch() {
    if (this.checkInterval) return;
    this.checkInterval = setInterval(() => {
      if (!this.ctx) return;
      if (this.ctx.currentTime >= this.nextStart && this.nodes.length > 0) {
        clearInterval(this.checkInterval!);
        this.checkInterval = null;
        this.cleanupNodes();
        this.onPlaybackComplete?.();
      }
    }, 100);
  }

  private cleanupNodes() {
    this.nodes.forEach((n) => {
      try {
        n.stop();
        n.disconnect();
      } catch {}
    });
    this.nodes = [];
  }

  stop(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
    this.cleanupNodes();
    this.carry = new Uint8Array(0);
    this.nextStart = 0;
  }

  get isPlaying(): boolean {
    if (!this.ctx) return false;
    return this.ctx.currentTime < this.nextStart;
  }

  getByteFrequencyData(array: Uint8Array): void {
    if (this.analyser) {
      this.analyser.getByteFrequencyData(array as unknown as Uint8Array<ArrayBuffer>);
    } else {
      array.fill(0);
    }
  }

  getVolume(): number {
    if (!this.analyser || !this.isPlaying) return 0;
    try {
      const data = new Uint8Array(this.analyser.frequencyBinCount);
      this.analyser.getByteFrequencyData(data as unknown as Uint8Array<ArrayBuffer>);
      let sum = 0;
      for (let i = 0; i < data.length; i++) {
        sum += data[i];
      }
      return sum / (data.length * 255);
    } catch {
      return 0;
    }
  }

  // Get full accumulated audio as a replayable Blob URL
  getRecordedAudioBlobUrl(): string | undefined {
    if (this.totalRecordedSamples === 0 || this.recordedFloatChunks.length === 0) return undefined;
    try {
      const maxAllowed = 24000 * 30; // max 30s
      const finalCount = Math.min(this.totalRecordedSamples, maxAllowed);
      const merged = new Float32Array(finalCount);
      let offset = 0;
      for (const chunk of this.recordedFloatChunks) {
        if (offset >= finalCount) break;
        const copyLen = Math.min(chunk.length, finalCount - offset);
        merged.set(chunk.subarray(0, copyLen), offset);
        offset += copyLen;
      }
      const blob = encodeWav(merged, 24000);
      return URL.createObjectURL(blob);
    } catch (err) {
      console.warn('[audio-queue] getRecordedAudioBlobUrl failed:', err);
      return undefined;
    }
  }

  resetRecordedSamples() {
    this.recordedFloatChunks = [];
    this.totalRecordedSamples = 0;
  }
}
