export const cleanText = (str?: string | null): string => {
  if (!str) return '';
  return str
    .replace(/[\u200B-\u200D\uFEFF\u00A0]/g, ' ')
    .replace(/[\x00-\x1F\x7F-\x9F]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
};

export const extractTitleFromUrl = (url: string): string => {
  const cleanedUrl = cleanText(url);
  if (!cleanedUrl) return 'Bookmark';
  let clean = cleanedUrl;

  // Decode URI components if URL encoded (e.g. %20 -> space)
  try {
    clean = decodeURIComponent(clean);
  } catch {}

  clean = cleanText(clean);

  // Remove protocol prefix (http://, https://, http/, https/)
  clean = clean.replace(/^https?:\/*\/*/i, '');

  // Remove www. or www2. prefix if present
  clean = clean.replace(/^www\d*\./i, '');

  // Strip common URL path parameters or query strings like ?ref= or #anchor
  clean = clean.replace(/[?&#=]+/g, ' ');

  // Strip common file extensions and TLDs (.com, .org, .net, .co.id, .id, .html, .php, etc.)
  clean = clean.replace(/\.(com|org|net|co\.id|id|io|app|dev|xyz|site|online|tech|store|shop|me|tv|cc|gov|edu|biz|top|vip|live|asia|info|html|htm|php|aspx|jsp|json|xml|pdf|png|jpg|jpeg)\b/gi, ' ');

  // Insert space before camelCase transitions (e.g. "ReactRouter" -> "React Router")
  clean = clean.replace(/([a-z])([A-Z])/g, '$1 $2');

  // Insert space between letter and number transitions (e.g. "mini1221best" -> "mini 1221 best")
  clean = clean
    .replace(/([a-zA-Z])(\d+)/g, '$1 $2')
    .replace(/(\d+)([a-zA-Z])/g, '$1 $2');

  // Replace URL delimiters (slashes, dots, hyphens, underscores, colons) with spaces
  clean = clean.replace(/[/._+:\-]+/g, ' ');

  // Collapse multiple spaces into a single space and trim
  clean = cleanText(clean);

  if (!clean) return 'Bookmark';

  // Filter out standalone 'www' and apply Title Case
  const words = clean
    .split(' ')
    .filter((word) => word.length > 0 && word.toLowerCase() !== 'www')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1));

  const result = words.join(' ');
  return cleanText(result) || 'Bookmark';
};

export const formatCleanUrl = (url?: string | null): string => {
  if (!url) return '';
  return url
    .trim()
    .replace(/^https?:\/\/(?:www\.)?/i, '')
    .replace(/^www\./i, '')
    .replace(/\/+$/, '');
};

export const getBookmarkDisplayTitle = (name?: string, content?: string): string => {
  const cleanName = cleanText(name);
  const cleanUrl = cleanText(content);

  // If user explicitly provided a title (and it's not generic 'Bookmark')
  if (cleanName && cleanName.toLowerCase() !== 'bookmark') {
    if (/^https?:\/\//i.test(cleanName) || /^www\./i.test(cleanName)) {
      return formatCleanUrl(cleanName);
    }
    return cleanName;
  }

  // If name is empty, display the cleaned URL
  if (cleanUrl) {
    return formatCleanUrl(cleanUrl);
  }

  return cleanName || 'Bookmark';
};

export const extractUrlFromLabel = (label?: string | null): string | null => {
  if (!label) return null;
  const trimmed = cleanText(label);
  if (!trimmed) return null;

  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }
  if (/^www\./i.test(trimmed)) {
    return `https://${trimmed}`;
  }
  if (/^[a-zA-Z0-9-]+\.[a-zA-Z]{2,}(\/.*)?$/i.test(trimmed)) {
    return `https://${trimmed}`;
  }
  const match = trimmed.match(/https?:\/\/[^\s]+|www\.[^\s]+/i);
  if (match) {
    const url = match[0];
    return url.startsWith('http') ? url : `https://${url}`;
  }
  return null;
};

const QWERTY_ORDER = 'qwertyuiopasdfghjklzxcvbnm';

const getCharRank = (ch: string): number => {
  const lower = ch.toLowerCase();
  const qIdx = QWERTY_ORDER.indexOf(lower);
  if (qIdx !== -1) {
    return 100 + qIdx; // letters in QWERTY keyboard order: 100..125
  }
  // Digits 0-9
  if (lower >= '0' && lower <= '9') {
    return 50 + (lower.charCodeAt(0) - 48); // digits 50..59
  }
  // All other characters (symbols, punctuation)
  return lower.charCodeAt(0);
};

export const compareQwerty = (a?: string | null, b?: string | null): number => {
  const strA = cleanText(a);
  const strB = cleanText(b);
  const len = Math.min(strA.length, strB.length);

  for (let i = 0; i < len; i++) {
    const rankA = getCharRank(strA[i]);
    const rankB = getCharRank(strB[i]);
    if (rankA !== rankB) {
      return rankA - rankB;
    }
  }

  if (strA.length !== strB.length) {
    return strA.length - strB.length;
  }

  return strA.localeCompare(strB);
};
