import { useEffect, useRef, useState } from 'react';
import { MoreVertical, Folder, Pin, Trash2, Lock, FileText, FolderHeart, FolderCode, StickyNote, Copy, KeyRound } from 'lucide-react';
import { FileSystemItem } from '../Types';
import { useI18n } from '../lib/i18n';
import { toast } from 'sonner';
import { usePinState } from '../lib/pin';
import { cleanText, extractTitleFromUrl, getBookmarkDisplayTitle, extractUrlFromLabel } from '../lib/titleExtractor';

interface Props {
  items: FileSystemItem[];
  selectMode: boolean;
  selectedIds: Set<string>;
  onToggleSelect: (id: string) => void;
  onOpenFolder: (id: string) => void;
  onOpenPhrase?: (item: FileSystemItem) => void;
  onMenu: (item: FileSystemItem, anchor: DOMRect) => void;
  onDropOnFolder: (targetFolderId: string, draggedIds: string[]) => void;
  onReorder: (draggedIds: string[], overId: string, position: 'before' | 'after') => void;
  onPin: (id: string, pinned: boolean) => void;
  onDelete: (id: string) => void;
  emptyLabel?: string;
  searchMode?: boolean;
  pathOf?: (id: string | null) => string;
  currentFolderId?: string | null;
  unlockedFolderIds?: Set<string>;
}

export const FileBrowser = ({
  items,
  selectMode,
  selectedIds,
  onToggleSelect,
  onOpenFolder,
  onOpenPhrase,
  onMenu,
  onDropOnFolder,
  onReorder,
  onPin,
  onDelete,
  emptyLabel,
  searchMode = false,
  pathOf,
  currentFolderId,
  unlockedFolderIds,
}: Props) => {
  const { t } = useI18n();
  const pinActive = usePinState();
  const label = emptyLabel || t('empty.folder');
  if (items.length === 0) {
    return (
      <div
        data-testid="empty-state"
        className="py-16 text-center text-sm text-neutral-500"
      >
        {emptyLabel}
      </div>
    );
  }

  let noteCounter = 0;

  return (
    <ul data-testid="file-list" className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-1.5 p-1">
      {items.map((it, index) => {
        const isNote = it.type === 'note';
        if (isNote) {
          noteCounter += 1;
        }
        return (
          <Row
            key={it.id}
            item={it}
            selected={selectedIds.has(it.id)}
            selectMode={selectMode}
            onToggleSelect={() => onToggleSelect(it.id)}
            onOpenFolder={() => onOpenFolder(it.id)}
            onMenu={(rect) => onMenu(it, rect)}
            onDropOnFolder={(dragged) => onDropOnFolder(it.id, dragged)}
            onReorder={(dragged, pos) => onReorder(dragged, it.id, pos)}
            onPin={(pinned) => onPin(it.id, pinned)}
            onDelete={() => onDelete(it.id)}
            allSelectedIds={selectedIds}
            searchMode={searchMode}
            pathLabel={searchMode && pathOf ? pathOf(it.parentId) : undefined}
            currentFolderId={currentFolderId}
            noteNumber={isNote ? noteCounter : undefined}
            onOpenPhrase={onOpenPhrase}
            unlockedFolderIds={unlockedFolderIds}
          />
        );
      })}
    </ul>
  );
};

interface RowProps {
  item: FileSystemItem;
  selected: boolean;
  selectMode: boolean;
  allSelectedIds: Set<string>;
  onToggleSelect: () => void;
  onOpenFolder: () => void;
  onOpenPhrase?: (item: FileSystemItem) => void;
  onMenu: (rect: DOMRect) => void;
  onDropOnFolder: (draggedIds: string[]) => void;
  onReorder: (draggedIds: string[], position: 'before' | 'after') => void;
  onPin: (pinned: boolean) => void;
  onDelete: () => void;
  searchMode: boolean;
  pathLabel?: string;
  currentFolderId?: string | null;
  noteNumber?: number;
  unlockedFolderIds?: Set<string>;
}

