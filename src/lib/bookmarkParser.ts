import { FileSystemItem } from '../Types';

const uid = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2) + Date.now().toString(36);

function decodeHTMLEntities(text: string): string {
  if (!text) return '';
  if (typeof document !== 'undefined') {
    const txt = document.createElement('textarea');
    txt.innerHTML = text;
    return txt.value;
  }
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ');
}

export function isNetscapeBookmarkHTML(content: string): boolean {
  if (!content) return false;
  const trimmed = content.trim().toLowerCase();
  if (trimmed.startsWith('{') || trimmed.startsWith('[')) return false;
  return (
    trimmed.includes('netscape-bookmark-file-1') ||
    trimmed.includes('<dl') ||
    (trimmed.includes('<h3') && trimmed.includes('<a')) ||
    (trimmed.includes('<dt') && trimmed.includes('<a'))
  );
}

export function parseNetscapeBookmarks(htmlContent: string): FileSystemItem[] {
  const items: FileSystemItem[] = [];

  // Regex to match DL open, DL close, H3 folder header, A bookmark link
  const tagRegex = /(?:<DL\b[^>]*>)|(?:<\/DL>)|(?:<H3\b([^>]*)>(.*?)(?:<\/H3>|(?=<DL|<DT|<A|<\/DL|$)))|(?:<A\b([^>]*)>(.*?)(?:<\/A>|(?=<DT|<H3|<A|<\/DL|$)))/gis;

  const folderStack: Array<{ id: string | null; order: number }> = [{ id: null, order: 0 }];
  let pendingFolder: { id: string; name: string; createdAt: number; parentId: string | null } | null = null;

  let match: RegExpExecArray | null;

  const flushPendingFolder = () => {
    if (pendingFolder) {
      const currentParent = folderStack[folderStack.length - 1];
      items.push({
        id: pendingFolder.id,
        parentId: pendingFolder.parentId,
        name: pendingFolder.name,
        type: 'folder',
        order: currentParent.order++,
        createdAt: pendingFolder.createdAt,
        updatedAt: Date.now(),
      });
      pendingFolder = null;
    }
  };

  while ((match = tagRegex.exec(htmlContent)) !== null) {
    if (match.index === tagRegex.lastIndex) {
      tagRegex.lastIndex++;
    }

    const fullMatch = match[0];
    const upperMatch = fullMatch.toUpperCase();

    if (upperMatch.startsWith('<DL')) {
      if (pendingFolder) {
        const folderId = pendingFolder.id;
        flushPendingFolder();
        folderStack.push({ id: folderId, order: 0 });
      } else {
        const currentParent = folderStack[folderStack.length - 1];
        folderStack.push({ id: currentParent.id, order: 0 });
      }
    } else if (upperMatch.startsWith('</DL')) {
      flushPendingFolder();
      if (folderStack.length > 1) {
        folderStack.pop();
      }
    } else if (upperMatch.startsWith('<H3')) {
      flushPendingFolder();
      const attrStr = match[1] || '';
      const titleRaw = match[2] || '';
      const cleanTitle = titleRaw.replace(/<[^>]*>/g, '').trim();
      const name = decodeHTMLEntities(cleanTitle) || 'Folder';

      const addDateMatch = attrStr.match(/add_date=["']?(\d+)["']?/i);
      const createdAt = addDateMatch ? parseInt(addDateMatch[1], 10) * 1000 : Date.now();

      const currentParent = folderStack[folderStack.length - 1];
      pendingFolder = {
        id: uid(),
        name,
        createdAt: isNaN(createdAt) || createdAt <= 0 ? Date.now() : createdAt,
        parentId: currentParent.id,
      };
    } else if (upperMatch.startsWith('<A')) {
      flushPendingFolder();
      const attrStr = match[3] || '';
      const titleRaw = match[4] || '';

      const hrefMatch = attrStr.match(/href=["']?([^"'\s>]+)["']?/i);
      const href = hrefMatch ? hrefMatch[1] : '';

      if (href) {
        const cleanTitle = titleRaw.replace(/<[^>]*>/g, '').trim();
        const linkTitle = decodeHTMLEntities(cleanTitle) || href;
        const addDateMatch = attrStr.match(/add_date=["']?(\d+)["']?/i);
        const createdAt = addDateMatch ? parseInt(addDateMatch[1], 10) * 1000 : Date.now();
        const currentParent = folderStack[folderStack.length - 1];

        items.push({
          id: uid(),
          parentId: currentParent.id,
          name: linkTitle,
          type: 'file',
          content: href,
          order: currentParent.order++,
          createdAt: isNaN(createdAt) || createdAt <= 0 ? Date.now() : createdAt,
          updatedAt: Date.now(),
        });
      }
    }
  }

  flushPendingFolder();

  // Fallback if tagRegex yielded no items (e.g. simple link list or malformed HTML)
  if (items.length === 0 && typeof DOMParser !== 'undefined') {
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(htmlContent, 'text/html');
      const anchors = Array.from(doc.querySelectorAll('a'));
      anchors.forEach((a, idx) => {
        const href = a.getAttribute('href');
        if (href) {
          items.push({
            id: uid(),
            parentId: null,
            name: decodeHTMLEntities(a.textContent?.trim() || '') || href,
            type: 'file',
            content: href,
            order: idx,
            createdAt: Date.now(),
            updatedAt: Date.now(),
          });
        }
      });
    } catch (e) {
      console.error('DOMParser fallback error:', e);
    }
  }

  return items;
}
