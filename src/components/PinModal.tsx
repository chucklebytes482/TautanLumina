import React, { useState, useEffect } from 'react';
import { X, Lock, Unlock, AlertCircle, Folder, Check, Delete } from 'lucide-react';
import { toast } from 'sonner';
import { useI18n } from '../lib/i18n';
import { verifyPin, savePin, hasPinSet } from '../lib/pin';
import { FileSystemItem } from '../Types';

interface PinModalProps {
  mode: 'setup' | 'unlock' | 'manage' | 'reset_password' | 'unlock_folder_lock';
  folderToUnlock?: FileSystemItem;
  folders?: FileSystemItem[];
  onClose: () => void;
  onSuccess?: () => void;
  onToggleFolderLock?: (folderId: string, skipPinCheck?: boolean) => void;
  onVerifyPasswordAndReset?: (password: string) => Promise<boolean>;
}

export const PinModal: React.FC<PinModalProps> = ({
  mode: initialMode,
  folderToUnlock: targetFolder,
  folders = [],
  onClose,
  onSuccess,
  onToggleFolderLock,
  onVerifyPasswordAndReset,
}) => {
  const { t } = useI18n();
  const [pin, setPin] = useState<string[]>(['', '', '', '']);

  const [currentMode, setCurrentMode] = useState<'setup' | 'unlock' | 'manage' | 'reset_password' | 'unlock_folder_lock'>(initialMode);

  useEffect(() => {
    setCurrentMode(initialMode);
  }, [initialMode]);

  // Folder Unlock Confirmation State
  const [selectedFolderToUnlock, setSelectedFolderToUnlock] = useState<FileSystemItem | null>(null);
  const [unlockFolderPin, setUnlockFolderPin] = useState<string[]>(['', '', '', '']);

  // Reset Password State
  const [accountPasswordInput, setAccountPasswordInput] = useState('');
  const [resettingPassLoading, setResettingPassLoading] = useState(false);

  const [errorMsg, setErrorMsg] = useState('');
  const [isShaking, setIsShaking] = useState(false);

  const triggerError = (msg: string) => {
    setErrorMsg(msg);
    setIsShaking(true);
    setTimeout(() => setIsShaking(false), 500);
  };

  // Helper to determine current active state array & callback
  const getActiveTargetState = (): {
    state: string[];
    setState: React.Dispatch<React.SetStateAction<string[]>>;
    onSubmit?: (overridePin?: string[]) => void;
  } => {
    if (currentMode === 'setup') {
      return { state: pin, setState: setPin, onSubmit: handleFinishSetup };
    }
    if (currentMode === 'unlock' || currentMode === 'unlock_folder_lock') {
      return { state: pin, setState: setPin, onSubmit: handleUnlock };
    }
    if (currentMode === 'manage') {
      if (selectedFolderToUnlock) {
        return { state: unlockFolderPin, setState: setUnlockFolderPin, onSubmit: handleConfirmUnlockFolder };
      }
    }
    return { state: pin, setState: setPin };
  };

  const handleVirtualKeyPress = (
    key: string,
    targetState: string[],
    setTargetState: React.Dispatch<React.SetStateAction<string[]>>,
    onSubmitFn?: (overrideState?: string[]) => void
  ) => {
    setErrorMsg('');
    if (key === 'C') {
      setTargetState(['', '', '', '']);
      return;
    }
    if (key === 'BACK') {
      const lastIdx = targetState.map((d) => d !== '').lastIndexOf(true);
      if (lastIdx !== -1) {
        const nextState = [...targetState];
        nextState[lastIdx] = '';
        setTargetState(nextState);
      }
      return;
    }

    const firstEmptyIdx = targetState.findIndex((d) => d === '');
    if (firstEmptyIdx !== -1) {
      const nextState = [...targetState];
      nextState[firstEmptyIdx] = key;
      setTargetState(nextState);

      if (firstEmptyIdx === 3 && onSubmitFn) {
        setTimeout(() => onSubmitFn(nextState), 80);
      }
    }
  };

  // Physical Keyboard Handler (Desktop/Laptop support)
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // Don't intercept if focus is inside standard text input
      if (e.target instanceof HTMLInputElement && e.target.type !== 'password' && e.target.type !== 'hidden') {
        return;
      }

      const { state, setState, onSubmit } = getActiveTargetState();

      if (e.key >= '0' && e.key <= '9') {
        e.preventDefault();
        handleVirtualKeyPress(e.key, state, setState, onSubmit);
      } else if (e.key === 'Backspace' || e.key === 'Delete') {
        e.preventDefault();
        handleVirtualKeyPress('BACK', state, setState);
      } else if (e.key === 'c' || e.key === 'C') {
        e.preventDefault();
        handleVirtualKeyPress('C', state, setState);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (onSubmit) onSubmit();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [currentMode, pin, unlockFolderPin, selectedFolderToUnlock]);

  // Process PIN Setup
  const handleFinishSetup = async (overridePin?: string[]) => {
    const p1 = (overridePin || pin).join('');
    if (p1.length < 4) {
      triggerError(t('pin.enterPin'));
      return;
    }
    await savePin(p1);
    toast.success(t('pin.setSuccess'));
    if (onSuccess) onSuccess();
    onClose();
  };

  // Process PIN Unlock
  const handleUnlock = async (overridePin?: string[]) => {
    const entered = (overridePin || pin).join('');
    if (entered.length < 4) {
      triggerError(t('pin.enterPin'));
      return;
    }
    const valid = await verifyPin(entered);
    if (valid) {
      if (onSuccess) onSuccess();
      onClose();
    } else {
      triggerError(t('pin.wrong'));
      setPin(['', '', '', '']);
    }
  };

  // Confirm Unlock Folder with PIN
  const handleConfirmUnlockFolder = async (overridePin?: string[]) => {
    if (!selectedFolderToUnlock) return;
    const entered = (overridePin || unlockFolderPin).join('');
    if (entered.length < 4) {
      triggerError(t('pin.enterPin'));
      return;
    }
    const ok = await verifyPin(entered);
    if (ok) {
      if (onToggleFolderLock) {
        onToggleFolderLock(selectedFolderToUnlock.id, true);
      }
      toast.success(t('pin.folderUnlockedSuccess').replace('{name}', selectedFolderToUnlock.name));
      setSelectedFolderToUnlock(null);
      setUnlockFolderPin(['', '', '', '']);
      setErrorMsg('');
    } else {
      triggerError(t('pin.wrong'));
      setUnlockFolderPin(['', '', '', '']);
    }
  };

  // Verify Account Password and Reset PIN
  const handleVerifyPasswordAndReset = async () => {
    if (!accountPasswordInput.trim()) {
      triggerError(t('pin.enterAccountPassword') || 'Masukkan password akun Anda');
      return;
    }
    if (!onVerifyPasswordAndReset) return;
    setResettingPassLoading(true);
    const ok = await onVerifyPasswordAndReset(accountPasswordInput);
    setResettingPassLoading(false);
    if (ok) {
      if (onSuccess) onSuccess();
      onClose();
    } else {
      triggerError(t('pin.wrongAccountPassword') || 'Password akun salah. Silakan coba lagi.');
      setAccountPasswordInput('');
    }
  };

  // Render Display-Only PIN Input Slots (Prevents Native OS Touch Keyboard)
  const renderPinInputs = (
    stateArr: string[],
    onSelectField?: () => void,
    isFieldActive: boolean = true
  ) => {
    const firstEmptyIdx = stateArr.findIndex((d) => d === '');
    const activeSlotIdx = firstEmptyIdx === -1 ? 3 : firstEmptyIdx;

    return (
      <div
        onClick={onSelectField}
        className={`flex justify-center gap-3 my-3 cursor-pointer select-none ${
          isShaking && isFieldActive ? 'animate-shake' : ''
        }`}
      >
        {stateArr.map((digit, idx) => {
          const isSlotActive = isFieldActive && idx === activeSlotIdx;

          return (
            <input
              key={idx}
              type="password"
              inputMode="none"
              readOnly={true}
              value={digit}
              tabIndex={-1}
              autoComplete="off"
              data-1p-ignore="true"
              data-lpignore="true"
              data-bwignore="true"
              data-form-type="other"
              name={`pin_slot_${idx}`}
              className={`w-12 h-14 text-center text-xl font-bold rounded-xl border-2 outline-none transition-all bg-white text-neutral-900 shadow-xs cursor-pointer select-none pointer-events-none ${
                isSlotActive
                  ? 'border-[#ff4f00] ring-2 ring-[#ff4f00]/20 scale-105'
                  : digit
                  ? 'border-[#ff4f00]/50'
                  : 'border-[#e2ddd5]'
              }`}
            />
          );
        })}
      </div>
    );
  };

  const renderVirtualKeypad = (
    targetState: string[],
    setTargetState: React.Dispatch<React.SetStateAction<string[]>>,
    onSubmitFn?: () => void
  ) => {
    const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'C', '0', 'BACK'];
    return (
      <div className="mt-3 pt-3 border-t border-[#e2ddd5]/60 max-w-[260px] mx-auto select-none">
        <div className="grid grid-cols-3 gap-2.5">
          {keys.map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => handleVirtualKeyPress(k, targetState, setTargetState, onSubmitFn)}
              className={`h-11 rounded-xl text-base font-bold transition-all active:scale-95 flex items-center justify-center cursor-pointer select-none ${
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
      </div>
    );
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-start justify-center p-4 pt-6 sm:items-center sm:pt-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div
        className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-[#e2ddd5] overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#e2ddd5] bg-[#faf8f5]">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-[#fff0eb] text-[#ff4f00]">
              <Lock size={18} />
            </div>
            <div>
              <h3 className="text-base font-bold text-neutral-900">
                {currentMode === 'unlock' || currentMode === 'unlock_folder_lock'
                  ? (t('pin.unlockPin') || 'Buka PIN')
                  : currentMode === 'setup'
                  ? t('pin.setupTitle')
                  : currentMode === 'reset_password'
                  ? (t('pin.verifyAccountPassword') || 'Verifikasi Password Akun')
                  : t('pin.manageTitle')}
              </h3>
              {targetFolder && (
                <p className="text-xs text-neutral-500 font-medium truncate max-w-[220px]">
                  {targetFolder.name}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-700 hover:bg-neutral-200/50 transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-5 max-h-[85vh] overflow-y-auto">
          {/* RESET PASSWORD MODE */}
          {currentMode === 'reset_password' && (
            <div>
              <p className="text-sm text-neutral-600 text-center font-medium mb-4">
                {t('pin.resetPinDesc') || 'Masukkan password akun untuk mereset PIN keamanan dan membuka kunci seluruh folder'}
              </p>

              <div className="space-y-3">
                <div>
                  <label className="text-xs font-semibold text-neutral-700 block mb-1">
                    {t('pin.enterAccountPassword') || 'Masukkan password akun Anda'}
                  </label>
                  <input
                    type="password"
                    value={accountPasswordInput}
                    onChange={(e) => setAccountPasswordInput(e.target.value)}
                    placeholder="••••••••"
                    autoComplete="off"
                    data-1p-ignore="true"
                    data-lpignore="true"
                    data-bwignore="true"
                    data-form-type="other"
                    name="no_autofill_pwd_reset"
                    className="w-full border border-[#e2ddd5] rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#ff4f00]/20 focus:border-[#ff4f00] bg-white text-neutral-900 shadow-2xs"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleVerifyPasswordAndReset();
                      }
                    }}
                  />
                </div>

                {errorMsg && (
                  <div className="flex items-center justify-center gap-1.5 text-xs font-semibold text-red-500">
                    <AlertCircle size={14} />
                    <span>{errorMsg}</span>
                  </div>
                )}

                <div className="flex justify-between items-center mt-5 pt-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 text-xs font-semibold text-neutral-600 bg-neutral-100 hover:bg-neutral-200 rounded-xl transition-colors cursor-pointer"
                  >
                    {t('modal.cancel')}
                  </button>

                  <button
                    type="button"
                    onClick={handleVerifyPasswordAndReset}
                    disabled={resettingPassLoading || !accountPasswordInput.trim()}
                    className="px-5 py-2.5 text-xs font-semibold text-white bg-[#ff4f00] hover:bg-[#e04500] disabled:opacity-50 rounded-xl transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
                  >
                    <Check size={16} />
                    <span>{t('pin.verifyResetPin') || 'Verifikasi & Reset PIN'}</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* SETUP MODE */}
          {currentMode === 'setup' && (
            <div>
              <p className="text-sm text-neutral-600 text-center font-medium">
                {t('pin.enterPin')}
              </p>

              {renderPinInputs(pin)}
              {renderVirtualKeypad(pin, setPin, handleFinishSetup)}

              {errorMsg && (
                <div className="flex items-center justify-center gap-1.5 text-xs font-semibold text-red-500 mt-2">
                  <AlertCircle size={14} />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div className="flex justify-end items-center mt-4">
                <button
                  type="button"
                  onClick={() => handleFinishSetup()}
                  className="px-5 py-2.5 text-xs font-semibold text-white bg-[#ff4f00] hover:bg-[#e04500] rounded-xl transition-all shadow-xs cursor-pointer flex items-center gap-1.5 ml-auto"
                >
                  <Check size={16} />
                  <span>{t('pin.savePin')}</span>
                </button>
              </div>
            </div>
          )}

          {/* UNLOCK MODE */}
          {(currentMode === 'unlock' || currentMode === 'unlock_folder_lock') && (
            <div>
              <p className="text-sm text-neutral-600 text-center font-medium">
                Folder <span className="font-bold text-neutral-900">"{targetFolder?.name}"</span> {t('pin.folderLocked')}
                <br />
                {t('pin.enterPin')}
              </p>

              {renderPinInputs(pin)}
              {renderVirtualKeypad(pin, setPin, handleUnlock)}

              {errorMsg && (
                <div className="flex items-center justify-center gap-1.5 text-xs font-semibold text-red-500 mt-2">
                  <AlertCircle size={14} />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div className="flex justify-end items-center mt-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-semibold text-neutral-600 bg-neutral-100 hover:bg-neutral-200 rounded-xl transition-colors cursor-pointer"
                >
                  {t('modal.cancel')}
                </button>
              </div>
            </div>
          )}

          {/* MANAGE MODE */}
          {currentMode === 'manage' && (
                <div>
                  {/* TAB 1: MANAGE FOLDER LOCKS */}
                  {selectedFolderToUnlock ? (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2.5 p-3 bg-[#fff0eb]/60 rounded-xl border border-[#ff4f00]/30 text-xs">
                        <Lock size={16} className="text-[#ff4f00] shrink-0" />
                        <div>
                          <p className="font-semibold text-neutral-800">{t('pin.unlockingTitle')}</p>
                          <p className="text-neutral-600">
                            {t('pin.unlockFolderDesc')} <strong className="text-neutral-900">{selectedFolderToUnlock.name}</strong>:
                          </p>
                        </div>
                      </div>

                      {renderPinInputs(unlockFolderPin)}
                      {renderVirtualKeypad(unlockFolderPin, setUnlockFolderPin, handleConfirmUnlockFolder)}

                      {errorMsg && (
                        <div className="flex items-center justify-center gap-1.5 text-xs font-semibold text-red-500">
                          <AlertCircle size={14} />
                          <span>{errorMsg}</span>
                        </div>
                      )}

                      <div className="flex justify-between items-center mt-3 pt-2">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedFolderToUnlock(null);
                            setUnlockFolderPin(['', '', '', '']);
                            setErrorMsg('');
                          }}
                          className="px-4 py-2 text-xs font-semibold text-neutral-600 bg-neutral-100 hover:bg-neutral-200 rounded-xl transition-colors cursor-pointer"
                        >
                          {t('modal.cancel')}
                        </button>

                        <button
                          type="button"
                          onClick={() => handleConfirmUnlockFolder()}
                          className="px-5 py-2 text-xs font-semibold text-white bg-[#ff4f00] hover:bg-[#e04500] rounded-xl transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
                        >
                          <Unlock size={14} />
                          <span>{t('pin.unlockPin')}</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <p className="text-xs text-neutral-500 mb-3 font-medium">
                        {t('pin.selectFolderToLock')}
                      </p>

                      {folders.length === 0 ? (
                        <div className="py-8 text-center text-xs text-neutral-400 bg-[#faf8f5] rounded-xl border border-dashed border-[#e2ddd5]">
                          {t('pin.noFolders')}
                        </div>
                      ) : (
                        <div className="max-h-56 overflow-y-auto space-y-2 pr-1">
                          {folders.map((f) => {
                            const parentFolder = f.parentId ? folders.find((p) => p.id === f.parentId) : null;
                            return (
                              <div
                                key={f.id}
                                className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                                  f.locked
                                    ? 'bg-[#fff0eb]/60 border-[#ff4f00]/40'
                                    : 'bg-white border-[#e2ddd5] hover:border-neutral-300'
                                }`}
                              >
                                <div className="flex items-center gap-2.5 min-w-0 pr-2">
                                  <Folder size={16} className={`shrink-0 ${f.locked ? 'text-[#ff4f00]' : 'text-neutral-400'}`} />
                                  <div className="truncate min-w-0">
                                    <span className="text-xs font-semibold text-neutral-800 truncate block">
                                      {f.name}
                                    </span>
                                    {parentFolder && (
                                      <span className="text-[10px] text-neutral-400 block truncate">
                                        📁 {parentFolder.name}
                                      </span>
                                    )}
                                  </div>
                                </div>

                              <button
                                type="button"
                                onClick={() => {
                                  if (f.locked && hasPinSet()) {
                                    setSelectedFolderToUnlock(f);
                                    setUnlockFolderPin(['', '', '', '']);
                                    setErrorMsg('');
                                  } else if (onToggleFolderLock) {
                                    onToggleFolderLock(f.id);
                                  }
                                }}
                                className={`px-3 py-1.5 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
                                  f.locked
                                    ? 'bg-[#ff4f00] text-white shadow-2xs hover:bg-[#e04500]'
                                    : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                                }`}
                              >
                                {f.locked ? (
                                  <>
                                    <Lock size={13} />
                                    <span>{t('pin.lockedBadge')}</span>
                                  </>
                                ) : (
                                  <>
                                    <Unlock size={13} />
                                    <span>{t('pin.lock')}</span>
                                  </>
                                )}
                              </button>
                            </div>
                          );
                          })}
                        </div>
                      )}

                      <div className="flex justify-end items-center mt-4">
                        <button
                          type="button"
                          onClick={onClose}
                          className="px-5 py-2 text-xs font-semibold text-white bg-[#ff4f00] hover:bg-[#e04500] rounded-xl transition-all cursor-pointer"
                        >
                          {t('modal.done')}
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}
        </div>
      </div>
    </div>
  );
};
