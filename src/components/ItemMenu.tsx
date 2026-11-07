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

export const ItemMenu = ({ title, item, actions, onClose }: Props) => {
  const ref = useRef<HTMLDivElement>(null);
  const [labelCopied, setLabelCopied] = useState(false);
  const labelTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => {
      window.removeEventListener('keydown', handler);
      if (labelTimeoutRef.current) window.clearTimeout(labelTimeoutRef.current);
    };
  }, [onClose]);

  const handleCopyLabel = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!item?.label) return;
    const textToCopy = item.label.trim();
    const ok = await copyToClipboard(textToCopy);
    if (ok) {
      setLabelCopied(true);
      if (labelTimeoutRef.current) window.clearTimeout(labelTimeoutRef.current);
      labelTimeoutRef.current = window.setTimeout(() => {
        setLabelCopied(false);
      }, 1200);
    }
  };

  const renderLabelBadge = () => {
    if (!item?.label || !item.label.trim()) return null;
    const fullWallet = item.label.trim();
    // Di menu jika frasa, tampilkan 4 karakter terakhir atau jika pendek tampilkan utuh
    const displayLabel = fullWallet.length > 4 ? fullWallet.slice(-4) : fullWallet;

    return (
      <button
        type="button"
        onClick={handleCopyLabel}
        title={`Klik untuk menyalin alamat dompet: ${fullWallet}`}
        className={`inline-flex items-center gap-1 text-xs font-semibold mr-2 shrink-0 select-none cursor-pointer transition-colors duration-150 active:scale-95 ${
          labelCopied
            ? 'text-emerald-600 dark:text-emerald-400'
            : 'text-neutral-500 dark:text-neutral-400 hover:text-[#FF4F00] dark:hover:text-[#FF4F00]'
        }`}
      >
        <span>{displayLabel}</span>
        {labelCopied && (
          <Check size={12} className="shrink-0 text-emerald-600 dark:text-emerald-400 animate-in fade-in" />
        )}
      </button>
    );
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
          <div className="flex items-center min-w-0 flex-1 pr-2">
            {item?.type !== 'phrase' && renderLabelBadge()}
            <div className="text-sm font-bold text-[#131313] dark:text-neutral-100 truncate">{title}</div>
          </div>
          <button
            data-testid="menu-close-btn"
            onClick={onClose}
            className="p-1.5 hover:bg-white dark:hover:bg-neutral-700 rounded-lg transition-colors text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100 border border-transparent hover:border-[#e2ddd5] dark:hover:border-neutral-700 shrink-0"
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
