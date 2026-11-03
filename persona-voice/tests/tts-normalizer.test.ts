import { describe, it, expect } from 'vitest';
import { normalizeForTts, numberToWords } from '@/lib/tts-normalizer';

describe('numberToWords', () => {
  it('converts small numbers correctly', () => {
    expect(numberToWords(0)).toBe('zero');
    expect(numberToWords(5)).toBe('five');
    expect(numberToWords(15)).toBe('fifteen');
    expect(numberToWords(42)).toBe('forty two');
  });

  it('converts hundreds, thousands, and lakhs', () => {
    expect(numberToWords(100)).toBe('one hundred');
    expect(numberToWords(250)).toBe('two hundred and fifty');
    expect(numberToWords(5000)).toBe('five thousand');
    expect(numberToWords(100000)).toBe('one lakh');
  });
});

describe('normalizeForTts', () => {
  it('strips markdown formatting', () => {
    expect(normalizeForTts('**Bold** and *italic* [1]')).toBe('Bold and italic');
  });

  it('converts Indian rupee currency symbols to spoken words', () => {
    expect(normalizeForTts('Price is ₹450')).toBe('Price is four hundred and fifty rupees');
    expect(normalizeForTts('Total is Rs. 1000')).toBe('Total is one thousand rupees');
  });

  it('converts units to spoken words', () => {
    expect(normalizeForTts('Buy 5kg atta')).toBe('Buy five kilos atta');
    expect(normalizeForTts('Take 500g butter')).toBe('Take five hundred grams butter');
  });

  it('converts times to spoken words', () => {
    expect(normalizeForTts('Meeting at 6:30 PM')).toBe('Meeting at six thirty PM');
  });
});
