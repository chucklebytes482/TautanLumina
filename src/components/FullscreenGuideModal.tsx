import React from 'react';
import { X, BookOpen } from 'lucide-react';
import { GuideTabContent } from './GuideTabContent';
import { useI18n } from '../lib/i18n';

interface FullscreenGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FullscreenGuideModal: React.FC<FullscreenGuideModalProps> = ({ isOpen, onClose }) => {
  const { t } = useI18n();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#faf8f5] dark:bg-[#161618] bg-doodle text-neutral-900 dark:text-neutral-100 animate-in fade-in duration-200">
      {/* Compact Top Header */}
      <div className="p-2.5 bg-[#f2eee9] dark:bg-[#1e1e22] border-b border-[#e2ddd5] dark:border-[#2d2d35] shrink-0 flex items-center justify-between">
        <div className="flex items-center gap-2.5 px-2">
          <div className="p-1.5 bg-[#FF4F00] text-white rounded-lg shadow-2xs">
            <BookOpen size={18} />
          </div>
          <div>
            <h1 className="text-sm font-bold text-neutral-900 dark:text-neutral-100 leading-tight">
              {t('guide.title') || 'Panduan Penggunaan'}
            </h1>
            <p className="text-[11px] text-neutral-500 dark:text-neutral-400 hidden sm:block">
              Panduan fitur & cara penggunaan TautanLumina
            </p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="p-1.5 text-neutral-500 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-neutral-100 hover:bg-neutral-200/60 dark:hover:bg-neutral-800 rounded-lg transition-colors cursor-pointer"
          title="Tutup"
          aria-label="Tutup"
        >
          <X size={20} />
        </button>
      </div>

      {/* Body Content with Guide Tab Content */}
      <div className="flex-1 overflow-hidden flex flex-col">
        <GuideTabContent />
      </div>
    </div>
  );
};
