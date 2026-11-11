import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast as sonnerToast } from 'sonner';
import {
  Search,
  FolderPlus,
  Home,
  ChevronRight,
  X,
  Trash2,
  Move,
  ListChecks,
  PanelLeft,
  MessageCircle,
  KeyRound,
  RefreshCw
} from 'lucide-react';
import { AppLogo } from './components/AppLogo';

import { FileBrowser } from './components/FileBrowser';
import { ItemMenu, MenuAction } from './components/ItemMenu';
import { LoginScreen } from './components/LoginScreen';
import { useDialog } from './context/DialogContext';

import { useFileSystem } from './hooks/useFileSystem';
import { useAppwriteSync } from './hooks/useAppwriteSync';
import { useI18n } from './lib/i18n';
import { ADMIN_EMAIL } from './lib/appwrite';

import { FileSystemItem } from './Types';
import { cleanText } from './lib/titleExtractor';
import { hasPinSet, usePinState } from './lib/pin';
import { isBip39EnglishWord } from './lib/bip39';

import { FolderPicker } from './components/FolderPicker';
import { SettingsDialog } from './components/SettingsDialog';
import { PinModal } from './components/PinModal';
import { FullscreenChatModal } from './components/FullscreenChatModal';
import { PhraseViewModal } from './components/PhraseViewModal';

