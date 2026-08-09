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
  Languages,
  Aperture,
  FileText
} from 'lucide-react';
import { AppLogo } from './components/AppLogo';

import { FileBrowser } from './components/FileBrowser';
import { ItemMenu, MenuAction } from './components/ItemMenu';
import { LoginScreen } from './components/LoginScreen';
import { LanguageCard, LanguageDropdown } from './components/LanguageSelectorModal';
import { useDialog } from './context/DialogContext';

import { useFileSystem } from './hooks/useFileSystem';
import { useAppwriteSync } from './hooks/useAppwriteSync';
import { useI18n, languages } from './lib/i18n';
import { ADMIN_EMAIL } from './lib/appwrite';

import { FileSystemItem } from './Types';
import { loadKey, loadModel, loadEndpoint, generateBookmarkData } from './lib/ai';
import { hasPinSet, removePin, usePinState } from './lib/pin';
import { isNetscapeBookmarkHTML } from './lib/bookmarkParser';

import { FolderPicker } from './components/FolderPicker';
import { SettingsDialog } from './components/SettingsDialog';
import { PinModal } from './components/PinModal';
import { MoveKeypadModal } from './components/MoveKeypadModal';
import { EditBookmarkModal } from './components/EditBookmarkModal';
import { FullscreenChatModal } from './components/FullscreenChatModal';
import { FullscreenGuideModal } from './components/FullscreenGuideModal';

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
    importJSON,
    importHTML,
    importItems,
    clearAll,
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
        onConfirm: (folderId: string | null) => Promise<void> | void;
      }
  >(null);

  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsInitialTab, setSettingsInitialTab] = useState<'api' | 'wallet' | 'profile' | 'sync' | null>(null);
  const [showLanguageMenu, setShowLanguageMenu] = useState(false);
  const [showChatPopup, setShowChatPopup] = useState(false);
  const [showGuideModal, setShowGuideModal] = useState(false);
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

  // Edit Bookmark modal state
  const [editingBookmarkItem, setEditingBookmarkItem] = useState<FileSystemItem | null>(null);

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

    const activeAncestors = new Set<string>();
    if (id) {
      let cur = items.find((i) => i.id === id);
      while (cur) {
        activeAncestors.add(cur.id);
        cur = items.find((i) => i.id === cur.parentId);
      }
    }

    setUnlockedFolderIds((prev) => {
      const next = new Set<string>();
      prev.forEach((folderId) => {
        if (activeAncestors.has(folderId)) {
          next.add(folderId);
        }
      });
      return next;
    });

    setCurrentFolderId(id);
    setQuery('');
    setSelectedIds(new Set());
  };

  const handleToggleFolderLock = async (folderId: string, skipPinCheck?: boolean) => {
    if (guardOffline()) return;
    const f = items.find((i) => i.id === folderId);
    if (!f) return;

    if (folderId === 'folder-catatan' || folderId === 'folder-hello-world') {
      showToast(t('toast.folderSystemCannotLock'));
      return;
    }

    if (!hasPinSet()) {
      showToast(t('settings.pinNotSet') || 'PIN belum diatur. Silakan atur PIN di Pengaturan');
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
          showToast(t('toast.proLimitFolderLock') || 'Akun Free dibatasi maksimal 1 folder terkunci. Tingkatkan ke Pro untuk kunci folder tanpa batas.');
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
      showToast(t('toast.folderLocked') + ` "${f.name}"`);
    } else {
      setUnlockedFolderIds((prev) => {
        const next = new Set(prev);
        next.add(folderId);
        return next;
      });
      showToast(t('toast.folderUnlocked') + ` "${f.name}"`);
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
    const url = await customPrompt(t('modal.bookmarkUrl'));
    if (!url || !url.trim()) return;
    
    const finalUrl = url.trim().startsWith('http') ? url.trim() : `https://${url.trim()}`;
    
    let domain = t('file.bookmark') || 'Bookmark';
    try {
      domain = new URL(finalUrl).hostname;
    } catch {}

    try {
      const newItem = await createItem(domain, 'file', currentFolderId, finalUrl);
      showToast(t('toast.bookmarkSaved'));

      // Background AI generation
      (async () => {
        try {
          const apiKey = loadKey();
          const model = loadModel();
          const endpoint = loadEndpoint();

          if (!apiKey) {
            sonnerToast.info(t('ai.noKeyNotice') || 'Bookmark disimpan. (Atur API Key AI di Pengaturan untuk penamaan otomatis)', { duration: 3500 });
            return;
          }

          const { title, error } = await generateBookmarkData(
            apiKey,
            model,
            endpoint,
            finalUrl,
            t('ai.bookmarkPrompt'),
            domain
          );

          if (error) {
            sonnerToast.error(`Status AI: ${error}`, { duration: 4500 });
          } else if (title) {
            await updateItem(newItem.id, { name: title });
            sonnerToast.success(`AI Title: "${title}"`, { duration: 2500 });
          }
        } catch (err: any) {
          sonnerToast.error(`Status AI: ${err?.message || 'Error AI'}`, { duration: 4500 });
        }
      })();
    } catch (e: any) {
      showToast(e?.message || t('toast.bookmarkSaveFailed'));
    }
  };

  const handleNewNote = async () => {
    if (guardOffline()) return;
    const text = await customPrompt(t('modal.noteText'), '', { textarea: true, maxWidth: 'max-w-xl' });
    if (!text || !text.trim()) return;
    
    const targetFolder = currentFolderId || 'folder-catatan';
    await createItem('', 'note', targetFolder, text.trim());
    showToast(t('toast.noteSaved'));
  };

  const toggleSelectAllHeader = () => {
    if (listItems.length === 0) return;
    
    const selectableItems = listItems.filter((item) => {
      const isSystem = item.id === 'folder-catatan' || item.id === 'folder-hello-world';
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
    return disabled;
  };

  const openMovePicker = (ids: string[]) => {
    if (guardOffline()) return;
    setPickerConfig({
      title: t('action.moveItems').replace('{count}', ids.length.toString()),
      confirmLabel: t('action.move'),
      disabledIds: disabledFolderIds(ids),
      onConfirm: async (target) => {
        await moveMany(ids, target);
        clearSelection();
        showToast(t('toast.moved'));
      },
    });
  };

  const guardedDelete = async (
    ids: string[],
    opts?: { title?: string; afterDelete?: () => void },
  ) => {
    if (guardOffline()) return;
    const filteredIds = ids.filter(id => id !== 'folder-catatan' && id !== 'folder-hello-world');
    if (filteredIds.length < ids.length && ids.length === 1) {
      showToast(t('toast.folderSystemCannotDelete'));
      return;
    }
    if (filteredIds.length === 0) return;

    const lockedItems = filteredIds.filter(id => {
      const item = items.find(i => i.id === id);
      return item && isItemLocked(item);
    });
    
    if (lockedItems.length > 0) {
      showToast(t('toast.lockedItem'));
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
      showToast(t('toast.deleted'));
      afterDelete?.();
    };

    if (await customConfirm(title)) {
      performDelete();
    }
  };

  const bulkDelete = () => {
    const ids = [...selectedIds];
    guardedDelete(ids);
  };

  const handleConfirmMoveKeypad = async (targetNum: number) => {
    if (!moveKeypadConfig) return;
    if (guardOffline()) return;
    const targetIdx = targetNum - 1;
    const { targetItem } = moveKeypadConfig;
    setMoveKeypadConfig(null);

    if (targetItem) {
      const currentIndex = listItems.findIndex((i) => i.id === targetItem.id);
      if (currentIndex !== -1) {
        const currentIds = listItems.map((i) => i.id);
        const newIds = [...currentIds];
        newIds.splice(currentIndex, 1);
        newIds.splice(targetIdx, 0, targetItem.id);
        await reorderInParent(targetItem.parentId, newIds);
        showToast(t('toast.moved') || 'Dipindahkan');
      }
    }
  };

  const handleExport = () => {
    const data = exportJSON();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'tautan-lumina.json';
    a.click();
    URL.revokeObjectURL(url);
    showToast(t('settings.export.success') || 'Exported successfully');
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
        showToast(t('settings.import.tooLarge') || 'File too large (Max 10MB)');
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
            showToast(t('toast.importBookmarksSuccess').replace('{count}', count.toString()));
          } else {
            await importJSON(content, false, targetFolder);
            showToast(t('settings.import.success') || 'Imported successfully');
          }
        } catch (err: any) {
          showToast(err?.message || t('toast.invalidFileFormat'));
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
    const isProOrAdmin = user?.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase() || user?.prefs?.proStatus === 'pro';
    if (!isProOrAdmin) {
      const todayStr = new Date().toISOString().split('T')[0];
      const countKey = `tautanlumina:regenerate_count_${todayStr}`;
      const currentCount = parseInt(localStorage.getItem(countKey) || '0', 10);
      if (currentCount >= 2) {
        sonnerToast.error(t('toast.proLimitRegenerate') || 'Batas 2x generate ulang per hari untuk akun Free tercapai. Tingkatkan ke Pro untuk tanpa batas.');
        return;
      }
    }

    const targetFolder = items.find((i) => i.id === folderId);
    if (targetFolder && isNoteFolderOrSubfolder(targetFolder)) {
      sonnerToast.info(t('toast.noBookmarksInFolder') || 'Tidak ada bookmark di folder ini');
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
      sonnerToast.info(t('toast.noBookmarksInFolder') || 'Tidak ada bookmark di folder ini');
      return;
    }

    const folderName = targetFolder?.name || 'folder ini';
    const confirmMessage = `Generate ulang judul AI untuk ${folderBookmarks.length} bookmark di "${folderName}"?`;
    const confirmed = await customConfirm(confirmMessage);
    if (!confirmed) return;

    const toastId = sonnerToast.loading(t('toast.regenerating') || 'Regenerasi judul bookmark dengan AI...');
    try {
      const apiKey = loadKey();
      const model = loadModel();
      const endpoint = loadEndpoint();

      if (!apiKey) {
        sonnerToast.error('Gagal: API Key AI belum diisi di Pengaturan.', { id: toastId, duration: 4000 });
        return;
      }
      if (!model) {
        sonnerToast.error('Gagal: Model AI belum dipilih di Pengaturan.', { id: toastId, duration: 4000 });
        return;
      }

      let firstAiError: string | null = null;
      let successCount = 0;
      let failCount = 0;

      const updates: { id: string; updates: Partial<FileSystemItem> }[] = [];

      const BATCH_SIZE = 4;
      for (let i = 0; i < folderBookmarks.length; i += BATCH_SIZE) {
        const batch = folderBookmarks.slice(i, i + BATCH_SIZE);
        await Promise.all(
          batch.map(async (bm) => {
            const url = bm.content?.trim() || bm.name;
            const finalUrl = url.startsWith('http') ? url : `https://${url}`;
            let fallbackDomain = t('file.bookmark') || 'Bookmark';
            try {
              fallbackDomain = new URL(finalUrl).hostname;
            } catch {}

            try {
              const { title, error } = await generateBookmarkData(
                apiKey,
                model,
                endpoint,
                finalUrl,
                t('ai.bookmarkPrompt'),
                fallbackDomain
              );
              if (error) {
                if (!firstAiError) firstAiError = error;
                failCount++;
                updates.push({
                  id: bm.id,
                  updates: { name: fallbackDomain },
                });
              } else {
                successCount++;
                updates.push({
                  id: bm.id,
                  updates: { name: title || fallbackDomain },
                });
              }
            } catch (err: any) {
              if (!firstAiError) firstAiError = err?.message || 'Error AI';
              failCount++;
              updates.push({
                id: bm.id,
                updates: { name: fallbackDomain },
              });
            }
          })
        );
      }

      if (updates.length > 0) {
        await updateMany(updates);
      }

      if (!isProOrAdmin) {
        const todayStr = new Date().toISOString().split('T')[0];
        const countKey = `tautanlumina:regenerate_count_${todayStr}`;
        const currentCount = parseInt(localStorage.getItem(countKey) || '0', 10);
        localStorage.setItem(countKey, (currentCount + 1).toString());
      }

      if (firstAiError && successCount === 0) {
        sonnerToast.error(`Gagal AI: ${firstAiError}`, { id: toastId, duration: 5000 });
      } else if (firstAiError) {
        sonnerToast.warning(`Selesai (${successCount} sukses, ${failCount} gagal): ${firstAiError}`, { id: toastId, duration: 4500 });
      } else {
        sonnerToast.success(t('toast.regenerated') || 'Judul berhasil diperbarui!', { id: toastId, duration: 2500 });
      }
    } catch (e: any) {
      sonnerToast.error(`Gagal: ${e?.message || t('toast.syncError')}`, { id: toastId, duration: 4000 });
    }
  };

  const openItemMenu = (item: FileSystemItem) => {
    setMenuFor(item);
  };

  const menuActions = (item: FileSystemItem): MenuAction[] => {
    const list: MenuAction[] = [];

    list.push({
      key: 'reorder',
      label: t('action.moveToNum'),
      onClick: () => {
        if (searchMode) {
          showToast(t('toast.cantMoveSearch'));
          return;
        }
        setMoveKeypadConfig({
          targetItem: item,
          isBulk: false,
          maxNum: listItems.length,
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
          }
        },
      });

      if (!isNoteFolderOrSubfolder(item)) {
        list.push({
          key: 'regenerate',
          label: t('action.regenerate') || 'Generate ulang judul',
          onClick: () => handleRegenerateFolder(item.id),
        });
      }
    }
    if (item.type === 'file') {
      list.push({
        key: 'editTitle',
        label: t('action.editTitle') || 'Edit Judul & URL',
        onClick: () => {
          if (guardOffline()) return;
          setEditingBookmarkItem(item);
        },
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
            showToast(t('toast.noteSaved'));
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
            onClick={() => setSettingsOpen(true)}
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
          <div className="relative">
            <button 
              className="flex items-center gap-1.5 text-neutral-800 hover:bg-[#faf8f5] p-2 rounded-full transition-all border border-transparent hover:border-[#e2ddd5] cursor-pointer"
              onClick={() => {
                setShowLanguageMenu(!showLanguageMenu);
              }}
              title={t('lang.title') || 'Bahasa'}
              aria-label={t('lang.title') || 'Bahasa'}
            >
              <Languages size={20} className="text-[#FF4F00]" />
              <span className="text-xs font-extrabold uppercase">{languages.find(l => l.code === lang)?.flag} {lang.toUpperCase()}</span>
            </button>
            <LanguageDropdown isOpen={showLanguageMenu} onClose={() => setShowLanguageMenu(false)} align="right">
              <LanguageCard
                currentLang={lang}
                onSelectLang={(code) => {
                  setLang(code);
                  setShowLanguageMenu(false);
                }}
              />
            </LanguageDropdown>
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
                className="p-2.5 bg-[#FF4F00] hover:bg-[#E04500] text-white border border-[#FF4F00] rounded-xl transition-all font-semibold shadow-xs flex items-center justify-center shrink-0 flex-1 sm:flex-initial flex items-center justify-center"
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

            <div className="flex items-center gap-2">
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
          <button
            data-testid="bulk-delete-btn"
            onClick={bulkDelete}
            className="p-1.5 hover:bg-neutral-800 rounded-lg text-red-400 transition-colors"
            aria-label={t('action.delete')}
            title={t('action.delete')}
          >
            <Trash2 size={16} />
          </button>
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
        />
      </div>

      {menuFor && (
        <ItemMenu
          title={
            menuFor.type === 'note'
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
            syncing={syncing}
            logout={handleLogout}
            initialTab={settingsInitialTab || null}
            onClose={() => {
              setSettingsOpen(false);
            }}
            onOpenPinMenu={handleOpenPinMenu}
            onResetPinPassword={() => setPinModalMode('reset_password')}
            onExport={handleExport}
            onImport={handleImport}
            onOpenGuide={() => setShowGuideModal(true)}
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
                showToast(t('toast.folderOpened').replace('{name}', folderPendingUnlock.name));
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

        <FullscreenGuideModal
          isOpen={showGuideModal}
          onClose={() => setShowGuideModal(false)}
        />

        {editingBookmarkItem && (
          <EditBookmarkModal
            item={editingBookmarkItem}
            onClose={() => setEditingBookmarkItem(null)}
            onSave={async (id, name, url) => {
              if (guardOffline()) return;
              await updateItem(id, { name, content: url });
              showToast(t('toast.bookmarkSaved') || 'Bookmark berhasil disimpan');
            }}
          />
        )}
      </main>
    </div>
  );
}
