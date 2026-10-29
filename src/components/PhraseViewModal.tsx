import React, { useState } from 'react';
import { X, Copy, Check } from 'lucide-react';
import { FileSystemItem } from '../Types';
import { extractUrlFromLabel, formatCleanUrl } from '../lib/titleExtractor';

interface Props {
  item: FileSystemItem;
  onClose: () => void;
}

export const PhraseViewModal: React.FC<Props> = ({ item, onClose }) => {
  const [copied, setCopied] = useState(false);

  const words = (item.content || '').trim().split(/\s+/).filter(Boolean);
  const rawTitle = item.name || words[0] || 'Pharse';
  const displayTitle = /^https?:\/\//i.test(rawTitle) || /^www\./i.test(rawTitle)
    ? formatCleanUrl(rawTitle)
    : rawTitle;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(item.content || '');
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // silent fallback
    }
  };

  const [labelCopied, setLabelCopied] = useState(false);

  const handleCopyLabel = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!item.label) return;
    const textToCopy = formatCleanUrl(item.label) || item.label.trim();
    try {
      await navigator.clipboard.writeText(textToCopy);
      setLabelCopied(true);
      setTimeout(() => setLabelCopied(false), 1500);
    } catch {
      // silent fallback
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-neutral-900 rounded-2xl max-w-lg w-full p-4 sm:p-6 shadow-2xl border border-[#e2ddd5] dark:border-neutral-800 relative flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-neutral-100 dark:border-neutral-800 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0 flex-1 pr-2">
            <div className="min-w-0 flex-1">
              <h3 className="text-base font-bold text-neutral-900 dark:text-neutral-100 truncate flex items-center" title={displayTitle}>
                {item.label && item.label.trim() && (() => {
                  const displayLabel = formatCleanUrl(item.label) || item.label.trim();
                  return (
                    <button
                      type="button"
                      onClick={handleCopyLabel}
                      title={`Klik untuk menyalin: ${displayLabel}`}
                      className="inline-flex items-center gap-1 text-[9px] font-bold leading-none px-1.5 py-[2.5px] rounded border border-neutral-700 text-neutral-900 bg-transparent dark:border-white dark:text-white dark:bg-white/10 mr-2 shrink-0 select-none tracking-wide hover:border-[#FF4F00] hover:text-[#FF4F00] active:scale-95 transition-all cursor-pointer"
                    >
                      <span>{displayLabel}</span>
                      {labelCopied && (
                        <Check size={11} className="shrink-0 text-emerald-600 dark:text-emerald-400 animate-in fade-in" />
                      )}
                    </button>
                  );
                })()}
                <span className="truncate">{displayTitle}</span>
              </h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 transition-colors cursor-pointer shrink-0"
            aria-label="Tutup"
          >
            <X size={18} />
          </button>
        </div>

        {/* Words Grid Container */}
        <div className="mt-4 flex-1 overflow-y-auto no-scrollbar py-1">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {words.map((word, index) => (
              <div
                key={index}
                className="flex items-center gap-2 px-2.5 py-2 bg-[#faf8f5] dark:bg-neutral-800/80 border border-[#e2ddd5] dark:border-neutral-700/80 rounded-xl hover:border-[#FF4F00]/30 transition-colors"
              >
                {/* Visual Number Badge */}
                <span className="text-[10px] font-mono font-bold text-neutral-400 dark:text-neutral-500 w-5 text-center select-none bg-neutral-200/60 dark:bg-neutral-700/60 py-0.5 rounded-md shrink-0">
                  {index + 1}
                </span>
                {/* Clean Lowercase Word */}
                <span className="font-mono text-[13px] font-medium text-neutral-800 dark:text-neutral-100 select-all tracking-wide truncate">
                  {word}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="mt-4 pt-3 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-end gap-2 shrink-0">
          <button
            onClick={onClose}
            className="px-3.5 py-2 rounded-xl text-xs font-medium border border-[#e2ddd5] dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
          >
            Tutup
          </button>
          <button
            onClick={handleCopy}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#FF4F00] hover:bg-[#E04500] text-white flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
          >
            {copied ? <Check size={14} /> : <Copy size={14} />}
            <span>{copied ? 'Tersalin' : 'Salin Semua'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
