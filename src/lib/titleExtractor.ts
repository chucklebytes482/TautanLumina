export const extractTitleFromUrl = (url: string): string => {
  if (!url) return 'Bookmark';
  let clean = url.trim();

  // Decode URI components if URL encoded (e.g. %20 -> space)
  try {
    clean = decodeURIComponent(clean);
  } catch {}

  // Remove protocol prefix (http://, https://, http/, https/)
  clean = clean.replace(/^https?:\/*\/*/i, '');

  // Remove www. or www2. prefix if present
  clean = clean.replace(/^www\d*\./i, '');

  // Strip common URL path parameters or query strings like ?ref= or #anchor
  // But keep words inside query params if needed
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
  clean = clean.replace(/\s+/g, ' ').trim();

  if (!clean) return 'Bookmark';

  // Filter out standalone trailing 'www' or empty words and apply Title Case
  const words = clean
    .split(' ')
    .filter((word) => word.length > 0 && word.toLowerCase() !== 'www')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1));

  return words.join(' ') || 'Bookmark';
};
