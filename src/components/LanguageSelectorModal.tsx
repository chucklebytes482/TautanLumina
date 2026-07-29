import React, { useEffect, useRef } from 'react';
import { useI18n, languages, LanguageCode } from '../lib/i18n';

interface LanguageCardProps {
  currentLang: LanguageCode;
  onSelectLang: (code: LanguageCode) => void;
  className?: string;
}

export const LanguageCard: React.FC<LanguageCardProps> = ({ currentLang, onSelectLang, className = '' }) => {
  return (
    <div className={`bg-[#F1EFF4] dark:bg-[#1f1b29] rounded-[22px] p-2.5 shadow-2xl border border-neutral-200 dark:border-[#383147] w-[135px] select-none ${className}`}>
      <div className="flex flex-col space-y-0.5">
        {languages.map((l) => {
          const isSelected = currentLang === l.code;
          return (
            <button
              key={l.code}
              type="button"
              onClick={() => onSelectLang(l.code)}
              className="flex items-center justify-between w-full px-2.5 py-2 rounded-xl transition-colors hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer text-left group"
            >
              <div className="flex items-center gap-2">
                <span className="text-base leading-none">{l.flag}</span>
                <span className="font-extrabold text-[#1f1a2e] dark:text-neutral-100 text-xs tracking-wide">
                  {l.label}
                </span>
              </div>
              <div className="w-5 h-5 flex items-center justify-center shrink-0">
                {isSelected ? (
                  <svg className="w-5 h-5 text-[#352555] dark:text-[#a380e6]" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2.5" />
                    <circle cx="12" cy="12" r="4.5" fill="currentColor" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5 text-[#352555]/40 dark:text-neutral-500 group-hover:text-[#352555]" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2.5" />
                  </svg>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

interface DropdownWrapperProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  align?: 'right' | 'left' | 'center';
  className?: string;
}

export const LanguageDropdown: React.FC<DropdownWrapperProps> = ({
  isOpen,
  onClose,
  children,
  align = 'right',
  className = ''
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const alignmentClass =
    align === 'left' ? 'left-0' : align === 'center' ? 'left-1/2 -translate-x-1/2' : 'right-0';

  return (
    <div
      ref={containerRef}
      className={`absolute top-full mt-2.5 z-50 animate-in fade-in zoom-in-95 duration-150 ${alignmentClass} ${className}`}
    >
      {children}
    </div>
  );
};
