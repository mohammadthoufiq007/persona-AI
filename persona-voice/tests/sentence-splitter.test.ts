import { describe, it, expect } from 'vitest';
import { SentenceSplitter } from '@/lib/sentence-splitter';

describe('SentenceSplitter', () => {
  it('splits streaming tokens into sentences', () => {
    const splitter = new SentenceSplitter();
    expect(splitter.push('Hello world! ')).toEqual(['Hello world!']);
    expect(splitter.push('This is ')).toEqual([]);
    expect(splitter.push('sentence two. And ')).toEqual(['This is sentence two.']);
    expect(splitter.flush()).toEqual(['And']);
  });

  it('does not split on decimal numbers or abbreviations', () => {
    const splitter = new SentenceSplitter();
    expect(splitter.push('The version is 3.14. ')).toEqual(['The version is 3.14.']);
    expect(splitter.push('The train arrives at 5:00 a.m. sharp. ')).toEqual(['The train arrives at 5:00 a.m. sharp.']);
  });
});
