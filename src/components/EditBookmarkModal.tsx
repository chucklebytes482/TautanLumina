import React, { useState, useEffect } from 'react';
import { X, Globe, Type, Bookmark } from 'lucide-react';
import { FileSystemItem } from '../Types';
import { useI18n } from '../lib/i18n';

interface EditBookmarkModalProps {
  item: FileSystemItem | null;
  onClose: () => void;
  onSave: (id: string, name: string, url: string) => Promise<void>;
}

export const EditBookmarkModal: React.FC<EditBookmarkModalProps> = ({
  item,
  onClose,
  onSave,
}) => {
  const { t } = useI18n();
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (item) {
      setName(item.name || '');
      setUrl(item.content || '');
    }
  }, [item]);

  if (!item) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSaving) return;

    const trimmedName = name.trim();
    let trimmedUrl = url.trim();

    if (trimmedUrl && !trimmedUrl.startsWith('http://') && !trimmedUrl.startsWith('https://')) {
      trimmedUrl = `https://${trimmedUrl}`;
    }

    setIsSaving(true);
    try {
      await onSave(item.id, trimmedName || 'Bookmark', trimmedUrl);
      onClose();
    } catch (err) {
      console.error('Failed to update bookmark:', err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="modal-root" onClick={onClose} data-testid="edit-bookmark-modal">
      <div
        className="modal-panel border border-[#e2ddd5] rounded-2xl shadow-2xl overflow-hidden bg-white w-full max-w-md mx-4 animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-[#e2ddd5] bg-[#faf8f5]">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-[#FF4F00]/10 text-[#FF4F00] rounded-lg">
              <Bookmark size={18} />
            </div>
            <h3 className="text-base font-bold text-[#131313]">
              {t('action.editTitle') || 'Edit Judul & URL'}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 hover:bg-white rounded-lg transition-colors text-neutral-500 hover:text-neutral-900 border border-transparent hover:border-[#e2ddd5]"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Field 1: Judul */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-neutral-700 flex items-center gap-1.5">
              <Type size={14} className="text-[#FF4F00]" />
              {t('modal.newName') || 'Judul'}
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('modal.newName') || 'Judul Bookmark'}
              className="w-full border border-[#e2ddd5] bg-[#faf8f5]/60 rounded-xl px-3.5 py-2.5 text-sm text-[#131313] focus:outline-none focus:border-[#FF4F00] focus:ring-2 focus:ring-[#FF4F00]/20 focus:bg-white transition-all font-medium"
              autoFocus
            />
          </div>

          {/* Field 2: URL */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-neutral-700 flex items-center gap-1.5">
              <Globe size={14} className="text-[#FF4F00]" />
              {t('modal.newUrl') || 'URL'}
            </label>
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com"
              className="w-full border border-[#e2ddd5] bg-[#faf8f5]/60 rounded-xl px-3.5 py-2.5 text-sm text-[#131313] focus:outline-none focus:border-[#FF4F00] focus:ring-2 focus:ring-[#FF4F00]/20 focus:bg-white transition-all font-mono text-xs"
            />
          </div>

          <div className="pt-2 flex justify-end gap-2.5 border-t border-[#e2ddd5]/60">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="px-4 py-2 text-xs font-semibold border border-[#e2ddd5] rounded-xl text-neutral-700 hover:bg-neutral-50 transition-colors disabled:opacity-50"
            >
              {t('modal.cancel') || 'Batal'}
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2 text-xs font-semibold bg-[#FF4F00] text-white rounded-xl hover:bg-[#E04500] shadow-xs transition-colors disabled:opacity-50 flex items-center gap-1.5"
            >
              {t('modal.done') || 'Simpan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
