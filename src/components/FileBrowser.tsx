import { useState } from 'react';
import { MoreVertical, Folder, Lock, KeyRound } from 'lucide-react';
import { FileSystemItem } from '../Types';
import { useI18n } from '../lib/i18n';
import { usePinState } from '../lib/pin';
import { cleanText } from '../lib/titleExtractor';

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

  return (
    <ul data-testid="file-list" className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-1.5 p-1">
      {items.map((it) => (
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
          onOpenPhrase={onOpenPhrase}
          unlockedFolderIds={unlockedFolderIds}
        />
      ))}
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
  unlockedFolderIds,
}: RowProps) => {
  const { t } = useI18n();
  const pinActive = usePinState();
  const handleClick = () => {
    if (selectMode) {
      onToggleSelect();
      return;
    }
    if (item.type === 'folder') onOpenFolder();
    else if (item.type === 'phrase') {
      onOpenPhrase?.(item);
    }
  };

  return (
    <li
      data-testid={`item-row-${item.id}`}
      onClick={handleClick}
      className={[
        'relative overflow-hidden group flex items-center gap-1.5 px-2 py-2 border rounded-xl select-none no-select bg-white cursor-pointer transition-all hover:shadow-xs hover:border-[#ff4f00]/40',
        selected ? 'bg-[#fff0eb] border-[#ff4f00]' : 'border-[#e2ddd5]',
      ].join(' ')}
    >
      {/* Select Mode Checkbox */}
      {selectMode && (
        <span
          className={[
            'relative z-10 inline-block w-4 h-4 rounded border shrink-0 transition-colors',
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

      {/* Folder Icon (phrase items have no icon) */}
      {item.type === 'folder' && (
        <div className="shrink-0 w-6.5 h-6.5 flex items-center justify-center rounded-lg border overflow-hidden relative z-10 transition-colors bg-[#faf8f5] border-[#e2ddd5]/60">
          {item.locked && pinActive && !unlockedFolderIds?.has(item.id) ? (
            <Lock size={14} className="text-[#ff4f00]" strokeWidth={2.2} />
          ) : (
            <Folder size={14} className="text-[#ff4f00]" strokeWidth={2.2} />
          )}
        </div>
      )}

      {/* Info */}
      <div className="min-w-0 flex-1 relative z-10">
        {item.type === 'folder' ? (
          <div className="text-[11.5px] leading-snug font-medium text-neutral-800 dark:text-neutral-200 line-clamp-2 break-words" title={item.name}>
            {cleanText(item.name) || t('file.folder')}
          </div>
        ) : (
          <div className="text-[11.5px] leading-snug font-medium text-neutral-800 dark:text-neutral-200 line-clamp-2 break-words" title={item.label || item.name || 'Frasa'}>
            {(() => {
              const wallet = (item.label || item.name || '').trim();
              if (!wallet) return 'Frasa';
              return wallet.length > 4 ? wallet.slice(-4) : wallet;
            })()}
          </div>
        )}
      </div>

      {/* Menu Button */}
      {!selectMode && (
        <div className="flex items-center shrink-0 relative z-10">
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
