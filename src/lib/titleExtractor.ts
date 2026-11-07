export const cleanText = (str?: string | null): string => {
  if (!str) return '';
  return str
    .replace(/[\u200B-\u200D\uFEFF\u00A0]/g, ' ')
    .replace(/[\x00-\x1F\x7F-\x9F]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
};

export const formatCleanUrl = (url?: string | null): string => {
  if (!url) return '';
  return url
    .trim()
    .replace(/^https?:\/\/(?:www\.)?/i, '')
    .replace(/^www\./i, '')
    .replace(/\/+$/, '');
};

export const compareAlphabetical = (a?: string | null, b?: string | null): number => {
  const strA = cleanText(a);
  const strB = cleanText(b);
  return strA.localeCompare(strB, undefined, { numeric: true, sensitivity: 'base' });
};
