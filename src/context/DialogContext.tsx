import { createContext, useContext, useState, useRef, ReactNode, useEffect } from 'react';
import { useI18n } from '../lib/i18n';

interface DialogConfig {
  type: 'alert' | 'confirm' | 'prompt';
  message: string;
  defaultValue?: string;
  resolve: (value: any) => void;
  options?: {
    textarea?: boolean;
    maxWidth?: 'max-w-sm' | 'max-w-md' | 'max-w-lg' | 'max-w-xl';
  };
}

interface DialogContextType {
  alert: (message: string) => Promise<void>;
  confirm: (message: string) => Promise<boolean>;
  prompt: (message: string, defaultValue?: string, options?: { textarea?: boolean; maxWidth?: 'max-w-sm' | 'max-w-md' | 'max-w-lg' | 'max-w-xl' }) => Promise<string | null>;
}

const DialogContext = createContext<DialogContextType | undefined>(undefined);

export const useDialog = () => {
  const context = useContext(DialogContext);
  if (!context) {
    throw new Error('useDialog must be used within a DialogProvider');
  }
  return context;
};

export const DialogProvider = ({ children }: { children: ReactNode }) => {
  const { t } = useI18n();
  const [dialog, setDialog] = useState<DialogConfig | null>(null);
  const [inputValue, setInputValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const hasFocusedRef = useRef(false);

  useEffect(() => {
    if (dialog && dialog.type === 'prompt') {
      hasFocusedRef.current = false;
      const timer = setTimeout(() => {
        if (dialog.options?.textarea && textareaRef.current) {
          textareaRef.current.focus();
          textareaRef.current.setSelectionRange(textareaRef.current.value.length, textareaRef.current.value.length);
        } else if (!dialog.options?.textarea && inputRef.current) {
          inputRef.current.focus();
          inputRef.current.setSelectionRange(inputRef.current.value.length, inputRef.current.value.length);
        }
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [dialog]);

  const handleFocus = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (!hasFocusedRef.current) {
      hasFocusedRef.current = true;
      const el = e.currentTarget;
      const len = el.value.length;
      el.setSelectionRange(len, len);
    }
  };

  const showAlert = (message: string): Promise<void> => {
    return new Promise((resolve) => {
      setDialog({ type: 'alert', message, resolve });
    });
  };

  const showConfirm = (message: string): Promise<boolean> => {
    return new Promise((resolve) => {
      setDialog({ type: 'confirm', message, resolve });
    });
  };

  const showPrompt = (message: string, defaultValue = '', options?: { textarea?: boolean; maxWidth?: 'max-w-sm' | 'max-w-md' | 'max-w-lg' | 'max-w-xl' }): Promise<string | null> => {
    setInputValue(defaultValue);
    return new Promise((resolve) => {
      setDialog({ type: 'prompt', message, defaultValue, resolve, options });
    });
  };

  const handleOk = () => {
    if (!dialog) return;
    if (dialog.type === 'prompt') {
      dialog.resolve(inputValue);
    } else if (dialog.type === 'confirm') {
      dialog.resolve(true);
    } else {
      dialog.resolve(undefined);
    }
    setDialog(null);
    setInputValue('');
  };

  const handleCancel = () => {
    if (!dialog) return;
    if (dialog.type === 'prompt') {
      dialog.resolve(null);
    } else if (dialog.type === 'confirm') {
      dialog.resolve(false);
    }
    setDialog(null);
    setInputValue('');
  };

  return (
    <DialogContext.Provider value={{ alert: showAlert, confirm: showConfirm, prompt: showPrompt }}>
      {children}
      {dialog && (
        <div className={`fixed inset-0 bg-black/40 z-[9999] backdrop-blur-xs flex items-start justify-center ${dialog.options?.textarea ? 'p-2' : 'p-4'} overflow-y-auto`}>
          <div className={`mt-4 w-full ${dialog.options?.maxWidth || 'max-w-sm'} bg-white rounded-2xl border border-[#e2ddd5] shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200`}>
            <div className="p-5 flex-1">
              <p className="text-sm font-medium text-[#131313] whitespace-pre-wrap">{dialog.message}</p>
              {dialog.type === 'prompt' && (
                dialog.options?.textarea ? (
                  <textarea
                    ref={textareaRef}
                    rows={8}
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onFocus={handleFocus}
                    autoComplete="off"
                    data-1p-ignore="true"
                    data-lpignore="true"
                    data-bwignore="true"
                    data-form-type="other"
                    name="no_autofill_dialog_area"
                    autoCapitalize="none"
                    autoCorrect="off"
                    spellCheck="false"
                    className="mt-3.5 w-full border border-[#e2ddd5] bg-[#faf8f5]/60 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-[#FF4F00] focus:ring-2 focus:ring-[#FF4F00]/20 focus:bg-white transition-all text-[#131313] font-mono resize-y"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                        e.preventDefault();
                        handleOk();
                      }
                      if (e.key === 'Escape') {
                        e.preventDefault();
                        handleCancel();
                      }
                    }}
                    placeholder="Ketik note di sini..."
                  />
                ) : (
                  <input
                    ref={inputRef}
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onFocus={handleFocus}
                    autoComplete="off"
                    data-1p-ignore="true"
                    data-lpignore="true"
                    data-bwignore="true"
                    data-form-type="other"
                    name="no_autofill_dialog_input"
                    autoCapitalize="none"
                    autoCorrect="off"
                    spellCheck="false"
                    className="mt-3.5 w-full border border-[#e2ddd5] bg-[#faf8f5]/60 rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:border-[#FF4F00] focus:ring-2 focus:ring-[#FF4F00]/20 focus:bg-white transition-all text-[#131313]"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleOk();
                      if (e.key === 'Escape') handleCancel();
                    }}
                  />
                )
              )}
              {dialog.options?.textarea && (
                <p className="text-[11px] text-neutral-400 mt-1.5 text-right">
                  Ctrl + Enter untuk menyimpan • Esc untuk batal
                </p>
              )}
            </div>
            <div className="bg-[#faf8f5] px-4 py-3 border-t border-[#e2ddd5]/70 flex justify-end gap-2">
              {dialog.type !== 'alert' && (
                <button
                  onClick={handleCancel}
                  className="px-3.5 py-1.5 text-xs font-semibold border border-[#e2ddd5] rounded-xl text-neutral-700 hover:bg-white transition-colors"
                >
                  {t('modal.cancel')}
                </button>
              )}
              <button
                onClick={handleOk}
                className="px-4 py-1.5 text-xs font-semibold bg-[#FF4F00] text-white rounded-xl hover:bg-[#E04500] shadow-xs transition-colors"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}
    </DialogContext.Provider>
  );
};
