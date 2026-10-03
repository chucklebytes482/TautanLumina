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

export const getBookmarkDisplayTitle = (name?: string, content?: string): string => {
  const cleanName = cleanText(name);
  const cleanUrl = cleanText(content);

  if (cleanName && cleanName.toLowerCase() !== 'bookmark') {
    return cleanName;
  }

  if (cleanUrl) {
    const fullUrl = cleanUrl.startsWith('http') ? cleanUrl : `https://${cleanUrl}`;
    const extracted = extractTitleFromUrl(fullUrl);
    if (extracted && extracted.toLowerCase() !== 'bookmark' && extracted.length > 0) {
      return extracted;
    }
    // Fallback: Display FULL URL address
    return fullUrl;
  }

  return cleanName || 'Bookmark';
};
