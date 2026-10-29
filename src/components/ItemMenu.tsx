import { useEffect, useRef, useState } from 'react';
import { X, Check } from 'lucide-react';
import { FileSystemItem } from '../Types';

export interface MenuAction {
  key: string;
  label: string;
  danger?: boolean;
  onClick: () => void;
}

interface Props {
  title: string;
  item?: FileSystemItem | null;
  actions: MenuAction[];
  onClose: () => void;
}

const copyToClipboard = async (text: string): Promise<boolean> => {
  if (!text) return false;
  if (navigator?.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // fallback below
    }
  }
  try {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.opacity = '0';
    textArea.style.left = '-9999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    const successful = document.execCommand('copy');
    document.body.removeChild(textArea);
    return successful;
  } catch {
    return false;
  }
};

const formatDisplayUrl = (url: string): string => {
  if (!url) return '';
  return url
    .trim()
    .replace(/^https?:\/\/(?:www\.)?/i, '')
    .replace(/^www\./i, '')
    .replace(/\/+$/, '');
};

export const ItemMenu = ({ title, item, actions, onClose }: Props) => {
  const ref = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);
  const copyTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => {
      window.removeEventListener('keydown', handler);
      if (copyTimeoutRef.current) window.clearTimeout(copyTimeoutRef.current);
    };
  }, [onClose]);

  const isBookmark = item?.type === 'file' || /^https?:\/\//i.test(title);
  const rawUrl = (item?.content || title || '').trim();
  const displayTitle = isBookmark ? formatDisplayUrl(rawUrl) : title;
  const linkToCopy = isBookmark ? displayTitle : rawUrl;

  const handleCopyLink = async () => {
    if (!linkToCopy) return;
    const ok = await copyToClipboard(linkToCopy);
    if (ok) {
      setCopied(true);
      if (copyTimeoutRef.current) window.clearTimeout(copyTimeoutRef.current);
      copyTimeoutRef.current = window.setTimeout(() => {
        setCopied(false);
      }, 1200);
    }
  };

  return (
    <div className="modal-root" onClick={onClose} data-testid="item-menu">
      <div
        ref={ref}
        className="modal-panel border border-[#e2ddd5] dark:border-neutral-800 rounded-2xl shadow-2xl overflow-hidden bg-white dark:bg-neutral-900"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: 380 }}
      >
        <div className="flex items-center justify-between p-3 border-b border-[#e2ddd5] dark:border-neutral-800 bg-[#faf8f5] dark:bg-neutral-800/80">
          {isBookmark ? (
            <button
              type="button"
              onClick={handleCopyLink}
              title={`Klik untuk menyalin: ${linkToCopy}`}
              className={`inline-flex items-center gap-1.5 text-left text-sm font-bold truncate pr-2 py-0.5 rounded cursor-pointer select-none transition-colors duration-150 active:scale-[0.98] ${
                copied
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-[#131313] dark:text-neutral-100 hover:text-[#FF4F00] dark:hover:text-[#FF4F00]'
              }`}
            >
              <span className="truncate">{displayTitle}</span>
              {copied && <Check size={13} className="shrink-0 text-emerald-600 dark:text-emerald-400 animate-in fade-in" />}
            </button>
          ) : (
            <div className="text-sm font-bold text-[#131313] dark:text-neutral-100 truncate pr-2">{title}</div>
          )}
          <button
            data-testid="menu-close-btn"
            onClick={onClose}
            className="p-1.5 hover:bg-white dark:hover:bg-neutral-700 rounded-lg transition-colors text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100 border border-transparent hover:border-[#e2ddd5] dark:hover:border-neutral-700"
          >
            <X size={16} />
          </button>
        </div>
        <div className="modal-body p-2 bg-white dark:bg-neutral-900">
          <ul className="flex flex-col gap-1">
            {actions.map((a) => (
              <li key={a.key}>
                <button
                  data-testid={`menu-action-${a.key}`}
                  onClick={() => {
                    a.onClick();
                    onClose();
                  }}
                  className={[
                    'w-full text-left px-3.5 py-2.5 text-sm font-medium rounded-xl transition-all',
                    a.danger
                      ? 'text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40'
                      : 'text-[#131313] dark:text-neutral-100 hover:bg-[#fff0eb] dark:hover:bg-[#FF4F00]/20 hover:text-[#FF4F00] dark:hover:text-[#FF4F00]',
                  ].join(' ')}
                >
                  {a.label}
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};
