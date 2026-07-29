import React, { useState, useEffect } from 'react';
import { X, Delete, Move, Check, AlertCircle } from 'lucide-react';
import { useI18n } from '../lib/i18n';

interface MoveKeypadModalProps {
  maxNum: number;
  itemTitle?: string;
  onConfirm: (targetNum: number) => void;
  onClose: () => void;
}

export const MoveKeypadModal: React.FC<MoveKeypadModalProps> = ({
  maxNum,
  itemTitle,
  onConfirm,
  onClose,
}) => {
  const { t } = useI18n();
  const [valueStr, setValueStr] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [isShaking, setIsShaking] = useState<boolean>(false);

  const triggerError = (msg: string) => {
    setErrorMsg(msg);
    setIsShaking(true);
    setTimeout(() => setIsShaking(false), 500);
  };

  const handleKeyPress = (key: string) => {
    setErrorMsg('');
    if (key === 'C') {
      setValueStr('');
      return;
    }
    if (key === 'BACK') {
      setValueStr((prev) => prev.slice(0, -1));
      return;
    }

    if (key >= '0' && key <= '9') {
      // Prevent leading zero if empty
      if (valueStr === '' && key === '0') return;

      const nextValStr = valueStr + key;
      const num = parseInt(nextValStr, 10);
      if (num > maxNum) {
        triggerError(t('move.maxPositionError').replace('{max}', maxNum.toString()));
        return;
      }
      setValueStr(nextValStr);
    }
  };

  const handleSubmit = () => {
    if (!valueStr) {
      triggerError(t('move.enterPosition').replace('{max}', maxNum.toString()));
      return;
    }
    const num = parseInt(valueStr, 10);
    if (isNaN(num) || num < 1 || num > maxNum) {
      triggerError(t('move.rangeError').replace('{max}', maxNum.toString()));
      return;
    }
    onConfirm(num);
  };

  // Keyboard Event Listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key >= '0' && e.key <= '9') {
        e.preventDefault();
        handleKeyPress(e.key);
      } else if (e.key === 'Backspace' || e.key === 'Delete') {
        e.preventDefault();
        handleKeyPress('BACK');
      } else if (e.key === 'c' || e.key === 'C') {
        e.preventDefault();
        handleKeyPress('C');
      } else if (e.key === 'Enter') {
        e.preventDefault();
        handleSubmit();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [valueStr, maxNum]);

  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'C', '0', 'BACK'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-xs w-full p-5 shadow-2xl border border-[#e2ddd5] relative select-none">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-neutral-100 text-neutral-500 hover:text-neutral-800 transition-colors"
        >
          <X size={18} />
        </button>

        {/* Header */}
        <div className="text-center mb-4">
          <div className="w-11 h-11 bg-[#fff0eb] text-[#ff4f00] rounded-xl flex items-center justify-center mx-auto mb-2 border border-[#ff4f00]/20">
            <Move size={20} />
          </div>
          <h3 className="text-base font-bold text-neutral-900">
            {t('action.moveToNum') || 'Pindahkan ke Nomor...'}
          </h3>
          {itemTitle && (
            <p className="text-xs text-neutral-500 truncate mt-0.5 max-w-[200px] mx-auto">
              {itemTitle}
            </p>
          )}
          <p className="text-xs text-neutral-600 mt-1 font-medium">
            {t('move.determinePosition').replace('{max}', maxNum.toString())}
          </p>
        </div>

        {/* Value Display Box */}
        <div
          className={`relative mb-3 flex items-center justify-center ${
            isShaking ? 'animate-shake' : ''
          }`}
        >
          <div className="w-full h-14 bg-[#faf8f5] border-2 border-[#e2ddd5] focus-within:border-[#ff4f00] focus-within:ring-2 focus-within:ring-[#ff4f00]/20 rounded-xl flex items-center justify-center text-2xl font-bold text-neutral-900 shadow-inner px-4 tracking-wider">
            {valueStr ? (
              <span className="text-[#ff4f00] font-mono">{valueStr}</span>
            ) : (
              <span className="text-neutral-300 font-normal text-sm font-sans">
                {t('move.example').replace('{max}', maxNum.toString())}
              </span>
            )}
          </div>
        </div>

        {/* Error Message */}
        {errorMsg && (
          <div className="flex items-center justify-center gap-1.5 text-xs text-red-500 font-medium mb-3 text-center">
            <AlertCircle size={14} className="shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Virtual Keypad */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          {keys.map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => handleKeyPress(k)}
              className={`h-11 rounded-xl text-lg font-bold transition-all active:scale-95 flex items-center justify-center cursor-pointer ${
                k === 'C'
                  ? 'bg-neutral-100 hover:bg-neutral-200 text-neutral-600 text-xs font-semibold'
                  : k === 'BACK'
                  ? 'bg-neutral-100 hover:bg-neutral-200 text-neutral-700'
                  : 'bg-[#faf8f5] hover:bg-[#fff0eb] hover:text-[#ff4f00] hover:border-[#ff4f00]/40 border border-[#e2ddd5] text-neutral-800 shadow-2xs'
              }`}
            >
              {k === 'BACK' ? <Delete size={18} /> : k}
            </button>
          ))}
        </div>

        {/* Actions */}
        <div className="flex gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 px-3 border border-[#e2ddd5] rounded-xl text-xs font-medium text-neutral-700 hover:bg-neutral-50 transition-colors"
          >
            {t('action.cancel') || 'Batal'}
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!valueStr}
            className="flex-1 py-2.5 px-3 bg-[#ff4f00] hover:bg-[#e04500] disabled:bg-neutral-300 text-white rounded-xl text-xs font-semibold shadow-xs transition-all flex items-center justify-center gap-1.5"
          >
            <Check size={16} />
            <span>{t('action.move') || 'Pindahkan'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
