import { useEffect, useMemo, useState } from 'react';
import { X, ChevronRight, Home, ArrowLeft, Folder, NotebookPen, KeyRound } from 'lucide-react';
import { FileSystemItem } from '../Types';
import { useDialog } from '../context/DialogContext';
import { useI18n } from '../lib/i18n';

interface Props {
  items: FileSystemItem[];
  initialFolderId: string | null;
  title: string;
  confirmLabel: string;
  disabledIds?: Set<string>;
  hiddenFolderIds?: Set<string>;
  restrictedRootFolderId?: string;
  onConfirm: (folderId: string | null) => void;
  onClose: () => void;
  onCreateFolder?: (name: string, parentId: string | null) => Promise<FileSystemItem>;
}

export const FolderPicker = ({
  items,
  initialFolderId,
  title,
  confirmLabel,
  disabledIds,
  hiddenFolderIds,
  restrictedRootFolderId,
  onConfirm,
  onClose,
  onCreateFolder,
}: Props) => {
  const { t } = useI18n();
  const [current, setCurrent] = useState<string | null>(() => {
    if (restrictedRootFolderId) return restrictedRootFolderId;
    return null;
  });
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(() => {
    if (restrictedRootFolderId) return restrictedRootFolderId;
    return initialFolderId;
  });
  const { prompt: customPrompt } = useDialog();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const folders = useMemo(
    () =>
      items
        .filter((i) => i.type === 'folder' && i.parentId === current && !hiddenFolderIds?.has(i.id))
        .sort((a, b) => {
          if (current === null) {
            const sysRank = (id: string) => {
              if (id === 'folder-catatan') return 1;
              if (id === 'folder-pharse') return 2;
              return 999;
            };
            const rA = sysRank(a.id);
            const rB = sysRank(b.id);
            if (rA !== rB) return rA - rB;
          }
          return (a.order ?? 0) - (b.order ?? 0);
        }),
    [items, current, hiddenFolderIds],
  );

  const breadcrumbs = useMemo(() => {
    const arr: FileSystemItem[] = [];
    let cur = items.find((i) => i.id === current);
    while (cur) {
      if (restrictedRootFolderId && cur.id === restrictedRootFolderId) break;
      arr.unshift(cur);
      cur = items.find((i) => i.id === cur!.parentId);
    }
    return arr;
  }, [items, current, restrictedRootFolderId]);

  const currentFolder = items.find((i) => i.id === current);
  const selectedFolder = items.find((i) => i.id === selectedFolderId);

  const handleCreate = async () => {
    if (!onCreateFolder) return;
    const name = await customPrompt(t('modal.folderName'));
    if (!name || !name.trim()) return;
    const f = await onCreateFolder(name.trim(), current);
    setSelectedFolderId(f.id);
  };

  return (
    <div className="modal-root" data-testid="folder-picker">
      <div className="modal-panel border border-[#e2ddd5] rounded-2xl shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-2 p-3 border-b border-[#e2ddd5] bg-[#faf8f5]">
          {current !== null && current !== restrictedRootFolderId && (
            <button
              data-testid="picker-up-btn"
              onClick={() => {
                const nextParent = currentFolder?.parentId ?? (restrictedRootFolderId || null);
                setCurrent(nextParent);
                setSelectedFolderId(nextParent);
              }}
              className="p-1.5 hover:bg-white rounded-lg transition-colors border border-transparent hover:border-[#e2ddd5]"
              aria-label={t('picker.up')}
            >
              <ArrowLeft size={18} className="text-[#131313]" />
            </button>
          )}
          <div className="flex-1 min-w-0 text-sm font-semibold text-[#131313] truncate">{title}</div>
          <button data-testid="picker-close-btn" onClick={onClose} className="p-1.5 hover:bg-white rounded-lg transition-colors text-neutral-500 hover:text-neutral-900 border border-transparent hover:border-[#e2ddd5]">
            <X size={16} />
          </button>
        </div>

        <div className="px-3 py-2 text-xs text-neutral-600 flex items-center gap-1 overflow-x-auto no-scrollbar border-b border-[#e2ddd5]/60 bg-[#faf8f5]/50">
          {restrictedRootFolderId ? (
            <button
              data-testid="picker-crumb-root"
              onClick={() => {
                setCurrent(restrictedRootFolderId);
                setSelectedFolderId(restrictedRootFolderId);
              }}
              className="flex items-center gap-1 hover:text-[#FF4F00] font-medium transition-colors"
            >
              {restrictedRootFolderId === 'folder-pharse' ? (
                <KeyRound size={12} className="text-[#FF4F00]" />
              ) : restrictedRootFolderId === 'folder-catatan' ? (
                <NotebookPen size={12} className="text-[#FF4F00]" />
              ) : (
                <Folder size={12} className="text-[#FF4F00]" />
              )}
              {items.find((i) => i.id === restrictedRootFolderId)?.name || (restrictedRootFolderId === 'folder-catatan' ? 'Catatan' : 'Pharse')}
            </button>
          ) : (
            <button
              data-testid="picker-crumb-root"
              onClick={() => {
                setCurrent(null);
                setSelectedFolderId(null);
              }}
              className="flex items-center gap-1 hover:text-[#FF4F00] font-medium transition-colors"
            >
              <Home size={12} className="text-[#FF4F00]" /> Root
            </button>
          )}
          {breadcrumbs.map((b) => (
            <span key={b.id} className="flex items-center gap-1">
              <ChevronRight size={12} className="text-neutral-400" />
              <button
                onClick={() => {
                  setCurrent(b.id);
                  setSelectedFolderId(b.id);
                }}
                className="hover:text-[#FF4F00] font-medium truncate max-w-[120px] transition-colors"
              >
                {b.name}
              </button>
            </span>
          ))}
        </div>

        <div className="modal-body p-2 max-h-[60vh] overflow-y-auto">
          <ul className="space-y-1">
            {current === null && !restrictedRootFolderId && (
              <li>
                <button
                  type="button"
                  data-testid="picker-folder-root"
                  onClick={() => setSelectedFolderId(null)}
                  className={[
                    'w-full text-left px-3 py-2.5 text-sm flex items-center justify-between rounded-xl transition-all border',
                    selectedFolderId === null
                      ? 'bg-[#fff0eb] text-[#FF4F00] border-[#FF4F00]/40 font-semibold'
                      : 'border-transparent hover:bg-[#fff0eb] hover:text-[#FF4F00] text-neutral-800 font-medium',
                  ].join(' ')}
                >
                  <div className="flex items-center gap-2 truncate">
                    <Home size={16} className="shrink-0 text-[#FF4F00]" strokeWidth={2} />
                    <span className="truncate">Root (Halaman Utama)</span>
                  </div>
                </button>
              </li>
            )}

            {folders.length === 0 && current !== null ? (
              <li className="py-8 text-center text-xs text-neutral-500 font-medium">{t('picker.empty')}</li>
            ) : (
              folders.map((f) => {
                const disabled = disabledIds?.has(f.id);
                const isSelected = selectedFolderId === f.id;
                const subfolderCount = items.filter((i) => i.type === 'folder' && i.parentId === f.id).length;

                return (
                  <li key={f.id} className="flex items-center gap-1">
                    <button
                      type="button"
                      data-testid={`picker-folder-${f.id}`}
                      disabled={disabled}
                      onClick={() => {
                        setSelectedFolderId(f.id);
                        if (subfolderCount > 0 && isSelected) {
                          setCurrent(f.id);
                        }
                      }}
                      className={[
                        'flex-1 min-w-0 text-left px-3 py-2.5 text-sm flex items-center justify-between rounded-xl transition-all border',
                        disabled
                          ? 'text-neutral-300 cursor-not-allowed bg-neutral-50 border-transparent'
                          : isSelected
                          ? 'bg-[#fff0eb] text-[#FF4F00] border-[#FF4F00]/40 font-semibold'
                          : 'border-transparent hover:bg-[#fff0eb] hover:text-[#FF4F00] text-neutral-800 font-medium',
                      ].join(' ')}
                    >
                      <div className="flex items-center gap-2 truncate">
                        {f.id === 'folder-catatan' ? (
                          <NotebookPen size={16} className="shrink-0 text-[#FF4F00]" strokeWidth={2} />
                        ) : f.id === 'folder-pharse' ? (
                          <KeyRound size={16} className="shrink-0 text-[#FF4F00]" strokeWidth={2} />
                        ) : (
                          <Folder size={16} className="shrink-0 text-[#FF4F00]" strokeWidth={2} />
                        )}
                        <span className="truncate">{f.id === 'folder-catatan' ? 'Catatan' : f.name}</span>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {subfolderCount > 0 && !disabled && (
                          <span
                            onClick={(e) => {
                              e.stopPropagation();
                              setCurrent(f.id);
                              setSelectedFolderId(f.id);
                            }}
                            className="p-1 rounded-lg hover:bg-[#FF4F00]/15 text-neutral-500 hover:text-[#FF4F00] flex items-center gap-0.5 text-xs"
                            title="Buka subfolder"
                          >
                            <ChevronRight size={14} />
                          </span>
                        )}
                      </div>
                    </button>
                  </li>
                );
              })
            )}
          </ul>
        </div>

        <div className="flex items-center gap-2 p-3 border-t border-[#e2ddd5] bg-[#faf8f5]">
          {onCreateFolder && (
            <button
              type="button"
              data-testid="picker-new-folder-btn"
              onClick={handleCreate}
              className="px-3 py-1.5 text-xs font-semibold border border-[#e2ddd5] bg-white rounded-xl hover:bg-[#fff0eb] hover:border-[#FF4F00]/40 text-neutral-800 transition-colors cursor-pointer"
            >
              + Folder
            </button>
          )}
          <div className="flex-1" />
          <button
            type="button"
            data-testid="picker-cancel-btn"
            onClick={onClose}
            className="px-3.5 py-1.5 text-xs font-semibold border border-[#e2ddd5] bg-white rounded-xl hover:bg-neutral-50 text-neutral-700 transition-colors cursor-pointer"
          >
            {t('modal.cancel')}
          </button>
          <button
            type="button"
            data-testid="picker-confirm-btn"
            onClick={() => onConfirm(selectedFolderId)}
            className="px-4 py-1.5 text-xs font-semibold bg-[#FF4F00] hover:bg-[#E04500] text-white rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
