export function normalizeForTts(text: string): string {
  if (!text) return '';

  return text
    // Strip citation links like [1], [2] first
    .replace(/\[\d+\]/g, '')
    // Strip markdown formatting and symbols
    .replace(/[*_#`\[\]]/g, '')
    // Currency: ₹1,250 → "one thousand two hundred and fifty rupees"
    .replace(/₹\s*([\d,]+)/g, (_, n) => `${numberToWords(parseInt(n.replace(/,/g, ''), 10))} rupees`)
    .replace(/Rs\.?\s*([\d,]+)/gi, (_, n) => `${numberToWords(parseInt(n.replace(/,/g, ''), 10))} rupees`)
    // Units
    .replace(/(\d+)\s*kg\b/gi, (_, n) => `${numberToWords(+n)} kilos`)
    .replace(/(\d+)\s*g\b/gi, (_, n) => `${numberToWords(+n)} grams`)
    .replace(/(\d+)\s*[lL]\b/gi, (_, n) => `${numberToWords(+n)} liters`)
    // Percentages
    .replace(/(\d+)%/g, (_, n) => `${numberToWords(+n)} percent`)
    // Times: 6:30 PM → "six thirty PM"
    .replace(/(\d{1,2}):(\d{2})\s*(AM|PM)/gi, (_, h, m, ap) =>
      `${numberToWords(+h)}${m !== '00' ? ' ' + numberToWords(+m) : ''} ${ap.toUpperCase()}`)
    // Remaining numbers
    .replace(/\b(\d+)\b/g, (_, n) => numberToWords(+n))
    // Clean up multiple spaces
    .replace(/\s+/g, ' ')
    .trim();
}

export function numberToWords(n: number): string {
  if (isNaN(n)) return '';
  if (n === 0) return 'zero';

  const ones = [
    '', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine',
    'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen',
    'seventeen', 'eighteen', 'nineteen'
  ];
  const tens = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];

  if (n < 0) return 'minus ' + numberToWords(Math.abs(n));

  if (n < 20) return ones[n];

  if (n < 100) {
    const unit = n % 10;
    return tens[Math.floor(n / 10)] + (unit ? ' ' + ones[unit] : '');
  }

  if (n < 1000) {
    const rem = n % 100;
    return ones[Math.floor(n / 100)] + ' hundred' + (rem ? ' and ' + numberToWords(rem) : '');
  }

  if (n < 100000) {
    const thousands = Math.floor(n / 1000);
    const rem = n % 1000;
    return numberToWords(thousands) + ' thousand' + (rem ? ' ' + numberToWords(rem) : '');
  }

  if (n < 10000000) {
    const lakhs = Math.floor(n / 100000);
    const rem = n % 100000;
    return numberToWords(lakhs) + ' lakh' + (rem ? ' ' + numberToWords(rem) : '');
  }

  const crores = Math.floor(n / 10000000);
  const rem = n % 10000000;
  return numberToWords(crores) + ' crore' + (rem ? ' ' + numberToWords(rem) : '');
}
