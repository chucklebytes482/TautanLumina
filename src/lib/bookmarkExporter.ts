import { FileSystemItem } from '../Types';

export function exportNetscapeBookmarks(items: FileSystemItem[]): string {
  const escapeHtml = (str: string) => {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  };

  let html = `<!DOCTYPE NETSCAPE-Bookmark-file-1>\n`;
  html += `<!-- This is an automatically generated file.\n`;
  html += `     It will be read and overwritten.\n`;
  html += `     DO NOT EDIT! -->\n`;
  html += `<META HTTP-EQUIV="Content-Type" CONTENT="text/html; charset=UTF-8">\n`;
  html += `<TITLE>Bookmarks</TITLE>\n`;
  html += `<H1>Bookmarks</H1>\n`;
  html += `<DL><p>\n`;

  // Build tree structure
  const folderMap = new Map<string | null, FileSystemItem[]>();
  items.forEach(it => {
    const pid = it.parentId || null;
    if (!folderMap.has(pid)) folderMap.set(pid, []);
    folderMap.get(pid)!.push(it);
  });

  const renderNode = (parentId: string | null, indent = '    ') => {
    const children = folderMap.get(parentId) || [];
    // Sort by order or createdAt
    children.sort((a, b) => (a.order ?? 0) - (b.order ?? 0) || (a.createdAt ?? 0) - (b.createdAt ?? 0));

    let str = '';
    children.forEach(item => {
      const addDate = Math.floor((item.createdAt || Date.now()) / 1000);
      if (item.type === 'folder') {
        str += `${indent}<DT><H3 ADD_DATE="${addDate}">${escapeHtml(item.name)}</H3>\n`;
        str += `${indent}<DL><p>\n`;
        str += renderNode(item.id, indent + '    ');
        str += `${indent}</DL><p>\n`;
      } else if (item.type === 'file') {
        const url = item.content || item.name || '';
        str += `${indent}<DT><A HREF="${escapeHtml(url)}" ADD_DATE="${addDate}">${escapeHtml(item.name)}</A>\n`;
      } else if (item.type === 'note') {
        const content = item.content || '';
        str += `${indent}<DT><A HREF="data:text/plain;charset=utf-8,${encodeURIComponent(content)}" ADD_DATE="${addDate}">${escapeHtml(item.name || 'Note')}</A>\n`;
      } else if (item.type === 'phrase') {
        const content = item.content || '';
        str += `${indent}<DT><A HREF="data:text/plain;charset=utf-8,${encodeURIComponent(content)}" ADD_DATE="${addDate}">[Phrase] ${escapeHtml(item.name || 'Phrase')}</A>\n`;
      }
    });
    return str;
  };

  html += renderNode(null, '    ');
  html += `</DL><p>\n`;
  return html;
}
