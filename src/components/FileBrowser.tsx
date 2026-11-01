import { useState, useRef, useEffect } from 'react';
import { MoreVertical, Folder, Pin, Lock, FileText, ClipboardList, StickyNote, Copy, KeyRound, Check } from 'lucide-react';
import { FileSystemItem } from '../Types';
import { useI18n } from '../lib/i18n';
import { usePinState } from '../lib/pin';
import { cleanText, extractTitleFromUrl, getBookmarkDisplayTitle, formatCleanUrl } from '../lib/titleExtractor';

interface Props {
  items: FileSystemItem[];
  selectMode: boolean;
  selectedIds: Set<string>;
  onToggleSelect: (id: string) => void;
  onOpenFolder: (id: string) => void;
  onOpenPhrase?: (item: FileSystemItem) => void;
  onMenu: (item: FileSystemItem, anchor: DOMRect) => void;
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
  if (items.length === 0) {
    if (searchMode && emptyLabel) {
      return (
        <div
          data-testid="empty-state"
          className="py-16 text-center text-sm text-neutral-500"
        >
          {emptyLabel}
        </div>
      );
    }
    return <div data-testid="empty-state" className="py-6" />;
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
  const [copied, setCopied] = useState(false);
  const copyTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (copyTimeoutRef.current) window.clearTimeout(copyTimeoutRef.current);
    };
  }, []);

  const handleClick = () => {
    if (selectMode) {
      if (item.id === 'folder-catatan' || item.id === 'folder-pharse' || item.id === 'folder-clipkey') {
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
      if (!textToCopy) return;
      navigator.clipboard.writeText(textToCopy)
        .then(() => {
          setCopied(true);
          if (copyTimeoutRef.current) window.clearTimeout(copyTimeoutRef.current);
          copyTimeoutRef.current = window.setTimeout(() => {
            setCopied(false);
          }, 1200);
        })
        .catch(() => {});
    } else {
       if (item.content?.startsWith('http')) {
         window.open(item.content, '_blank');
       } else {
         window.open(`https://${item.content}`, '_blank');
       }
    }
  };

  const renderItemLabel = () => {
    if (item.type === 'folder') return null;
    if (!item.label || !item.label.trim()) return null;
    const displayText = formatCleanUrl(item.label) || item.label.trim();
    return (
      <span className="inline-flex items-center text-[8px] font-bold leading-none px-1.5 py-[1.5px] rounded border border-neutral-700 text-neutral-800 bg-transparent dark:border-white dark:text-white dark:bg-white/5 mr-1.5 align-middle shrink-0 select-none tracking-wide pointer-events-none">
        {displayText}
      </span>
    );
  };

  return (
    <li
      data-testid={`item-row-${item.id}`}
      onClick={handleClick}
      className={[
        'flex items-center gap-1.5 px-2 py-2 border rounded-xl select-none no-select bg-white cursor-pointer transition-all hover:shadow-xs hover:border-[#ff4f00]/40',
        selected ? 'bg-[#fff0eb] border-[#ff4f00]' : 'border-[#e2ddd5]',
      ].join(' ')}
    >
      {/* Select Mode Checkbox */}
      {selectMode && item.id !== 'folder-catatan' && item.id !== 'folder-pharse' && item.id !== 'folder-clipkey' && (
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
      {selectMode && (item.id === 'folder-catatan' || item.id === 'folder-pharse' || item.id === 'folder-clipkey') && (
        <div className="w-4 h-4 shrink-0" />
      )}

      {/* Icon / Note Badge (bookmarks & phrase items have no icon) */}
      {(item.type === 'folder' || item.type === 'note') && (
        <div className={`shrink-0 w-6.5 h-6.5 flex items-center justify-center rounded-lg border overflow-hidden relative transition-colors ${
          copied ? 'bg-emerald-50 border-emerald-500/40 dark:bg-emerald-950/40 dark:border-emerald-500/50' : 'bg-[#faf8f5] border-[#e2ddd5]/60'
        }`}>
          {item.type === 'folder' ? (
            (item.id === 'folder-pharse' && pinActive && !unlockedFolderIds?.has('folder-pharse')) ||
            (item.locked && pinActive && !unlockedFolderIds?.has(item.id)) ? (
              <Lock size={14} className="text-[#ff4f00]" strokeWidth={2.2} />
            ) : (item.id === 'folder-clipkey' || item.id === 'folder-catatan') ? (
              <ClipboardList size={14} className="text-[#ff4f00]" strokeWidth={2.2} />
            ) : item.id === 'folder-pharse' ? (
              <KeyRound size={14} className="text-[#ff4f00]" strokeWidth={2.2} />
            ) : (
              <Folder size={14} className="text-[#ff4f00]" strokeWidth={2.2} />
            )
          ) : copied ? (
            <Check size={13} className="text-emerald-600 dark:text-emerald-400 animate-in fade-in" strokeWidth={2.5} />
          ) : (
            <span className="text-[11px] font-bold text-[#ff4f00] font-mono select-none">
              {noteNumber}
            </span>
          )}
        </div>
      )}

      {/* Info */}
      <div className="min-w-0 flex-1">
        {item.type === 'folder' ? (
          <div className="text-[11.5px] leading-snug font-medium text-neutral-800 dark:text-neutral-200 line-clamp-2 break-words" title={item.id === 'folder-clipkey' ? 'clipboard' : item.name}>
            {renderItemLabel()}
            {item.id === 'folder-clipkey' ? 'clipboard' : (cleanText(item.name) || t('file.folder'))}
          </div>
        ) : item.type === 'phrase' ? (
          <div className="text-[11.5px] leading-snug font-medium text-neutral-800 dark:text-neutral-200 line-clamp-2 break-words" title={item.name}>
            {renderItemLabel()}
            {/^https?:\/\//i.test(item.name || '') || /^www\./i.test(item.name || '') ? formatCleanUrl(item.name) : (cleanText(item.name) || 'Pharse')}
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
      {!selectMode && item.id !== 'folder-catatan' && item.id !== 'folder-pharse' && item.id !== 'folder-clipkey' && (
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
