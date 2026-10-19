import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { toast as sonnerToast } from 'sonner';
import {
  Search,
  FolderPlus,
  FilePlus,
  Sparkles,
  Home,
  ChevronRight,
  X,
  Trash2,
  Copy,
  Move,
  ListChecks,
  Shield,
  Lock,
  Unlock,
  Layers,
  Eraser,
  Settings,
  Menu,
  PanelLeft,
  MessageCircle,
  ExternalLink,
  Mail,
  Aperture,
  FileText,
  RefreshCw,
  KeyRound
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
import { extractTitleFromUrl, cleanText } from './lib/titleExtractor';
import { hasPinSet, removePin, usePinState } from './lib/pin';
import { isBip39EnglishWord } from './lib/bip39';
import { isNetscapeBookmarkHTML } from './lib/bookmarkParser';

import { FolderPicker } from './components/FolderPicker';
import { SettingsDialog } from './components/SettingsDialog';
import { PinModal } from './components/PinModal';
import { MoveKeypadModal } from './components/MoveKeypadModal';
import { FullscreenChatModal } from './components/FullscreenChatModal';
import { PhraseViewModal } from './components/PhraseViewModal';

export default function App() {
  const fs = useFileSystem();
  const { alert: customAlert, confirm: customConfirm, prompt: customPrompt } = useDialog();
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
    updateMany,
    deleteMany,
    moveMany,
    copyMany,
    reorderInParent,
    childrenOf,
    getBreadcrumbs,
    searchItems,
    pathOf,
    exportJSON,
    exportHTML,
    importJSON,
    importHTML,
    importItems,
    clearAll,
    clearPharseFolder,
  } = fs;

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
        restrictedRootFolderId?: string;
        onConfirm: (folderId: string | null) => Promise<void> | void;
      }
  >(null);

  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsInitialTab, setSettingsInitialTab] = useState<'profile' | 'sync' | null>(null);
  const [showChatPopup, setShowChatPopup] = useState(false);
  const [isDarkTheme, setIsDarkTheme] = useState<boolean>(() => {
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => {
      setIsDarkTheme(e.matches);
    };
    mediaQuery.addEventListener('change', handleChange);
    
    if (isDarkTheme) {
      document.documentElement.classList.add('dark-theme');
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark-theme');
      document.documentElement.classList.remove('dark');
    }

    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, [isDarkTheme]);

  // PIN security states
  const pinActive = usePinState();
  const [pinModalMode, setPinModalMode] = useState<'setup' | 'unlock' | 'manage' | 'reset_password' | 'unlock_folder_lock' | null>(null);
  const [folderPendingUnlock, setFolderPendingUnlock] = useState<FileSystemItem | null>(null);
  const [unlockedFolderIds, setUnlockedFolderIds] = useState<Set<string>>(new Set());

  // Move Keypad modal state
  const [moveKeypadConfig, setMoveKeypadConfig] = useState<{
    targetItem?: FileSystemItem;
    isBulk?: boolean;
    maxNum: number;
  } | null>(null);


  // Phrase Read-Only modal state
  const [viewingPhraseItem, setViewingPhraseItem] = useState<FileSystemItem | null>(null);

  const { lang, setLang, t } = useI18n();

  const [isOffline, setIsOffline] = useState<boolean>(() => typeof navigator !== 'undefined' ? !navigator.onLine : false);

  const { user, loading, syncing, login, register, resetPassword, verifyPasswordAndResetPin, updatePasswordRecovery, verifyEmail, logout, smartSync } = useAppwriteSync(
    items,
    importJSON,
    exportJSON,
    loaded
  );

  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      smartSync(true);
    };
    const handleOffline = () => {
      setIsOffline(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [smartSync]);

  const guardOffline = useCallback(() => {
    if (typeof navigator !== 'undefined' && (!navigator.onLine || isOffline)) {
      return true;
    }
    return false;
  }, [isOffline]);

  const handleLogout = async () => {
    await logout();
    await clearAll();
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

  const isNoteFolderOrSubfolder = useCallback(
    (item: FileSystemItem): boolean => {
      if (item.id === 'folder-catatan' || item.id === 'folder-hello-world') {
        return true;
      }
      let cur: FileSystemItem | undefined = item;
      while (cur && cur.parentId) {
        if (cur.parentId === 'folder-catatan' || cur.parentId === 'folder-hello-world') {
          return true;
        }
        cur = items.find((i) => i.id === cur!.parentId);
      }
      return false;
    },
    [items]
  );

  const isPharseFolderOrSubfolder = useCallback(
    (folderId: string | null): boolean => {
      if (!folderId) return false;
      if (folderId === 'folder-pharse') return true;
      let cur = items.find((i) => i.id === folderId);
      while (cur && cur.parentId) {
        if (cur.parentId === 'folder-pharse') return true;
        cur = items.find((i) => i.id === cur!.parentId);
      }
      return false;
    },
    [items]
  );

  const isFromPharseFolder = useCallback(
    (id: string): boolean => {
      const item = items.find((i) => i.id === id);
      if (!item) return false;
      if (item.type === 'phrase') return true;
      return isPharseFolderOrSubfolder(item.parentId);
    },
    [items, isPharseFolderOrSubfolder]
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

    if (folderId === 'folder-catatan' || folderId === 'folder-hello-world' || folderId === 'folder-pharse') {
      showToast('Tidak dapat dikunci');
      return;
    }

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
    const name = await customPrompt(t('modal.folderName'));
    if (name && name.trim()) {
      await createItem(name.trim(), 'folder', currentFolderId);
    }
  };

  const handleNewFile = async () => {
    if (guardOffline()) return;

    const inputUrl = await customPrompt(t('modal.bookmarkUrl') || 'URL Bookmark', '', {
      placeholder: 'https://...',
    });
    if (!inputUrl || !inputUrl.trim()) return;

    const trimmed = cleanText(inputUrl);
    if (!trimmed) return;

    const finalUrl = trimmed.startsWith('http://') || trimmed.startsWith('https://')
      ? trimmed
      : `https://${trimmed}`;

    // Deteksi anti-duplikat langsung dari seluruh isi yang dimasukkan
    const normUrl = finalUrl.trim().replace(/\/+$/, '');
    const isDuplicate = items.some(
      (it) => !it.deletedAt && it.type === 'file' && (it.content?.trim().replace(/\/+$/, '') === normUrl)
    );
    if (isDuplicate) {
      showToast('Tautan ini sudah ada');
      return;
    }

    const extracted = extractTitleFromUrl(finalUrl);
    const autoTitle = (extracted && extracted.toLowerCase() !== 'bookmark') ? extracted : finalUrl;

    try {
      await createItem(autoTitle, 'file', currentFolderId, finalUrl);
      smartSync(true);
      showToast('Bookmark disimpan');
    } catch (e: any) {
      showToast(e?.message || 'Gagal simpan');
    }
  };

  const handleNewNote = async () => {
    if (guardOffline()) return;
    const text = await customPrompt(t('modal.noteText'), '', { textarea: true, maxWidth: 'max-w-xl' });
    if (!text || !text.trim()) return;
    
    const targetFolder = currentFolderId || 'folder-catatan';
    await createItem('', 'note', targetFolder, text.trim());
    smartSync(true);
    showToast('Catatan disimpan');
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
      showToast('Pharse ini sudah ada');
      return;
    }

    // Judul pharse otomatis diambil dari 1 kata pertama isi pharse
    const firstWord = words[0] || 'pharse';

    try {
      await createItem(firstWord, 'phrase', 'folder-pharse', cleanContent);
      smartSync(true);
      navigateTo('folder-pharse');
      showToast('Pharse disimpan');
    } catch (e: any) {
      showToast(e?.message || 'Gagal simpan');
    }
  };

  const toggleSelectAllHeader = () => {
    if (listItems.length === 0) return;
    
    const selectableItems = listItems.filter((item) => {
      const isSystem = item.id === 'folder-catatan' || item.id === 'folder-hello-world' || item.id === 'folder-pharse';
      const isLocked = item.type === 'folder' && item.locked;
      return !isSystem && !isLocked;
    });

    if (selectableItems.length === 0) return;

    const selectableIds = selectableItems.map((i) => i.id);
    const allSelected = selectableIds.every((id) => selectedIds.has(id));
    if (allSelected) {
      setKeepSelectMode(true);
      const next = new Set(selectedIds);
      selectableIds.forEach((id) => next.delete(id));
      setSelectedIds(next);
    } else {
      setKeepSelectMode(true);
      const next = new Set(selectedIds);
      selectableIds.forEach((id) => next.add(id));
      setSelectedIds(next);
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

    const isPharseMoving = movingIds.some((id) => isFromPharseFolder(id));
    if (!isPharseMoving) {
      disabled.add('folder-pharse');
      walk('folder-pharse');
    }

    return disabled;
  };

  const openMovePicker = (ids: string[]) => {
    if (guardOffline()) return;
    const isPharseMoving = ids.some((id) => isFromPharseFolder(id));
    setPickerConfig({
      title: t('action.moveItems').replace('{count}', ids.length.toString()),
      confirmLabel: t('action.move'),
      disabledIds: disabledFolderIds(ids),
      restrictedRootFolderId: isPharseMoving ? 'folder-pharse' : undefined,
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
    const filteredIds = ids.filter(id => id !== 'folder-catatan' && id !== 'folder-hello-world' && id !== 'folder-pharse');
    if (filteredIds.length < ids.length && ids.length === 1) {
      showToast('Tidak dapat dihapus');
      return;
    }
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
      smartSync(true);
    };

    if (await customConfirm(title)) {
      await performDelete();
    }
  };

  const bulkDelete = () => {
    const ids = [...selectedIds];
    guardedDelete(ids);
  };

  const bulkRegenerate = async () => {
    if (guardOffline()) return;
    const sourceList = selectMode && selectedIds.size > 0
      ? items.filter((i) => selectedIds.has(i.id))
      : listItems;

    let updatedCount = 0;

    if (sourceList.length > 0) {
      const targetBookmarks: FileSystemItem[] = [];
      const queue = [...sourceList];

      while (queue.length > 0) {
        const current = queue.shift()!;
        if (current.type === 'file') {
          targetBookmarks.push(current);
        } else if (current.type === 'folder' && !isNoteFolderOrSubfolder(current)) {
          const children = items.filter((i) => i.parentId === current.id);
          queue.push(...children);
        }
      }

      if (targetBookmarks.length > 0) {
        const updates = targetBookmarks.map((bm) => {
          const rawUrl = cleanText(bm.content) || cleanText(bm.name);
          const finalUrl = rawUrl.startsWith('http') ? rawUrl : `https://${rawUrl}`;
          const extracted = extractTitleFromUrl(finalUrl);
          const titleToUse = (extracted && extracted.toLowerCase() !== 'bookmark') ? extracted : finalUrl;
          const updatesObj: Partial<FileSystemItem> = {
            name: titleToUse,
          };
          if (!cleanText(bm.content)) {
            updatesObj.content = finalUrl;
          }
          return {
            id: bm.id,
            updates: updatesObj,
          };
        });

        if (updates.length > 0) {
          await updateMany(updates);
          updatedCount = updates.length;
        }
      }
    }

    // Otomatis sambil menyinkronkan
    if (user) {
      if (updatedCount > 0) {
        sonnerToast.success('Judul diperbarui, menyinkronkan...');
      }
      await smartSync(false);
    } else {
      if (updatedCount > 0) {
        sonnerToast.success('Judul diperbarui');
      } else {
        sonnerToast.info(sourceList.length === 0 ? 'Tidak ada bookmark' : 'Semua bookmark sudah diperbarui');
      }
    }
  };

  const handleConfirmMoveKeypad = async (targetNum: number) => {
    if (!moveKeypadConfig) return;
    if (guardOffline()) return;
    const targetIdx = targetNum - 1;
    const { targetItem } = moveKeypadConfig;
    setMoveKeypadConfig(null);

    if (targetItem) {
      const isFolder = targetItem.type === 'folder';
      const folderItems = listItems.filter((i) => i.type === 'folder');
      const bookmarkItems = listItems.filter((i) => i.type !== 'folder');

      if (isFolder) {
        const currentFolderIdx = folderItems.findIndex((i) => i.id === targetItem.id);
        if (currentFolderIdx !== -1) {
          const newFolderItems = [...folderItems];
          newFolderItems.splice(currentFolderIdx, 1);
          newFolderItems.splice(targetIdx, 0, targetItem);
          const reorderedIds = [
            ...newFolderItems.map((i) => i.id),
            ...bookmarkItems.map((i) => i.id),
          ];
          await reorderInParent(targetItem.parentId, reorderedIds);
          showToast('Dipindahkan');
        }
      } else {
        const currentBookmarkIdx = bookmarkItems.findIndex((i) => i.id === targetItem.id);
        if (currentBookmarkIdx !== -1) {
          const newBookmarkItems = [...bookmarkItems];
          newBookmarkItems.splice(currentBookmarkIdx, 1);
          newBookmarkItems.splice(targetIdx, 0, targetItem);
          const reorderedIds = [
            ...folderItems.map((i) => i.id),
            ...newBookmarkItems.map((i) => i.id),
          ];
          await reorderInParent(targetItem.parentId, reorderedIds);
          showToast('Dipindahkan');
        }
      }
    }
  };

  const handleExportJSON = () => {
    const data = exportJSON();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'tautan-lumina.json';
    a.click();
    URL.revokeObjectURL(url);
    showToast('Berhasil diekspor');
  };

  const handleExportHTML = () => {
    const data = exportHTML();
    const blob = new Blob([data], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'tautan-lumina-bookmarks.html';
    a.click();
    URL.revokeObjectURL(url);
    showToast('Berhasil diekspor');
  };

  const handleImport = () => {
    if (guardOffline()) return;
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json, text/html, .json, .html, .htm';
    input.onchange = async (e: any) => {
      const file = e.target.files?.[0];
      if (!file) return;
      if (file.size > 10 * 1024 * 1024) {
        showToast('File terlalu besar');
        return;
      }
      const reader = new FileReader();
      reader.onload = async (re) => {
        const content = re.target?.result as string;
        if (!content) return;
        try {
          const isBookmark = isNetscapeBookmarkHTML(content) || file.name.endsWith('.html') || file.name.endsWith('.htm');
          const targetFolder = 'folder-hello-world';
          if (isBookmark) {
            const count = await importHTML(content, false, targetFolder);
            showToast(`${count} bookmark diimpor`);
            smartSync(true);
          } else {
            await importJSON(content, false, targetFolder);
            showToast('Berhasil diimpor');
            smartSync(true);
          }
        } catch (err: any) {
          showToast(err?.message || 'Format tidak valid');
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  const onDropOnFolder = async (targetFolderId: string, draggedIds: string[]) => {
    if (guardOffline()) return;
    await moveMany(draggedIds, targetFolderId);
    clearSelection();
  };

  const onReorder = async (draggedIds: string[], overId: string, position: 'before' | 'after') => {
    if (guardOffline()) return;
    const overItem = items.find((i) => i.id === overId);
    if (!overItem) return;
    const parentId = overItem.parentId;
    const draggedInDifferentParent = draggedIds.filter((id) => {
      const it = items.find((i) => i.id === id);
      return it && it.parentId !== parentId;
    });
    if (draggedInDifferentParent.length) {
      await moveMany(draggedInDifferentParent, parentId);
    }
    setTimeout(async () => {
      const siblings = childrenOf(parentId).filter((i) => !draggedIds.includes(i.id));
      const overIdx = siblings.findIndex((i) => i.id === overId);
      const insertAt = position === 'before' ? overIdx : overIdx + 1;
      const draggedItems = draggedIds
        .map((id) => items.find((i) => i.id === id))
        .filter(Boolean) as FileSystemItem[];
      const ordered = [...siblings.slice(0, insertAt), ...draggedItems, ...siblings.slice(insertAt)];
      await reorderInParent(parentId, ordered.map((i) => i.id));
    }, 0);
  };

  const handlePin = async (id: string, pinned: boolean) => {
    if (guardOffline()) return;
    await fs.updateItem(id, { pinned });
  };

  const handleRegenerateFolder = async (folderId: string) => {
    if (guardOffline()) return;

    const targetFolder = items.find((i) => i.id === folderId);
    if (targetFolder && isNoteFolderOrSubfolder(targetFolder)) {
      sonnerToast.info('Tidak ada bookmark');
      return;
    }

    const folderBookmarks: FileSystemItem[] = [];
    const queue = [folderId];
    while (queue.length > 0) {
      const parentId = queue.shift()!;
      const children = items.filter((i) => i.parentId === parentId);
      for (const child of children) {
        if (child.type === 'file') {
          folderBookmarks.push(child);
        } else if (child.type === 'folder') {
          queue.push(child.id);
        }
      }
    }

    if (folderBookmarks.length === 0) {
      sonnerToast.info('Tidak ada bookmark');
      return;
    }

    const folderName = targetFolder?.name || 'folder ini';
    const confirmMessage = `Format ulang judul untuk ${folderBookmarks.length} bookmark di "${folderName}" berdasarkan URL?`;
    const confirmed = await customConfirm(confirmMessage);
    if (!confirmed) return;

    const updates = folderBookmarks.map((bm) => {
      const rawUrl = (bm.content || bm.name || '').trim();
      const finalUrl = rawUrl.startsWith('http') ? rawUrl : `https://${rawUrl}`;
      const updatesObj: Partial<FileSystemItem> = {
        name: extractTitleFromUrl(finalUrl),
      };
      if (!bm.content || !bm.content.trim()) {
        updatesObj.content = finalUrl;
      }
      return {
        id: bm.id,
        updates: updatesObj,
      };
    });

    if (updates.length > 0) {
      await updateMany(updates);
    }

    sonnerToast.success('Judul diperbarui');
  };

  const handleRegenerateBookmark = async (item: FileSystemItem) => {
    if (guardOffline()) return;
    const rawUrl = cleanText(item.content) || cleanText(item.name);
    if (!rawUrl) return;
    const finalUrl = rawUrl.startsWith('http') ? rawUrl : `https://${rawUrl}`;
    const newTitle = extractTitleFromUrl(finalUrl);

    const updatesObj: Partial<FileSystemItem> = {
      name: newTitle,
    };
    if (!cleanText(item.content)) {
      updatesObj.content = finalUrl;
    }

    await updateItem(item.id, updatesObj);
    smartSync(true);
    sonnerToast.success('Judul diperbarui');
  };

  const openItemMenu = (item: FileSystemItem) => {
    setMenuFor(item);
  };

  const menuActions = (item: FileSystemItem): MenuAction[] => {
    const list: MenuAction[] = [];

    if (item.type === 'phrase') {
      list.push({
        key: 'reorder',
        label: t('action.moveToNum'),
        onClick: () => {
          if (searchMode) {
            showToast('Tidak dapat dipindah');
            return;
          }
          const sameTypeItems = listItems.filter((i) => i.type === 'phrase');
          setMoveKeypadConfig({
            targetItem: item,
            isBulk: false,
            maxNum: sameTypeItems.length,
          });
        },
      });
      list.push({
        key: 'move',
        label: t('action.moveToFolder'),
        onClick: () => openMovePicker([item.id]),
      });
      return list;
    }

    list.push({
      key: 'reorder',
      label: t('action.moveToNum'),
      onClick: () => {
        if (searchMode) {
          showToast('Tidak dapat dipindah');
          return;
        }
        const isFolder = item.type === 'folder';
        const sameTypeItems = listItems.filter((i) => isFolder ? i.type === 'folder' : i.type !== 'folder');
        setMoveKeypadConfig({
          targetItem: item,
          isBulk: false,
          maxNum: sameTypeItems.length,
        });
      },
    });
    list.push({ key: 'move', label: t('action.moveToFolder'), onClick: () => openMovePicker([item.id]) });
    if (item.type === 'folder') {
      list.push({
        key: 'lock',
        label: (item.locked && hasPinSet()) ? (t('pin.unlockPin') || 'Buka PIN') : (t('pin.lockPin') || 'Kunci PIN'),
        onClick: () => handleToggleFolderLock(item.id),
      });

      list.push({
        key: 'rename',
        label: t('action.rename'),
        onClick: async () => {
          if (guardOffline()) return;
          const n = await customPrompt('' + t('modal.newName') + '', item.name);
          if (n && n.trim()) {
            await renameItem(item.id, n.trim());
            smartSync(true);
          }
        },
      });
    }

    if (item.type === 'file') {
      list.push({
        key: 'rename',
        label: t('action.rename') || 'Ganti Nama',
        onClick: async () => {
          if (guardOffline()) return;
          const n = await customPrompt('' + t('modal.newName') + '', item.name);
          if (n && n.trim()) {
            await renameItem(item.id, n.trim());
            smartSync(true);
          }
        },
      });
      list.push({
        key: 'regenerate',
        label: 'Perbarui Judul',
        onClick: () => handleRegenerateBookmark(item),
      });
    }

    if (item.type === 'note') {
      list.push({
        key: 'edit',
        label: t('file.editContent') || 'Edit Isi',
        onClick: async () => {
          if (guardOffline()) return;
          const content = await customPrompt(t('modal.noteText'), item.content || '', { textarea: true, maxWidth: 'max-w-xl' });
          if (content !== null && content.trim() !== '') {
            await updateContent(item.id, content.trim());
            smartSync(true);
            showToast('Catatan disimpan');
          }
        },
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
      <header className="sticky top-0 z-40 bg-white border-b border-[#e2ddd5] px-4 py-3 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-3">
          <button
            data-testid="settings-btn"
            onClick={() => {
              setSettingsInitialTab(null);
              setSettingsOpen(true);
            }}
            className="text-neutral-900 hover:bg-[#faf8f5] p-1.5 rounded-xl transition-colors border border-transparent hover:border-[#e2ddd5]"
            aria-label={t('file.menu')}
            title={t('file.menu')}
          >
            <PanelLeft size={24} className="text-[#131313]" />
          </button>
          <a href="#" className="flex items-center gap-2 text-[#131313] text-xl font-bold tracking-tight no-underline select-none">
            <AppLogo size={26} className="text-[#FF4F00]" />
            Tautan <span className="text-[#FF4F00]">Lumina</span>
          </a>
        </div>
        <div className="flex items-center gap-2 sm:gap-4 relative">
          <div className="relative">
            <button 
              onClick={() => setShowChatPopup(true)}
              className="inline-flex text-neutral-800 hover:bg-[#faf8f5] p-2 rounded-full transition-all relative border border-transparent hover:border-[#e2ddd5]"
              title={t('chat.title') || 'Chat & Pengumuman'}
              aria-label={t('chat.title') || 'Chat & Pengumuman'}
            >
              <MessageCircle size={20} className="text-[#FF4F00]" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-[#FF4F00] rounded-full animate-pulse" />
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 w-full max-w-5xl mx-auto p-4 flex flex-col gap-3 relative">
        <div className="border border-[#e2ddd5] rounded-2xl p-2.5 bg-white flex flex-col gap-2 sticky top-[72px] z-30 shadow-xs">
          {/* Top Row: Search + Folder + File */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-2.5 w-full">
            <div className="w-full sm:w-0 sm:flex-1 min-w-[80px] flex items-center gap-2 border border-[#e2ddd5] rounded-xl px-3.5 py-2 bg-[#faf8f5]/60 focus-within:bg-white focus-within:border-[#FF4F00] focus-within:ring-2 focus-within:ring-[#FF4F00]/20 transition-all">
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
                className="flex-1 text-base bg-transparent focus:outline-none"
              />
              {query && (
                <button
                  data-testid="search-clear"
                  onClick={() => setQuery('')}
                  className="p-1 text-neutral-400 hover:text-neutral-800"
                  aria-label={t('action.delete')}
                >
                  <X size={14} />
                </button>
              )}
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <button
                data-testid="new-folder-btn"
                onClick={handleNewFolder}
                className="p-2.5 border border-[#e2ddd5] bg-white rounded-xl hover:bg-[#fff0eb] hover:text-[#FF4F00] hover:border-[#FF4F00]/40 transition-colors text-neutral-700 shrink-0 flex-1 sm:flex-initial flex items-center justify-center"
                title={t('btn.newFolder')}
              >
                <FolderPlus size={20} />
              </button>
              <button
                data-testid="new-file-btn"
                onClick={handleNewFile}
                className="p-2.5 border border-[#e2ddd5] bg-white rounded-xl hover:bg-[#fff0eb] hover:text-[#FF4F00] hover:border-[#FF4F00]/40 transition-colors text-neutral-700 shrink-0 flex-1 sm:flex-initial flex items-center justify-center"
                title={t("btn.newBookmark")}
              >
                <FilePlus size={20} />
              </button>
              <button
                data-testid="new-note-btn"
                onClick={handleNewNote}
                className="p-2.5 border border-[#e2ddd5] bg-white rounded-xl hover:bg-[#fff0eb] hover:text-[#FF4F00] hover:border-[#FF4F00]/40 transition-colors text-neutral-700 shrink-0 flex-1 sm:flex-initial flex items-center justify-center bg-white"
                title={t('btn.newNote')}
              >
                <FileText size={20} />
              </button>
              <button
                data-testid="new-phrase-btn"
                onClick={handleNewPhrase}
                className="p-2.5 border border-[#e2ddd5] bg-white rounded-xl hover:bg-[#fff0eb] hover:text-[#FF4F00] hover:border-[#FF4F00]/40 transition-colors text-neutral-700 shrink-0 flex-1 sm:flex-initial flex items-center justify-center bg-white cursor-pointer"
                title={t('btn.newPhrase') || 'Pharse (1x Klik Tempel)'}
                aria-label={t('btn.newPhrase') || 'Pharse (1x Klik Tempel)'}
              >
                <KeyRound size={20} />
              </button>
            </div>
          </div>

          {/* Bottom Row: Breadcrumb + Tools */}
          <div className="flex items-center justify-between gap-2 px-0.5">
            <div className="flex-1 min-w-0 flex items-center gap-1 overflow-x-auto no-scrollbar text-sm font-medium">
              <button
                data-testid="crumb-root"
                onClick={() => navigateTo(null)}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg hover:bg-[#faf8f5] text-neutral-800 transition-colors"
              >
                <Home size={15} className="text-[#FF4F00]" /> Root
              </button>
              {breadcrumbs.map((b) => (
                <div key={b.id} className="inline-flex items-center gap-1">
                  <ChevronRight size={14} className="text-neutral-400" />
                  <button
                    data-testid={`crumb-${b.id}`}
                    onClick={() => navigateTo(b.id)}
                    className="px-2.5 py-1 rounded-lg hover:bg-[#faf8f5] truncate max-w-[140px] text-neutral-800 transition-colors"
                  >
                    {b.name}
                  </button>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-3.5">
              <button
                data-testid="regenerate-header-btn"
                onClick={bulkRegenerate}
                disabled={syncing || (!user && listItems.length === 0)}
                className="p-1.5 rounded-lg disabled:opacity-40 disabled:hover:bg-transparent transition-colors hover:bg-[#faf8f5] text-neutral-700 border border-transparent hover:border-[#e2ddd5] flex items-center justify-center cursor-pointer mr-1"
                title={user ? 'Sinkronkan & perbarui judul' : (t('action.regenerate') || 'Generate ulang judul')}
                aria-label={user ? 'Sinkronkan & perbarui judul' : (t('action.regenerate') || 'Generate ulang judul')}
              >
                <RefreshCw size={18} className={`text-[#FF4F00] ${syncing ? 'animate-spin' : ''}`} />
              </button>
              <button
                data-testid="select-all-header-btn"
                onClick={toggleSelectAllHeader}
                disabled={listItems.length === 0}
                className={[
                  'p-1.5 rounded-lg disabled:opacity-40 disabled:hover:bg-transparent transition-colors',
                  selectMode ? 'bg-[#FF4F00] text-white' : 'hover:bg-[#faf8f5] text-neutral-700 border border-transparent hover:border-[#e2ddd5]',
                ].join(' ')}
                title={t('btn.selectAll')}
              >
                <ListChecks size={18} />
              </button>
            </div>
          </div>
        </div>

      {/* Selection toolbar */}
      {selectMode && (
        <div
          data-testid="selection-bar"
          className="mt-1 border border-[#e2ddd5] rounded-xl p-2.5 bg-[#131313] text-white flex items-center gap-2 sticky top-[92px] z-20 shadow-md"
        >
          <div className="text-xs font-semibold px-2 py-1 bg-[#FF4F00] text-white rounded-lg" data-testid="selection-count">
            {t('action.selected').replace('{count}', selectedIds.size.toString())}
          </div>
          <div className="flex-1" />
          <button
            data-testid="bulk-move-btn"
            onClick={() => openMovePicker([...selectedIds])}
            className="p-1.5 hover:bg-neutral-800 rounded-lg text-neutral-200 transition-colors"
            aria-label={t('action.move')}
            title={t('action.move')}
          >
            <Move size={16} />
          </button>
          {currentFolderId !== 'folder-pharse' && !Array.from(selectedIds).some(id => items.find(i => i.id === id)?.type === 'phrase') && (
            <button
              data-testid="bulk-delete-btn"
              onClick={bulkDelete}
              className="p-1.5 hover:bg-neutral-800 rounded-lg text-red-400 transition-colors"
              aria-label={t('action.delete')}
              title={t('action.delete')}
            >
              <Trash2 size={16} />
            </button>
          )}
          <button
            data-testid="clear-selection-btn"
            onClick={clearSelection}
            className="p-1.5 hover:bg-neutral-800 rounded-lg text-neutral-400 hover:text-white transition-colors"
            aria-label={t('action.cancel')}
            title={t('action.cancel')}
          >
            <X size={16} />
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
          onDropOnFolder={onDropOnFolder}
          onReorder={onReorder}
          onPin={handlePin}
          onDelete={(id) => guardedDelete([id])}
          emptyLabel={searchMode ? t('empty.search') : t('empty.folder')}
          searchMode={searchMode}
          pathOf={pathOf}
          currentFolderId={currentFolderId}
          onOpenPhrase={(it) => setViewingPhraseItem(it)}
        />
      </div>

      {menuFor && (
        <ItemMenu
          title={
            menuFor.type === 'phrase'
              ? menuFor.name || 'Pharse'
              : menuFor.type === 'note'
              ? (menuFor.content || '').substring(0, 30) + ((menuFor.content || '').length > 30 ? '...' : '')
              : menuFor.type === 'file'
              ? (menuFor.content || '').split('\n').find((l) => l.trim()) || '(kosong)'
              : menuFor.name || t('picker.newFolder')
          }
          actions={menuActions(menuFor)}
          onClose={() => setMenuFor(null)}
        />
      )}

        {pickerConfig && (
          <FolderPicker
            items={items}
            initialFolderId={
              pickerConfig.restrictedRootFolderId
                ? (isPharseFolderOrSubfolder(currentFolderId) ? currentFolderId : pickerConfig.restrictedRootFolderId)
                : currentFolderId
            }
            title={pickerConfig.title}
            confirmLabel={pickerConfig.confirmLabel}
            disabledIds={pickerConfig.disabledIds}
            restrictedRootFolderId={pickerConfig.restrictedRootFolderId}
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
            syncing={syncing}
            logout={handleLogout}
            initialTab={settingsInitialTab || null}
            onClose={() => {
              setSettingsOpen(false);
            }}
            onOpenPinMenu={handleOpenPinMenu}
            onResetPinPassword={() => setPinModalMode('reset_password')}
            onExportJSON={handleExportJSON}
            onExportHTML={handleExportHTML}
            onImport={handleImport}
          />
        )}

        {pinModalMode && (
          <PinModal
            mode={pinModalMode}
            folderToUnlock={folderPendingUnlock || undefined}
            folders={items.filter((i) => i.type === 'folder' && i.id !== 'folder-catatan' && i.id !== 'folder-hello-world')}
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

        {moveKeypadConfig && (
          <MoveKeypadModal
            maxNum={moveKeypadConfig.maxNum}
            itemTitle={
              moveKeypadConfig.isBulk
                ? t('action.itemsSelected').replace('{count}', selectedIds.size.toString())
                : moveKeypadConfig.targetItem?.name
            }
            onConfirm={handleConfirmMoveKeypad}
            onClose={() => setMoveKeypadConfig(null)}
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
