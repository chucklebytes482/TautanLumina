import React, { useState } from 'react';
import { X, Copy, Check, KeyRound } from 'lucide-react';
import { FileSystemItem } from '../Types';
import { toast } from 'sonner';

interface Props {
  item: FileSystemItem;
  onClose: () => void;
}

export const PhraseViewModal: React.FC<Props> = ({ item, onClose }) => {
  const [copied, setCopied] = useState(false);

  const words = (item.content || '').trim().split(/\s+/).filter(Boolean);
  const displayTitle = item.name || words[0] || 'Pharse';

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(item.content || '');
      setCopied(true);
      toast.success('Pharse disalin');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Gagal menyalin');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-neutral-900 rounded-2xl max-w-lg w-full p-4 sm:p-6 shadow-2xl border border-[#e2ddd5] dark:border-neutral-800 relative flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-neutral-100 dark:border-neutral-800 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0 flex-1 pr-2">
            <div className="w-8 h-8 rounded-lg bg-[#fff0eb] dark:bg-[#FF4F00]/20 text-[#FF4F00] flex items-center justify-center shrink-0 border border-[#FF4F00]/20">
              <KeyRound size={16} />
            </div>

            <div className="min-w-0 flex-1">
              <h3 className="text-base font-bold text-neutral-900 dark:text-neutral-100 truncate" title={displayTitle}>
                {displayTitle}
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
