export class AudioPlaybackQueue {
  private ctx: AudioContext | null = null;
  public analyser: AnalyserNode | null = null;
  private nextStart = 0;
  private nodes: AudioBufferSourceNode[] = [];
  private carry: Uint8Array = new Uint8Array(0); // odd-byte carry between chunks
  private checkInterval: NodeJS.Timeout | null = null;
  public onPlaybackComplete?: () => void;

  private initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
      this.analyser = this.ctx.createAnalyser();
      this.analyser.fftSize = 256;
      this.analyser.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  enqueuePcmChunk(b64: string, sampleRate = 24000): void {
    this.initContext();
    if (!this.ctx || !this.analyser) return;

    const raw = Uint8Array.from(atob(b64), c => c.charCodeAt(0));

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

    if (bytes.length === 0) return;

    const numSamples = bytes.length / 2;
    const abuf = this.ctx.createBuffer(1, numSamples, sampleRate);
    const channel = abuf.getChannelData(0);
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);

    for (let i = 0; i < numSamples; i++) {
      channel[i] = view.getInt16(i * 2, true) / 32768;
    }

    const node = this.ctx.createBufferSource();
    node.buffer = abuf;
    node.connect(this.analyser);

    const now = this.ctx.currentTime;
    const startAt = Math.max(now, this.nextStart);
    node.start(startAt);
    this.nextStart = startAt + abuf.duration;
    this.nodes.push(node);

    this.startCompletionWatch();
  }

  private startCompletionWatch() {
    if (this.checkInterval) return;
    this.checkInterval = setInterval(() => {
      if (!this.ctx) return;
      if (this.ctx.currentTime >= this.nextStart && this.nodes.length > 0) {
        clearInterval(this.checkInterval!);
        this.checkInterval = null;
        this.nodes = [];
        this.onPlaybackComplete?.();
      }
    }, 100);
  }

  stop(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
    this.nodes.forEach(n => {
      try {
        n.stop();
        n.disconnect();
      } catch {}
    });
    this.nodes = [];
    this.carry = new Uint8Array(0);
    this.nextStart = 0;
  }

  get isPlaying(): boolean {
    if (!this.ctx) return false;
    return this.ctx.currentTime < this.nextStart;
  }

  getByteFrequencyData(array: Uint8Array): void {
    if (this.analyser) {
      this.analyser.getByteFrequencyData(array as Uint8Array<ArrayBuffer>);
    } else {
      array.fill(0);
    }
  }
}
