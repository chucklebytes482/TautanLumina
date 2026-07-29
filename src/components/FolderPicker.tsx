import { useEffect, useMemo, useState } from 'react';
import { X, ChevronRight, Home, ArrowLeft, Folder, FolderHeart, FolderCode } from 'lucide-react';
import { FileSystemItem } from '../Types';
import { useDialog } from '../context/DialogContext';
import { useI18n } from '../lib/i18n';

interface Props {
  items: FileSystemItem[];
  initialFolderId: string | null;
  title: string;
  confirmLabel: string;
  disabledIds?: Set<string>;
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
  onConfirm,
  onClose,
  onCreateFolder,
}: Props) => {
  const { t } = useI18n();
  const [current, setCurrent] = useState<string | null>(initialFolderId);
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
        .filter((i) => i.type === 'folder' && i.parentId === current)
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0)),
    [items, current],
  );

  const breadcrumbs = useMemo(() => {
    const arr: FileSystemItem[] = [];
    let cur = items.find((i) => i.id === current);
    while (cur) {
      arr.unshift(cur);
      cur = items.find((i) => i.id === cur!.parentId);
    }
    return arr;
  }, [items, current]);

  const currentFolder = items.find((i) => i.id === current);

  const handleCreate = async () => {
    if (!onCreateFolder) return;
    const name = await customPrompt(t('modal.folderName'));
    if (!name) return;
    const f = await onCreateFolder(name, current);
    setCurrent(f.id);
  };

  return (
    <div className="modal-root" data-testid="folder-picker">
      <div className="modal-panel border border-[#e2ddd5] rounded-2xl shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-2 p-3 border-b border-[#e2ddd5] bg-[#faf8f5]">
          {current !== null && (
            <button
              data-testid="picker-up-btn"
              onClick={() => setCurrent(currentFolder?.parentId ?? null)}
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
          <button
            data-testid="picker-crumb-root"
            onClick={() => setCurrent(null)}
            className="flex items-center gap-1 hover:text-[#FF4F00] font-medium transition-colors"
          >
            <Home size={12} className="text-[#FF4F00]" /> Root
          </button>
          {breadcrumbs.map((b) => (
            <span key={b.id} className="flex items-center gap-1">
              <ChevronRight size={12} className="text-neutral-400" />
              <button
                onClick={() => setCurrent(b.id)}
                className="hover:text-[#FF4F00] font-medium truncate max-w-[120px] transition-colors"
              >
                {b.name}
              </button>
            </span>
          ))}
        </div>

        <div className="modal-body p-2">
          {folders.length === 0 ? (
            <div className="py-8 text-center text-xs text-neutral-500 font-medium">{t('picker.empty')}</div>
          ) : (
            <ul className="space-y-1">
              {folders.map((f) => {
                const disabled = disabledIds?.has(f.id);
                return (
                  <li key={f.id}>
                    <button
                      data-testid={`picker-folder-${f.id}`}
                      disabled={disabled}
                      onClick={() => setCurrent(f.id)}
                      className={[
                        'w-full text-left px-3 py-2.5 text-sm flex items-center justify-between rounded-xl transition-all',
                        disabled ? 'text-neutral-300 cursor-not-allowed bg-neutral-50' : 'hover:bg-[#fff0eb] hover:text-[#FF4F00] text-neutral-800 font-medium',
                      ].join(' ')}
                    >
                      <div className="flex items-center gap-2 truncate">
                        {f.id === 'folder-catatan' ? (
                          <FolderHeart size={16} className="shrink-0 text-[#FF4F00]" strokeWidth={2} />
                        ) : f.id === 'folder-hello-world' ? (
                          <FolderCode size={16} className="shrink-0 text-[#FF4F00]" strokeWidth={2} />
                        ) : (
                          <Folder size={16} className="shrink-0 text-[#FF4F00]" strokeWidth={2} />
                        )}
                        <span className="truncate">{f.name}</span>
                      </div>
                      <ChevronRight size={14} className="text-neutral-400" />
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="flex items-center gap-2 p-3 border-t border-[#e2ddd5] bg-[#faf8f5]">
          {onCreateFolder && (
            <button
              data-testid="picker-new-folder-btn"
              onClick={handleCreate}
              className="px-3 py-1.5 text-xs font-semibold border border-[#e2ddd5] bg-white rounded-xl hover:bg-[#fff0eb] hover:border-[#FF4F00]/40 text-neutral-800 transition-colors"
            >
              + Folder
            </button>
          )}
          <div className="flex-1" />
          <button
            data-testid="picker-cancel-btn"
            onClick={onClose}
            className="px-3.5 py-1.5 text-xs font-semibold border border-[#e2ddd5] bg-white rounded-xl hover:bg-neutral-50 text-neutral-700 transition-colors"
          >
            {t('modal.cancel')}
          </button>
          <button
            data-testid="picker-confirm-btn"
            onClick={() => onConfirm(current)}
            className="px-4 py-1.5 text-xs font-semibold bg-[#FF4F00] hover:bg-[#E04500] text-white rounded-xl shadow-xs transition-colors"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
