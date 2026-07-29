import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

export interface MenuAction {
  key: string;
  label: string;
  danger?: boolean;
  onClick: () => void;
}

interface Props {
  title: string;
  actions: MenuAction[];
  onClose: () => void;
}

export const ItemMenu = ({ title, actions, onClose }: Props) => {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <div className="modal-root" onClick={onClose} data-testid="item-menu">
      <div ref={ref} className="modal-panel border border-[#e2ddd5] rounded-2xl shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 380 }}>
        <div className="flex items-center justify-between p-3 border-b border-[#e2ddd5] bg-[#faf8f5]">
          <div className="text-sm font-bold text-[#131313] truncate pr-2">{title}</div>
          <button data-testid="menu-close-btn" onClick={onClose} className="p-1.5 hover:bg-white rounded-lg transition-colors text-neutral-500 hover:text-neutral-900 border border-transparent hover:border-[#e2ddd5]">
            <X size={16} />
          </button>
        </div>
        <div className="modal-body p-2 bg-white">
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
                      ? 'text-red-600 hover:bg-red-50' 
                      : 'text-[#131313] hover:bg-[#fff0eb] hover:text-[#FF4F00]',
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
