export const extractTitleFromUrl = (url: string): string => {
  if (!url) return 'Bookmark';
  let clean = url.trim();

  // Decode URI components if URL encoded (e.g. %20 -> space)
  try {
    clean = decodeURIComponent(clean);
  } catch {}

  // Remove protocol prefix (http://, https://, http/, https/)
  clean = clean.replace(/^https?:\/*\/*/i, '');

  // Remove www. prefix if present at start
  clean = clean.replace(/^www\./i, '');

  // Replace URL delimiters (slashes, dots, hyphens, underscores, query params) with spaces
  clean = clean.replace(/[\/\.\-_?&=#+:]+/g, ' ');

  // Collapse multiple spaces into a single space and trim
  clean = clean.replace(/\s+/g, ' ').trim();

  if (!clean) return 'Bookmark';

  // Capitalize first letter of each word for a clean, human-readable title
  return clean
    .split(' ')
    .map((word) => (word.length > 0 ? word.charAt(0).toUpperCase() + word.slice(1) : ''))
    .join(' ');
};