const Row = ({
  item,
  selected,
  selectMode,
  allSelectedIds,
  onToggleSelect,
  onOpenFolder,
  onOpenPhrase,
  onMenu,
  onDropOnFolder,
  onReorder,
  onPin,
  onDelete,
  searchMode,
  pathLabel,
  currentFolderId,
  noteNumber,
  unlockedFolderIds,
}: RowProps) => {
  const { t } = useI18n();
  const pinActive = usePinState();
  const [dropZone, setDropZone] = useState<'over' | 'left' | 'right' | null>(null);
  const rowRef = useRef<HTMLLIElement>(null);

  const handleClick = () => {
    if (selectMode) {
      if (item.id === 'folder-catatan' || item.id === 'folder-hello-world' || item.id === 'folder-pharse') {
        return;
      }
      onToggleSelect();
      return;
    }
    if (item.type === 'folder') onOpenFolder();
    else if (item.type === 'phrase') {
      onOpenPhrase?.(item);
    }
    else if (item.type === 'note') {
      const textToCopy = item.content || item.name || '';
      navigator.clipboard.writeText(textToCopy)
        .then(() => {
          toast.success(t('toast.copied'));
        })
        .catch(() => {
          toast.error(t('toast.copyFailed'));
        });
    } else {
       if (item.content?.startsWith('http')) {
         window.open(item.content, '_blank');
       } else {
         window.open(`https://${item.content}`, '_blank');
       }
    }
  };

  const handleDragStart = (e: React.DragEvent) => {
    const ids = selected && allSelectedIds.size > 0 ? [...allSelectedIds] : [item.id];
    e.dataTransfer.setData('text/plain', JSON.stringify(ids));
    e.dataTransfer.effectAllowed = 'move';
  };

  const readIds = (e: React.DragEvent): string[] => {
    try {
      return JSON.parse(e.dataTransfer.getData('text/plain'));
    } catch {
      return [];
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    if (searchMode) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (!rowRef.current) return;
    const rect = rowRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    if (item.type === 'folder' && x > rect.width * 0.25 && x < rect.width * 0.75) {
      setDropZone('over');
    } else if (x < rect.width * 0.5) {
      setDropZone('left');
    } else {
      setDropZone('right');
    }
  };

  const handleDragLeave = () => setDropZone(null);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const ids = readIds(e);
    const zone = dropZone;
    setDropZone(null);
    if (!ids.length || ids.includes(item.id)) return;
    if (zone === 'over' && item.type === 'folder') onDropOnFolder(ids);
    else if (zone === 'left') onReorder(ids, 'before');
    else if (zone === 'right') onReorder(ids, 'after');
  };

  const isUrl = item.type === 'file' && item.content?.startsWith('http');
  let domain = '';
  if (isUrl) {
    try {
      domain = new URL(item.content!).hostname;
    } catch {}
  }

  const renderItemLabel = () => {
    if (item.type === 'folder') return null;
    if (!item.label || !item.label.trim()) return null;
    return (
      <span className="inline-flex items-center text-[8px] font-bold leading-none px-1.5 py-[1.5px] rounded border border-neutral-700 text-neutral-800 bg-transparent dark:border-white dark:text-white dark:bg-white/5 mr-1.5 align-middle shrink-0 select-none tracking-wide">
        {item.label.trim()}
      </span>
    );
  };

  return (
    <li
      ref={rowRef}
      data-testid={`item-row-${item.id}`}
      draggable={!searchMode}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={handleClick}
      className={[
        'flex items-center gap-1.5 px-2 py-2 border rounded-xl select-none no-select bg-white cursor-pointer transition-all hover:shadow-xs hover:border-[#ff4f00]/40',
        selected ? 'bg-[#fff0eb] border-[#ff4f00]' : 'border-[#e2ddd5]',
        dropZone === 'over' ? 'ring-2 ring-[#ff4f00]' : '',
        dropZone === 'left' ? 'border-l-4 border-l-[#ff4f00]' : '',
        dropZone === 'right' ? 'border-r-4 border-r-[#ff4f00]' : '',
      ].join(' ')}
    >
      {/* Select Mode Checkbox */}
      {selectMode && item.id !== 'folder-catatan' && item.id !== 'folder-hello-world' && item.id !== 'folder-pharse' && (
        <span
          className={[
            'inline-block w-4 h-4 rounded border shrink-0 transition-colors',
            selected ? 'bg-[#ff4f00] border-[#ff4f00]' : 'border-neutral-400 bg-white',
          ].join(' ')}
          aria-checked={selected}
          role="checkbox"
          onClick={(e) => {
             e.stopPropagation();
             onToggleSelect();
          }}
        />
      )}
      {selectMode && (item.id === 'folder-catatan' || item.id === 'folder-hello-world' || item.id === 'folder-pharse') && (
        <div className="w-4 h-4 shrink-0" />
      )}

      {/* Icon / Favicon / Note Badge */}
      <div className="shrink-0 w-6.5 h-6.5 flex items-center justify-center rounded-lg bg-[#faf8f5] border border-[#e2ddd5]/60 overflow-hidden relative">
        {item.type === 'folder' ? (
          (item.id === 'folder-pharse' && pinActive && !unlockedFolderIds?.has('folder-pharse')) ||
          (item.locked && pinActive && !unlockedFolderIds?.has(item.id)) ? (
            <Lock size={14} className="text-[#ff4f00]" strokeWidth={2.2} />
          ) : item.id === 'folder-catatan' ? (
            <FolderHeart size={14} className="text-[#ff4f00]" strokeWidth={2.2} />
          ) : item.id === 'folder-hello-world' ? (
            <FolderCode size={14} className="text-[#ff4f00]" strokeWidth={2.2} />
          ) : item.id === 'folder-pharse' ? (
            <KeyRound size={14} className="text-[#ff4f00]" strokeWidth={2.2} />
          ) : (
            <Folder size={14} className="text-[#ff4f00]" strokeWidth={2.2} />
          )
        ) : item.type === 'phrase' ? (
          <KeyRound size={14} className="text-[#ff4f00]" strokeWidth={2.2} />
        ) : item.type === 'note' ? (
          <span className="text-[11px] font-bold text-[#ff4f00] font-mono select-none">
            {noteNumber}
          </span>
        ) : isUrl && domain ? (
          <img src={`https://www.google.com/s2/favicons?domain=${domain}&sz=64`} alt="" className="w-3.5 h-3.5 object-contain" />
        ) : (
          <div className="w-3.5 h-3.5 bg-neutral-200 rounded-sm" />
        )}
      </div>

      {/* Info */}
      <div className="min-w-0 flex-1">
        {item.type === 'folder' ? (
          <div className="text-[11.5px] leading-snug font-medium text-neutral-800 dark:text-neutral-200 line-clamp-2 break-words" title={item.name}>
            {renderItemLabel()}
            {cleanText(item.name) || t('file.folder')}
          </div>
        ) : item.type === 'phrase' ? (
          <div className="text-[11.5px] leading-snug font-medium text-neutral-800 dark:text-neutral-200 line-clamp-2 break-words" title={item.name}>
            {renderItemLabel()}
            {cleanText(item.name) || 'Pharse'}
          </div>
        ) : item.type === 'note' ? (
          <div className="text-[11.5px] leading-snug font-medium text-neutral-800 dark:text-neutral-200 line-clamp-2 break-words" title={item.content || item.name}>
            {renderItemLabel()}
            {cleanText(item.content) || cleanText(item.name) || t('file.note')}
          </div>
        ) : (
          <div className="text-[11.5px] leading-snug font-medium text-neutral-800 dark:text-neutral-200 line-clamp-2 break-words" title={item.name || item.content}>
            {renderItemLabel()}
            {getBookmarkDisplayTitle(item.name, item.content)}
          </div>
        )}
      </div>

      {/* Menu Button */}
      {!selectMode && item.id !== 'folder-catatan' && item.id !== 'folder-hello-world' && item.id !== 'folder-pharse' && (
        <div className="flex items-center shrink-0">
          <button
            data-testid={`item-menu-${item.id}`}
            data-no-press="1"
            onClick={(e) => {
              e.stopPropagation();
              const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
              onMenu(rect);
            }}
            className="p-1.5 -mr-1 rounded-lg text-neutral-400 hover:text-neutral-700 active:text-neutral-900 hover:bg-neutral-100 active:bg-neutral-200 transition-colors touch-manipulation min-w-[28px] min-h-[28px] flex items-center justify-center"
            title={t('file.menu')}
          >
            <MoreVertical size={18} />
          </button>
        </div>
      )}
    </li>
  );
};
