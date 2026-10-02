export const extractTitleFromUrl = (url: string): string => {
  if (!url) return 'Bookmark';
  let clean = url.trim();
  // Remove protocol / prefix including http://, https://, http/, https/
  clean = clean.replace(/^https?:\/*\/*/i, '');
  // Exclude slashes / and dots .
  clean = clean.replace(/[\/\.]/g, '');
  return clean || 'Bookmark';
};