export default function App() {
  const fs = useFileSystem();
  const { confirm: customConfirm, prompt: customPrompt } = useDialog();
  const {
    items,
    loaded,
    currentFolderId,
    setCurrentFolderId,
    currentItems,
    createItem,
    updateContent,
    renameItem,
    updateItem,
    deleteMany,
    moveMany,
    getBreadcrumbs,
    searchItems,
    pathOf,
    exportJSON,
    importJSON,
    clearClipboardAndPharseContents,
    refreshAndSanitizeAll,
  } = fs;

  const [updatingFiles, setUpdatingFiles] = useState(false);

  const [query, setQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [keepSelectMode, setKeepSelectMode] = useState(false);
  const [menuFor, setMenuFor] = useState<FileSystemItem | null>(null);
  const [pickerConfig, setPickerConfig] = useState<
    | null
    | {
        title: string;
        confirmLabel: string;
        disabledIds?: Set<string>;
        hiddenFolderIds?: Set<string>;
        restrictedRootFolderId?: string;
        onConfirm: (folderId: string | null) => Promise<void> | void;
      }
  >(null);

  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsInitialTab, setSettingsInitialTab] = useState<'profile' | null>(null);
  const [showChatPopup, setShowChatPopup] = useState(false);
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.classList.remove('dark-theme', 'dark');
      document.documentElement.style.colorScheme = 'light';
    }
  }, []);

  // PIN security states
  const pinActive = usePinState();
  const [pinModalMode, setPinModalMode] = useState<'setup' | 'unlock' | 'manage' | 'reset_password' | 'unlock_folder_lock' | null>(null);
  const [folderPendingUnlock, setFolderPendingUnlock] = useState<FileSystemItem | null>(null);
  const [unlockedFolderIds, setUnlockedFolderIds] = useState<Set<string>>(new Set());

  // Phrase Read-Only modal state
  const [viewingPhraseItem, setViewingPhraseItem] = useState<FileSystemItem | null>(null);

  const { t } = useI18n();

  const { user, loading, syncing, login, register, resetPassword, verifyPasswordAndResetPin, updatePasswordRecovery, verifyEmail, logout, smartSync } = useAppwriteSync(
    items,
    importJSON,
    exportJSON,
    loaded
  );

  const guardOffline = useCallback(() => {
    return false;
  }, []);

  const handleLogout = async () => {
    setViewingPhraseItem(null);
    await clearClipboardAndPharseContents();
    await logout();
    await clearClipboardAndPharseContents();
  };

  const selectMode = selectedIds.size > 0 || keepSelectMode;

  const showToast = useCallback((msg: string) => {
    sonnerToast.dismiss();
    sonnerToast(msg, { duration: 1500 });
  }, []);

  const isItemLocked = useCallback(
    (item: FileSystemItem): boolean => {
      if (!hasPinSet()) return false;
      if (item.type === 'folder' && item.locked && !unlockedFolderIds.has(item.id)) {
        return true;
      }
      let cur = items.find((i) => i.id === item.parentId);
      while (cur) {
        if (cur.locked && !unlockedFolderIds.has(cur.id)) {
          return true;
        }
        cur = items.find((i) => i.id === cur!.parentId);
      }
      return false;
    },
    [items, unlockedFolderIds, pinActive],
  );

  const breadcrumbs = getBreadcrumbs();
  const searchMode = query.trim().length > 0;
  const listItems = useMemo(
    () => (searchMode ? searchItems(query).filter((i) => !isItemLocked(i)) : currentItems),
    [searchMode, query, searchItems, currentItems, isItemLocked],
  );

  useEffect(() => {
    if (selectMode) {
      const filter = searchMode
        ? new Set(listItems.map((i) => i.id))
        : new Set(currentItems.map((i) => i.id));
      const kept = new Set<string>();
      selectedIds.forEach((id) => {
        if (filter.has(id)) kept.add(id);
      });
      if (kept.size !== selectedIds.size) setSelectedIds(kept);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentFolderId, searchMode]);

  const navigateTo = (id: string | null) => {
    if (id && hasPinSet()) {
      let cur = items.find((i) => i.id === id);
      let lockedTarget: FileSystemItem | null = null;
      while (cur) {
        if (cur.locked && !unlockedFolderIds.has(cur.id)) {
          lockedTarget = cur;
        }
        cur = items.find((i) => i.id === cur!.parentId);
      }
      if (lockedTarget) {
        setFolderPendingUnlock(lockedTarget);
        setPinModalMode('unlock');
        return;
      }
    }

    setCurrentFolderId(id);
    setQuery('');
    setSelectedIds(new Set());
  };

  const handleToggleFolderLock = async (folderId: string, skipPinCheck?: boolean) => {
    if (guardOffline()) return;
    const f = items.find((i) => i.id === folderId);
    if (!f) return;

    if (!hasPinSet()) {
      showToast('PIN belum diatur');
      return;
    }

    if (f.locked && !skipPinCheck) {
      setFolderPendingUnlock(f);
      setPinModalMode('unlock_folder_lock');
      return;
    }

    const nextLocked = !f.locked;

    if (nextLocked) {
      const isProOrAdmin = user?.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase() || user?.prefs?.proStatus === 'pro';
      if (!isProOrAdmin) {
        const currentlyLockedCount = items.filter((i) => i.type === 'folder' && i.locked).length;
        if (currentlyLockedCount >= 1) {
          showToast('Batas 1 folder terkunci');
          return;
        }
      }
    }

    await fs.updateItem(folderId, { locked: nextLocked });
    if (nextLocked) {
      setUnlockedFolderIds((prev) => {
        const next = new Set(prev);
        next.delete(folderId);
        return next;
      });
      showToast('Folder dikunci');
    } else {
      setUnlockedFolderIds((prev) => {
        const next = new Set(prev);
        next.add(folderId);
        return next;
      });
      showToast('Folder dibuka');
    }
  };

  const handleVerifyPasswordAndReset = async (password: string) => {
    const ok = await verifyPasswordAndResetPin(password);
    if (ok) {
      const lockedFolders = items.filter((i) => i.type === 'folder' && i.locked);
      for (const f of lockedFolders) {
        await fs.updateItem(f.id, { locked: false });
      }
      setUnlockedFolderIds(new Set());
    }
    return ok;
  };

  const handleOpenPinMenu = () => {
    if (!hasPinSet()) {
      setPinModalMode('setup');
    } else {
      setPinModalMode('manage');
    }
  };

  const handleNewFolder = async () => {
    if (guardOffline()) return;
    const name = await customPrompt(t('modal.folderName') || 'Nama Folder Baru');
    if (name && name.trim()) {
      try {
        await createItem(name.trim(), 'folder', currentFolderId);
      } catch (e: any) {
        showToast(e?.message || 'Gagal membuat folder');
      }
    }
  };



  const handleRefreshAndSync = async () => {
    if (guardOffline()) return;
    if (syncing || updatingFiles) return;
    setUpdatingFiles(true);
    try {
      // 1. Perbarui semua file lokal (hapus duplikat di luar clipboard, format judul, sesuaikan aturan)
      const res = await refreshAndSanitizeAll();
      
      // 2. Jalankan sinkronisasi cloud
      await smartSync(true);

      if (res.duplicatesRemoved > 0) {
        showToast(`Sinkronisasi selesai: ${res.duplicatesRemoved} duplikat dibersihkan`);
      } else {
        showToast('Perbarui & sinkronisasi selesai');
      }
    } catch (e: any) {
      showToast(e?.message || 'Gagal sinkronisasi');
    } finally {
      setUpdatingFiles(false);
    }
  };


  const handleNewPhrase = async () => {
    if (guardOffline()) return;

    let textToProcess = '';

    // 1-click paste: attempt to read from clipboard immediately
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.readText) {
        const clip = await navigator.clipboard.readText();
        if (clip && clip.trim()) {
          textToProcess = clip.trim();
        }
      }
    } catch (err) {
      console.warn('Clipboard read error/denied for phrase:', err);
    }

    const parseAndValidateWords = (str: string) => {
      const lower = cleanText(str).toLowerCase();
      const rawWords = lower.split(/[\s,;\t\n\r]+/).filter(Boolean);
      return rawWords
        .map((w) => w.toLowerCase().replace(/[^a-z]/g, ''))
        .filter(Boolean);
    };

    const words = parseAndValidateWords(textToProcess);

    // Hapus fallback: wajib minimal 12 kata langsung dari papan klip
    if (words.length < 12) {
      showToast('bukan bip39');
      return;
    }

    // Validasi apakah setiap kata valid dalam kamus BIP39 English
    const invalidWords = words.filter(w => !isBip39EnglishWord(w));
    if (invalidWords.length > 0) {
      showToast('bukan bip39');
      return;
    }

    // Force strictly lowercase space-separated words
    const cleanContent = words.map((w) => w.toLowerCase()).join(' ');

    // Deteksi anti-duplikat langsung dari seluruh isi yang ditempel
    const isDuplicate = items.some(
      (it) => !it.deletedAt && it.type === 'phrase' && it.content?.trim() === cleanContent.trim()
    );
    if (isDuplicate) {
      showToast('Frasa ini sudah ada');
      return;
    }

    // Penamaan frasa dari kata pertama dihapus, digantikan dengan alamat dompet
    const walletAddressInput = await customPrompt('Alamat Dompet', '', {
      placeholder: 'Tulis alamat dompet (opsional)...',
    });
    if (walletAddressInput === null) {
      // Batal tambah frasa
      return;
    }

    const walletAddress = walletAddressInput.trim();

    try {
      await createItem(walletAddress, 'phrase', currentFolderId, cleanContent);
      showToast('Frasa disimpan');
    } catch (e: any) {
      showToast(e?.message || 'Gagal simpan');
    }
  };

  const selectableItems = useMemo(() => {
    return listItems.filter((item) => {
      const isLocked = item.type === 'folder' && item.locked;
      return !isLocked;
    });
  }, [listItems]);

  const allSelected = selectableItems.length > 0 && selectableItems.every((i) => selectedIds.has(i.id));

  const toggleSelectAllHeader = () => {
    if (selectableItems.length === 0) return;

    if (!selectMode) {
      // Masuk ke mode pilih tanpa langsung memilih semua item
      setKeepSelectMode(true);
      setSelectedIds(new Set());
      showToast('Mode pilih aktif');
      return;
    }

    // Jika sudah di dalam mode pilih, toggle pilih semua atau batalkan
    if (allSelected) {
      clearSelection();
    } else {
      const next = new Set<string>();
      selectableItems.forEach((i) => next.add(i.id));
      setSelectedIds(next);
      setKeepSelectMode(true);
    }
  };


  const toggleSelect = (id: string) => {
    setKeepSelectMode(true);
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const clearSelection = () => {
    setKeepSelectMode(false);
    setSelectedIds(new Set());
  };

  const disabledFolderIds = (movingIds: string[]): Set<string> => {
    const disabled = new Set<string>(movingIds);
    const walk = (id: string) => {
      items.filter((i) => i.parentId === id).forEach((c) => {
        if (!disabled.has(c.id)) {
          disabled.add(c.id);
          walk(c.id);
        }
      });
    };
    movingIds.forEach(walk);
    return disabled;
  };

  const openMovePicker = (ids: string[]) => {
    if (guardOffline()) return;

    setPickerConfig({
      title: t('action.moveItems').replace('{count}', ids.length.toString()),
      confirmLabel: t('action.move'),
      disabledIds: disabledFolderIds(ids),
      onConfirm: async (target) => {
        try {
          await moveMany(ids, target);
          clearSelection();
          showToast('Dipindahkan');
        } catch (e: any) {
          showToast(e?.message || 'Gagal dipindahkan');
        }
      },
    });
  };

  const guardedDelete = async (
    ids: string[],
    opts?: { title?: string; afterDelete?: () => void },
  ) => {
    if (guardOffline()) return;
    const filteredIds = [...ids];
    if (filteredIds.length === 0) return;

    const lockedItems = filteredIds.filter(id => {
      const item = items.find(i => i.id === id);
      return item && isItemLocked(item);
    });
    
    if (lockedItems.length > 0) {
      showToast('Item terkunci');
      return;
    }

    const afterDelete = opts?.afterDelete;
    
    let targetName = 'item';
    if (filteredIds.length === 1) {
      const targetItem = items.find((i) => i.id === filteredIds[0]);
      if (targetItem) {
        if (targetItem.type === 'folder') {
          targetName = targetItem.name || t('picker.newFolder');
        } else {
          targetName = targetItem.content?.split('\n').find((l) => l.trim()) || targetItem.name || '(tanpa nama)';
        }
      }
      if (targetName.length > 30) {
        targetName = targetName.substring(0, 30) + '...';
      }
    }

    const title =
      opts?.title ||
      (filteredIds.length === 1
        ? `Hapus "${targetName}"?`
        : `Hapus ${filteredIds.length} item?`);

    const performDelete = async () => {
      await deleteMany(filteredIds);
      clearSelection();
      showToast('Dihapus');
      afterDelete?.();
    };

    if (await customConfirm(title)) {
      await performDelete();
    }
  };

  const bulkDelete = () => {
    const ids = [...selectedIds];
    guardedDelete(ids);
  };





  const handlePin = async (id: string, pinned: boolean) => {
    if (guardOffline()) return;
    await fs.updateItem(id, { pinned });
  };


  const handleSetLabel = async (item: FileSystemItem) => {
    if (guardOffline()) return;
    if (item.type === 'folder') return;
    const promptTitle = item.label ? 'Ubah Alamat Dompet' : 'Tambah Alamat Dompet';
    const input = await customPrompt(promptTitle, item.label || '', {
      placeholder: 'Tulis alamat dompet...',
    });
    if (input === null) return;

    const trimmed = input.trim();
    if (!trimmed) {
      await updateItem(item.id, { label: '' });
      showToast('Alamat dompet dihapus');
    } else {
      await updateItem(item.id, { label: trimmed });
      showToast('Alamat dompet disimpan');
    }
  };

  const openItemMenu = (item: FileSystemItem) => {
    setMenuFor(item);
  };

  const menuActions = (item: FileSystemItem): MenuAction[] => {
    const list: MenuAction[] = [];

    if (item.type === 'phrase') {
      list.push({
        key: 'move',
        label: t('action.moveToFolder'),
        onClick: () => openMovePicker([item.id]),
      });
      list.push({
        key: 'label',
        label: item.label ? 'Ubah Alamat Dompet' : 'Tambah Alamat Dompet',
        onClick: () => handleSetLabel(item),
      });
      return list;
    }

    if (item.type === 'folder') {
      list.push({
        key: 'rename',
        label: t('action.rename') || 'Ubah Nama',
        onClick: async () => {
          if (guardOffline()) return;
          const newName = await customPrompt(t('modal.folderName') || 'Nama Folder', item.name, {
            placeholder: 'Nama Folder...',
          });
          if (newName !== null) {
            const trimmed = newName.trim();
            if (!trimmed) {
              showToast('Nama folder tidak boleh kosong');
              return;
            }
            if (trimmed === item.name) return;
            try {
              await renameItem(item.id, trimmed);
              showToast('Nama folder diubah');
            } catch (err: any) {
              showToast(err?.message || 'Gagal mengubah nama');
            }
          }
        },
      });
    }

    list.push({ key: 'move', label: t('action.moveToFolder'), onClick: () => openMovePicker([item.id]) });
    if (item.type === 'folder') {
      list.push({
        key: 'lock',
        label: (item.locked && hasPinSet()) ? (t('pin.unlockPin') || 'Buka PIN') : (t('pin.lockPin') || 'Kunci PIN'),
        onClick: () => handleToggleFolderLock(item.id),
      });
    }


    if (!isItemLocked(item)) {
      list.push({
        key: 'delete',
        label: t('action.delete'),
        danger: true,
        onClick: () => guardedDelete([item.id]),
      });
    }
    return list;
  };

  if (loading || !user) {
    return <LoginScreen login={login} register={register} resetPassword={resetPassword} updatePasswordRecovery={updatePasswordRecovery} verifyEmail={verifyEmail} loading={loading} />;
  }

  if (!loaded) {
    return (
      <div className="min-h-screen flex items-center justify-center text-sm text-neutral-500">
        ...
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-transparent text-[#131313] flex flex-col">
      <header className="sticky top-0 z-40 bg-white dark:bg-neutral-900 border-b border-[#e2ddd5] dark:border-neutral-800 shadow-xs select-none shrink-0">
        {/* Top Header Bar */}
        <div className="max-w-5xl mx-auto px-3 sm:px-4 py-2 h-13 flex items-center justify-between border-b border-[#e2ddd5]/50 dark:border-neutral-800/80">
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              data-testid="settings-btn"
              onClick={() => {
                setSettingsInitialTab(null);
                setSettingsOpen(true);
              }}
              className="text-neutral-900 dark:text-neutral-200 hover:bg-[#faf8f5] dark:hover:bg-neutral-800 p-1.5 rounded-xl transition-colors border border-transparent hover:border-[#e2ddd5] dark:hover:border-neutral-700 shrink-0 flex items-center justify-center cursor-pointer"
              aria-label={t('file.menu')}
              title={t('file.menu')}
            >
              <PanelLeft size={22} className="text-[#131313] dark:text-neutral-200" />
            </button>
            <div
              onClick={() => navigateTo(null)}
              className="flex items-center gap-1.5 text-[#131313] dark:text-neutral-100 text-xl font-bold tracking-tight select-none shrink-0 cursor-pointer"
            >
              <AppLogo size={24} className="text-[#FF4F00] shrink-0" />
              <span className="shrink-0 whitespace-nowrap">Tautan <span className="text-[#FF4F00]">Lumina</span></span>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-4 relative">
            <div className="relative">
              <button 
                onClick={() => setShowChatPopup(true)}
                className="inline-flex text-neutral-800 dark:text-neutral-200 hover:bg-[#faf8f5] dark:hover:bg-neutral-800 p-2 rounded-full transition-all relative border border-transparent hover:border-[#e2ddd5] dark:hover:border-neutral-700 cursor-pointer"
                title={t('chat.title') || 'Chat & Pengumuman'}
                aria-label={t('chat.title') || 'Chat & Pengumuman'}
              >
                <MessageCircle size={20} className="text-[#FF4F00]" />
              </button>
            </div>
          </div>
        </div>

        {/* Toolbar & Search: Connected directly below top bar with ZERO gap */}
        <div className="px-3 sm:px-4 py-2 bg-white dark:bg-neutral-900">
          <div className="max-w-5xl mx-auto flex flex-col gap-2">
            {/* Top Row: Search + Folder + File + Note + Phrase */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 w-full">
              <div className="w-full sm:w-0 sm:flex-1 min-w-[80px] flex items-center gap-2 border border-[#e2ddd5] dark:border-neutral-700 rounded-xl px-3.5 py-1.5 bg-[#faf8f5]/60 dark:bg-neutral-800/80 focus-within:bg-white dark:focus-within:bg-neutral-800 focus-within:border-[#FF4F00] focus-within:ring-2 focus-within:ring-[#FF4F00]/20 transition-all">
                <Search size={18} className="text-neutral-400 shrink-0" />
                <input
                  data-testid="search-input"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={t('search.placeholder')}
                  autoComplete="off"
                  data-1p-ignore="true"
                  data-lpignore="true"
                  data-bwignore="true"
                  data-form-type="other"
                  name="no_autofill_search"
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck="false"
                  className="flex-1 text-base bg-transparent focus:outline-none dark:text-white"
                />
                {query && (
                  <button
                    data-testid="search-clear"
                    onClick={() => setQuery('')}
                    className="p-1 text-neutral-400 hover:text-neutral-800 dark:hover:text-white cursor-pointer"
                    aria-label={t('action.delete')}
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <button
                  data-testid="new-phrase-btn"
                  onClick={handleNewPhrase}
                  className="p-2.5 border border-[#e2ddd5] dark:border-neutral-700 bg-white dark:bg-neutral-800 rounded-xl hover:bg-[#fff0eb] hover:text-[#FF4F00] hover:border-[#FF4F00]/40 transition-colors text-neutral-700 dark:text-neutral-200 shrink-0 flex-1 sm:flex-initial flex items-center justify-center cursor-pointer"
                  title={t('btn.newPhrase') || 'Frasa (1x Klik Tempel)'}
                  aria-label={t('btn.newPhrase') || 'Frasa (1x Klik Tempel)'}
                >
                  <KeyRound size={20} />
                </button>

                <button
                  data-testid="new-folder-btn"
                  onClick={handleNewFolder}
                  className="p-2.5 border border-[#e2ddd5] dark:border-neutral-700 bg-white dark:bg-neutral-800 rounded-xl hover:bg-[#fff0eb] hover:text-[#FF4F00] hover:border-[#FF4F00]/40 transition-colors text-neutral-700 dark:text-neutral-200 shrink-0 flex-1 sm:flex-initial flex items-center justify-center cursor-pointer"
                  title={t('btn.newFolder')}
                >
                  <FolderPlus size={20} />
                </button>
              </div>
            </div>

            {/* Bottom Row: Breadcrumb + Tools */}
            <div className="flex items-center justify-between gap-2 px-0.5">
              <div className="flex-1 min-w-0 flex items-center gap-1 overflow-x-auto no-scrollbar text-sm font-medium">
                <button
                  data-testid="crumb-root"
                  onClick={() => navigateTo(null)}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg hover:bg-[#faf8f5] dark:hover:bg-neutral-800 text-neutral-800 dark:text-neutral-200 transition-colors cursor-pointer"
                >
                  <Home size={15} className="text-[#FF4F00]" /> Root
                </button>
                {breadcrumbs.map((b) => (
                  <div key={b.id} className="inline-flex items-center gap-1">
                    <ChevronRight size={14} className="text-neutral-400" />
                    <button
                      data-testid={`crumb-${b.id}`}
                      onClick={() => navigateTo(b.id)}
                      className="px-2.5 py-1 rounded-lg hover:bg-[#faf8f5] dark:hover:bg-neutral-800 truncate max-w-[140px] text-neutral-800 dark:text-neutral-200 transition-colors cursor-pointer"
                    >
                      {b.name}
                    </button>
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-2">
                <button
                  data-testid="manual-sync-btn"
                  onClick={handleRefreshAndSync}
                  disabled={syncing || updatingFiles}
                  className="p-1.5 rounded-lg disabled:opacity-40 disabled:hover:bg-transparent transition-colors hover:bg-[#faf8f5] dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-200 border border-transparent hover:border-[#e2ddd5] dark:hover:border-neutral-700 flex items-center justify-center cursor-pointer mr-1"
                  title="Perbarui & Sinkronisasi"
                  aria-label="Perbarui & Sinkronisasi"
                >
                  <RefreshCw size={18} className={`text-[#FF4F00] ${syncing || updatingFiles ? 'animate-spin' : ''}`} />
                </button>
                <button
                  data-testid="select-all-header-btn"
                  onClick={toggleSelectAllHeader}
                  disabled={listItems.length === 0}
                  className={[
                    'p-1.5 rounded-lg disabled:opacity-40 disabled:hover:bg-transparent transition-colors cursor-pointer',
                    selectMode ? 'bg-[#FF4F00] text-white' : 'hover:bg-[#faf8f5] dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-200 border border-transparent hover:border-[#e2ddd5] dark:hover:border-neutral-700',
                  ].join(' ')}
                  title={selectMode ? (allSelected ? 'Batalkan pilihan semua' : 'Pilih semua') : 'Mode pilih'}
                  aria-label={selectMode ? (allSelected ? 'Batalkan pilihan semua' : 'Pilih semua') : 'Mode pilih'}
                >
                  <ListChecks size={18} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 w-full max-w-5xl mx-auto px-3 sm:px-4 py-3 flex flex-col gap-3 relative">

      {/* Selection toolbar */}
      {selectMode && (
        <div
          data-testid="selection-bar"
          className="mt-1 border border-[#e2ddd5] dark:border-neutral-700 rounded-xl p-2.5 bg-[#131313] text-white flex items-center gap-2 sticky top-[138px] z-20 shadow-md"
        >
          <div className="text-xs font-semibold px-2 py-1 bg-[#FF4F00] text-white rounded-lg" data-testid="selection-count">
            {t('action.selected').replace('{count}', selectedIds.size.toString())}
          </div>
          <div className="flex-1" />
          <button
            data-testid="bulk-delete-btn"
            onClick={bulkDelete}
            disabled={selectedIds.size === 0}
            className="p-1.5 hover:bg-neutral-800 disabled:opacity-40 disabled:hover:bg-transparent rounded-lg text-rose-400 hover:text-rose-300 transition-colors cursor-pointer"
            aria-label={t('action.delete')}
            title={t('action.delete')}
          >
            <Trash2 size={16} />
          </button>

          <button
            data-testid="bulk-move-btn"
            onClick={() => openMovePicker([...selectedIds])}
            disabled={selectedIds.size === 0}
            className="p-1.5 hover:bg-neutral-800 disabled:opacity-40 disabled:hover:bg-transparent rounded-lg text-neutral-200 transition-colors cursor-pointer"
            aria-label={t('action.move')}
            title={t('action.move')}
          >
            <Move size={16} />
          </button>
        </div>
      )}

      {/* List */}
      <div className="mt-1 border border-[#e2ddd5] rounded-2xl bg-white overflow-hidden p-2 shadow-xs">
        <FileBrowser
          items={listItems}
          selectMode={selectMode}
          selectedIds={selectedIds}
          onToggleSelect={toggleSelect}
          onOpenFolder={(id) => navigateTo(id)}
          onMenu={(it) => openItemMenu(it)}
          onPin={handlePin}
          onDelete={(id) => guardedDelete([id])}
          emptyLabel={searchMode ? t('empty.search') : undefined}
          searchMode={searchMode}
          pathOf={pathOf}
          currentFolderId={currentFolderId}
          onOpenPhrase={(it) => setViewingPhraseItem(it)}
          unlockedFolderIds={unlockedFolderIds}
        />
      </div>

      {menuFor && (
        <ItemMenu
          item={menuFor}
          title={
            menuFor.type === 'phrase'
              ? (() => {
                  const wallet = (menuFor.label || menuFor.name || '').trim();
                  if (!wallet) return 'Frasa';
                  return wallet.length > 4 ? wallet.slice(-4) : wallet;
                })()
              : menuFor.name || t('picker.newFolder')
          }
          actions={menuActions(menuFor)}
          onClose={() => setMenuFor(null)}
        />
      )}

        {pickerConfig && (
          <FolderPicker
            items={items}
            initialFolderId={currentFolderId}
            title={pickerConfig.title}
            confirmLabel={pickerConfig.confirmLabel}
            disabledIds={pickerConfig.disabledIds}
            onConfirm={async (id) => {
              await pickerConfig.onConfirm(id);
              setPickerConfig(null);
            }}
            onClose={() => setPickerConfig(null)}
            onCreateFolder={(name, parentId) => createItem(name, 'folder', parentId)}
          />
        )}

        
        {settingsOpen && (
          <SettingsDialog
            user={user}
            loading={loading}
            logout={handleLogout}
            initialTab={settingsInitialTab || null}
            onClose={() => {
              setSettingsOpen(false);
            }}
            onOpenPinMenu={handleOpenPinMenu}
            onResetPinPassword={() => setPinModalMode('reset_password')}
          />
        )}

        {pinModalMode && (
          <PinModal
            mode={pinModalMode}
            folderToUnlock={folderPendingUnlock || undefined}
            folders={items.filter((i) => i.type === 'folder')}
            onClose={() => {
              setPinModalMode(null);
              setFolderPendingUnlock(null);
            }}
            onSuccess={() => {
              if (pinModalMode === 'unlock' && folderPendingUnlock) {
                const fId = folderPendingUnlock.id;
                setUnlockedFolderIds((prev) => new Set(prev).add(fId));
                setCurrentFolderId(fId);
                setQuery('');
                setSelectedIds(new Set());
                showToast('Folder dibuka');
              } else if (pinModalMode === 'unlock_folder_lock' && folderPendingUnlock) {
                handleToggleFolderLock(folderPendingUnlock.id, true);
              } else if (pinModalMode === 'setup' && folderPendingUnlock) {
                handleToggleFolderLock(folderPendingUnlock.id, true);
              } else if (pinModalMode === 'reset_password') {
                setPinModalMode('setup');
              }
            }}
            onToggleFolderLock={handleToggleFolderLock}
            onVerifyPasswordAndReset={handleVerifyPasswordAndReset}
          />
        )}

        <FullscreenChatModal
          isOpen={showChatPopup}
          onClose={() => setShowChatPopup(false)}
          currentUserEmail={user?.email}
        />




        {viewingPhraseItem && (
          <PhraseViewModal
            item={viewingPhraseItem}
            onClose={() => setViewingPhraseItem(null)}
          />
        )}
      </main>
    </div>
  );
}
