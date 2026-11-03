export class SentenceSplitter {
  private buf = '';
  private readonly terminators = /[.?!।\n]/;

  push(token: string): string[] {
    this.buf += token;
    const sentences: string[] = [];
    let idx: number;

    while ((idx = this.findTerminator()) !== -1) {
      const s = this.buf.slice(0, idx + 1).trim();
      if (s) sentences.push(s);
      this.buf = this.buf.slice(idx + 1);
    }
    return sentences;
  }

  flush(): string[] {
    const s = this.buf.trim();
    this.buf = '';
    return s ? [s] : [];
  }

  private findTerminator(): number {
    for (let i = 0; i < this.buf.length; i++) {
      if (this.terminators.test(this.buf[i])) {
        // Prevent splitting on decimal numbers like 3.14
        const prev = this.buf[i - 1];
        const next = this.buf[i + 1];
        if (this.buf[i] === '.' && prev && /\d/.test(prev) && next && /\d/.test(next)) {
          continue;
        }

        // Prevent splitting on common abbreviations (a.m., p.m., dr., mr., etc.)
        const prefix = this.buf.slice(0, i + 1).toLowerCase();
        if (/(?:\b(?:a\.m|p\.m|mr|mrs|ms|dr|vs|etc|e\.g|i\.e)|\b[a-z])\.$/i.test(prefix)) {
          continue;
        }

        return i;
      }
    }
    return -1;
  }
}
