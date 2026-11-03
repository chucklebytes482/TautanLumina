import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { FileSystemItem, FileSystemItemType } from '../Types';
import * as db from '../db/db';
import { useI18n } from '../lib/i18n';
import { getStoredPinHash, getStoredPinUpdatedAt, setStoredPinHash } from '../lib/pin';
import { compareAlphabetical, getBookmarkDisplayTitle, getMainDomain, extractTitleFromUrl } from '../lib/titleExtractor';
import { groupBookmarksByDomain } from '../lib/domainGrouper';

const uid = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2) + Date.now().toString(36);

export const notifyDataModified = () => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('tautanlumina:data_modified'));
  }
};

export const useFileSystem = () => {
  const { t } = useI18n();
  const [items, setItems] = useState<FileSystemItem[]>([]);
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  const isReloadingRef = useRef(false);
  const pendingReloadRef = useRef(false);

  const reload = useCallback(async () => {
    if (isReloadingRef.current) {
      pendingReloadRef.current = true;
      return;
    }
    isReloadingRef.current = true;
    try {
      let all = await db.getAllItems();
      
      let changed = false;
      // Migrasi: hapus folder-catatan dan pindahkan folder-clipkey ke root (parentId: null)
      const existingCatatan = all.find(it => it.id === 'folder-catatan');
      if (existingCatatan) {
        // Hapus semua catatan di luar clipkey yang ada di dalam folder-catatan
        const orphanCatatanChildren = all.filter(it => it.parentId === 'folder-catatan' && it.id !== 'folder-clipkey');
        if (orphanCatatanChildren.length > 0) {
          await db.deleteItems(orphanCatatanChildren.map(c => c.id));
        }
        await db.deleteItems(['folder-catatan']);
        changed = true;
      }

      // Pastikan folder permanen 'clipboard' selalu ada di root (parentId: null)
      const existingClipkey = all.find(it => it.id === 'folder-clipkey');
      if (!existingClipkey) {
        const folderClipkey: FileSystemItem = {
          id: 'folder-clipkey',
          parentId: null,
          name: 'clipboard',
          type: 'folder',
          order: 0,
          createdAt: 0,
          updatedAt: Date.now(),
        };
        await db.saveItem(folderClipkey);
        changed = true;
      } else {
        let clipkeyUpdated = false;
        if (existingClipkey.parentId !== null) {
          existingClipkey.parentId = null;
          clipkeyUpdated = true;
        }
        if (existingClipkey.name !== 'clipboard') {
          existingClipkey.name = 'clipboard';
          clipkeyUpdated = true;
        }
        if (clipkeyUpdated) {
          existingClipkey.updatedAt = Date.now();
          await db.saveItem(existingClipkey);
          changed = true;
        }
      }

      // Bersihkan & migrasikan folder-hello-world jika masih tersisa dari versi lama
      const helloWorldItem = all.find(it => it.id === 'folder-hello-world');
      if (helloWorldItem) {
        const helloChildren = all.filter(it => it.parentId === 'folder-hello-world');
        if (helloChildren.length > 0) {
          helloChildren.forEach(c => {
            c.parentId = null;
            c.updatedAt = Date.now();
          });
          await db.saveItems(helloChildren);
        }
        await db.deleteItems(['folder-hello-world']);
        changed = true;
      }

      const existingPharse = all.find(it => it.id === 'folder-pharse');
      if (!existingPharse) {
        const folderPharse: FileSystemItem = {
          id: 'folder-pharse',
          parentId: null,
          name: 'frasa',
          type: 'folder',
          order: 1,
          createdAt: 0,
          updatedAt: Date.now(),
        };
        await db.saveItem(folderPharse);
        changed = true;
      } else {
        let pharseUpdated = false;
        if (existingPharse.parentId !== null) {
          existingPharse.parentId = null;
          pharseUpdated = true;
        }
        if (existingPharse.name !== 'frasa') {
          existingPharse.name = 'frasa';
          pharseUpdated = true;
        }
        if (pharseUpdated) {
          existingPharse.updatedAt = Date.now();
          await db.saveItem(existingPharse);
          changed = true;
        }
      }

      if (changed) {
        all = await db.getAllItems();
      }

      const invalidFolders = all.filter(it => it.type === 'folder' && !it.name?.trim());
      if (invalidFolders.length > 0) {
        invalidFolders.forEach(it => {
          it.name = 'Folder';
          it.updatedAt = Date.now();
        });
        await db.saveItems(invalidFolders);
        all = await db.getAllItems();
      }

      // Clean up any soft-deleted items if present from legacy
      const softDeleted = all.filter(it => it.deletedAt);
      if (softDeleted.length > 0) {
        await db.deleteItems(softDeleted.map(it => it.id));
        all = all.filter(it => !it.deletedAt);
      }

      // Clean up orphaned items whose parent folder no longer exists
      const allFolderIds = new Set(all.filter(it => it.type === 'folder').map(it => it.id));
      const orphanedItems = all.filter(it => 
        it.parentId && 
        it.parentId !== 'folder-pharse' && 
        it.parentId !== 'folder-clipkey' &&
        !allFolderIds.has(it.parentId)
      );
      if (orphanedItems.length > 0) {
        await db.deleteItems(orphanedItems.map(it => it.id));
        all = all.filter(it => !orphanedItems.some(op => op.id === it.id));
      }

      // Ensure all phrase items' names are automatically taken from the 1st word of content
      const phraseItems = all.filter(it => it.type === 'phrase' && it.content);
      const invalidPhrases: FileSystemItem[] = [];
      phraseItems.forEach(it => {
        const firstWord = it.content!.trim().split(/\s+/)[0];
        if (firstWord && it.name !== firstWord) {
          it.name = firstWord;
          it.updatedAt = Date.now();
          invalidPhrases.push(it);
        }
      });
      if (invalidPhrases.length > 0) {
        await db.saveItems(invalidPhrases);
        all = await db.getAllItems();
      }

      // Bersihkan duplikat terutama di dalam folder pharse
      const seenContent = new Set<string>();
      const duplicateIds: string[] = [];
      all.forEach(it => {
        if (it.content && (it.type === 'phrase' || it.parentId === 'folder-pharse')) {
          const key = `${it.type}:${it.content.trim().toLowerCase()}`;
          if (seenContent.has(key)) {
            duplicateIds.push(it.id);
          } else {
            seenContent.add(key);
          }
        }
      });
      if (duplicateIds.length > 0) {
        await db.deleteItems(duplicateIds);
        all = await db.getAllItems();
      }



      // Aturan judul bookmark:
      // Di root: pengecualian karakter domain utama TIDAK BERLAKU
      // Di dalam folder: pengecualian karakter domain utama LANGSUNG BERLAKU
      const fileBookmarks = all.filter(it => it.type === 'file' && it.content);
      const sanitizedBookmarks: FileSystemItem[] = [];
      fileBookmarks.forEach(it => {
        const isInsideFolder = Boolean(it.parentId);
        const expectedTitle = extractTitleFromUrl(it.content!, isInsideFolder);
        if (it.name !== expectedTitle) {
          it.name = expectedTitle;
          it.updatedAt = Date.now();
          sanitizedBookmarks.push(it);
        }
      });
      if (sanitizedBookmarks.length > 0) {
        await db.saveItems(sanitizedBookmarks);
        all = await db.getAllItems();
      }

      // Otomatis masukkan bookmark dengan domain yang sama ke dalam folder baru dengan nama domain utamanya
      const groupRes = groupBookmarksByDomain(all, uid);
      if (groupRes.hasChanges) {
        if (groupRes.deletedFolders && groupRes.deletedFolders.length > 0) {
          await db.deleteItems(groupRes.deletedFolders);
        }
        if (groupRes.createdFolders.length > 0) {
          await db.saveItems(groupRes.createdFolders);
        }
        if (groupRes.modifiedItems.length > 0) {
          await db.saveItems(groupRes.modifiedItems);
        }
        all = groupRes.updatedAll;
      }

      setItems(all);
    } catch (e) {
      console.warn('Failed to load file system items:', e);
    } finally {
      setLoaded(true);
      isReloadingRef.current = false;
      if (pendingReloadRef.current) {
        pendingReloadRef.current = false;
        reload();
      }
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  useEffect(() => {
    const handleUserChanged = () => {
      setLoaded(false);
      reload();
    };
    window.addEventListener('tautanlumina:user_changed', handleUserChanged);
    return () => {
      window.removeEventListener('tautanlumina:user_changed', handleUserChanged);
    };
  }, [reload]);

  const getItemSortKeys = (it: FileSystemItem): { primary: string; secondary: string } => {
    if (it.type === 'file') {
      const isInsideFolder = Boolean(it.parentId);
      const display = getBookmarkDisplayTitle(it.name, it.content, isInsideFolder);
      const domain = getMainDomain(it.content || it.name);
      return {
        primary: isInsideFolder ? (display || domain) : (domain || display),
        secondary: display || it.content || '',
      };
    }
    if (it.type === 'folder') {
      const name = it.id === 'folder-catatan' ? 'Catatan' : it.id === 'folder-clipkey' ? 'clipboard' : it.id === 'folder-pharse' ? 'frasa' : it.name;
      return { primary: name, secondary: '' };
    }
    if (it.type === 'phrase') {
      return { primary: it.name || it.content || '', secondary: it.content || '' };
    }
    return { primary: it.content || it.name || '', secondary: '' };
  };

  const getItemSortTitle = (it: FileSystemItem): string => {
    return getItemSortKeys(it).primary;
  };

  const childrenOf = useCallback(
    (pid: string | null) =>
      items
        .filter((i) => i.parentId === pid)
        .sort((a, b) => {
          // 1. Folder clipboard dan frasa SELALU nomor 1 dan 2 (folder lain TIDAK boleh di atasnya)
          const sysRank = (id: string) => {
            if (id === 'folder-clipkey' || id === 'folder-catatan') return 1;
            if (id === 'folder-pharse') return 2;
            return 999;
          };
          const rankA = sysRank(a.id);
          const rankB = sysRank(b.id);
          if (rankA !== rankB) {
            return rankA - rankB;
          }

          // 2. Folder selalu di tempatkan keatas (di atas bookmark/catatan/pharse non-folder)
          if (a.type === 'folder' && b.type !== 'folder') return -1;
          if (b.type === 'folder' && a.type !== 'folder') return 1;

          // Khusus sub folder clipkey: diurutkan berdasarkan posisi/order (reorder keypad), bukan qwerty
          if (pid === 'folder-clipkey') {
            const orderA = a.order ?? 0;
            const orderB = b.order ?? 0;
            if (orderA !== orderB) {
              return orderA - orderB;
            }
            return (a.createdAt ?? 0) - (b.createdAt ?? 0);
          }

          if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;

          const keyA = getItemSortKeys(a);
          const keyB = getItemSortKeys(b);

          const primaryDiff = compareAlphabetical(keyA.primary, keyB.primary);
          if (primaryDiff !== 0) return primaryDiff;

          const secondaryDiff = compareAlphabetical(keyA.secondary, keyB.secondary);
          if (secondaryDiff !== 0) return secondaryDiff;

          const orderA = a.order ?? 0;
          const orderB = b.order ?? 0;
          if (orderA !== orderB) {
            return orderA - orderB;
          }
          return (a.createdAt ?? 0) - (b.createdAt ?? 0);
        }),
    [items],
  );

  const nextOrder = (pid: string | null) => {
    const siblings = items.filter((i) => i.parentId === pid);
    return siblings.length ? Math.max(...siblings.map((s) => typeof s.order === 'number' ? s.order : 0)) + 1 : 0;
  };

  const createItem = async (
    name: string,
    type: FileSystemItemType,
    parentId: string | null,
    content = '',
    category?: string,
  ): Promise<FileSystemItem> => {
    if (type === 'file' && !content.trim()) {
      throw new Error('URL tidak boleh kosong');
    }
    const isClipboardTarget = (targetId: string | null): boolean => {
      if (!targetId) return false;
      return targetId === 'folder-clipkey' || isDescendant('folder-clipkey', targetId);
    };

    let targetParentId = type === 'phrase'
      ? 'folder-pharse'
      : (type === 'note')
      ? (parentId && (parentId === 'folder-clipkey' || isDescendant('folder-clipkey', parentId)) ? parentId : 'folder-clipkey')
      : parentId;

    // Query direct fresh DB items to guarantee no false duplicate matches from stale state or deleted items
    const currentDbItems = await db.getAllItems();

    // Aturan anti-duplikat: tidak diizinkan duplikat di semua tempat KECUALI folder clipboard
    const isClip = isClipboardTarget(targetParentId);

    if (type === 'file' && !isClip) {
      const normContent = content.trim().replace(/\/+$/, '').toLowerCase();
      const exists = currentDbItems.some(
        it => !it.deletedAt && it.type === 'file' && !isClipboardTarget(it.parentId) && it.content?.trim().replace(/\/+$/, '').toLowerCase() === normContent
      );
      if (exists) {
        throw new Error('Tautan ini sudah ada');
      }
    }

    if (type === 'phrase') {
      const normContent = content.trim().toLowerCase();
      const exists = currentDbItems.some(it => !it.deletedAt && it.type === 'phrase' && it.content?.trim().toLowerCase() === normContent);
      if (exists) {
        throw new Error('Frasa ini sudah ada');
      }
    }

    if (type === 'folder' && !isClip) {
      const normName = name.trim().toLowerCase();
      const exists = currentDbItems.some(
        it => !it.deletedAt && it.type === 'folder' && it.parentId === targetParentId && it.name?.trim().toLowerCase() === normName
      );
      if (exists) {
        throw new Error('Folder dengan nama ini sudah ada');
      }
    }

    if (type === 'file') {
      const domain = getMainDomain(content || name);
      if (domain && domain.includes('.')) {
        const lowerDomain = domain.toLowerCase();
        const parentFolder = targetParentId ? currentDbItems.find((it) => it.id === targetParentId) : null;
        const isParentAutoDomain = parentFolder && (
          Boolean(parentFolder.autoDomain) ||
          Boolean(parentFolder.name && parentFolder.name.includes('.') && getMainDomain(parentFolder.name).toLowerCase() === parentFolder.name.trim().toLowerCase())
        );

        // Jika folder saat ini adalah folder otomatis dan domain bookmark berbeda,
        // tempatkan di luar folder (parentFolder.parentId)
        if (isParentAutoDomain && parentFolder.name?.trim().toLowerCase() !== lowerDomain) {
          targetParentId = parentFolder.parentId;
        }

        const effectiveParentFolder = targetParentId ? currentDbItems.find((it) => it.id === targetParentId) : null;
        if (effectiveParentFolder?.name?.trim().toLowerCase() !== lowerDomain) {
          // 1. Jika sudah ada folder dengan nama domain ini di targetParentId, langsung masukkan ke dalamnya
          const existingDomainFolder = currentDbItems.find(
            (it) =>
              !it.deletedAt &&
              it.type === 'folder' &&
              it.parentId === targetParentId &&
              it.name?.trim().toLowerCase() === lowerDomain
          );
          if (existingDomainFolder) {
            targetParentId = existingDomainFolder.id;
          } else {
            // 2. Jika sudah ada bookmark dengan domain yang sama di targetParentId, buat folder baru dan masukkan keduanya
            const siblingsWithSameDomain = currentDbItems.filter(
              (it) =>
                !it.deletedAt &&
                it.type === 'file' &&
                it.parentId === targetParentId &&
                getMainDomain(it.content || it.name).toLowerCase() === lowerDomain
            );
            if (siblingsWithSameDomain.length >= 3) {
              const newFolderId = uid();
              const siblings = currentDbItems.filter((it) => it.parentId === targetParentId);
              const nextFolderOrder = siblings.length
                ? Math.max(...siblings.map((s) => (typeof s.order === 'number' ? s.order : 0))) + 1
                : 0;
              const newDomainFolder: FileSystemItem = {
                id: newFolderId,
                parentId: targetParentId,
                name: lowerDomain,
                type: 'folder',
                autoDomain: true,
                order: nextFolderOrder,
                createdAt: Date.now(),
                updatedAt: Date.now(),
              };
              await db.saveItem(newDomainFolder);
              const updatedSiblings = siblingsWithSameDomain.map((sib, sIdx) => ({
                ...sib,
                parentId: newFolderId,
                order: sIdx,
                updatedAt: Date.now(),
              }));
              await db.saveItems(updatedSiblings);
              targetParentId = newFolderId;
            }
          }
        }
      }
    }

    const firstWordFromContent = (content || '').trim().split(/\s+/)[0] || '';
    const isFolder = Boolean(targetParentId);
    const itemName = type === 'note'
      ? content.trim()
      : type === 'phrase'
      ? (firstWordFromContent || 'frasa')
      : (type === 'file' ? (name.trim() || extractTitleFromUrl(content, isFolder)) : (name.trim() || (type === 'folder' ? 'Folder' : 'Untitled')));
    const item: FileSystemItem = {
      id: uid(),
      parentId: targetParentId,
      name: itemName,
      type,
      content: type === 'folder' ? undefined : content,
      category,
      order: nextOrder(targetParentId),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    await db.saveItem(item);
    await reload();
    notifyDataModified();
    return item;
  };

  const updateContent = async (id: string, content: string) => {
    const it = items.find((i) => i.id === id);
    if (!it || it.type === 'phrase') return;
    if (!content.trim()) {
      await deleteMany([id]);
      return;
    }
    await db.saveItem({ ...it, content, updatedAt: Date.now() });
    await reload();
    notifyDataModified();
  };

  const renameItem = async (id: string, name: string) => {
    if (id === 'folder-catatan' || id === 'folder-pharse' || id === 'folder-clipkey') {
      throw new Error('Tidak dapat diubah');
    }
    const it = items.find((i) => i.id === id);
    if (!it) return;
    if (it.type === 'folder' && (it.autoDomain || (it.name && it.name.includes('.') && getMainDomain(it.name) === it.name.trim().toLowerCase()))) {
      throw new Error('Folder otomatis tidak dapat diubah namanya');
    }
    if (it.type === 'phrase') {
      throw new Error('Judul pharse tidak dapat diedit');
    }
    const finalName = name.trim();
    if (!finalName && it.type === 'folder') return;
    
    if (finalName) {
      const existing = items.find((i) => i.id !== id && i.parentId === it.parentId && i.name === finalName && i.type === it.type);
      if (existing) {
        throw new Error('Nama sudah ada');
      }
    }
    await db.saveItem({ ...it, name: finalName, updatedAt: Date.now() });
    await reload();
    notifyDataModified();
  };

  const updateItem = async (id: string, updates: Partial<FileSystemItem>) => {
    let it = items.find((i) => i.id === id);
    if (!it) {
      it = await db.getItem(id);
    }
    if (!it) return;
    if (it.type === 'phrase' && updates.name !== undefined) {
      delete updates.name;
    }
    const merged = { ...it, ...updates, updatedAt: Date.now() };
    if (it.type === 'folder') {
      delete merged.label;
    } else if (updates.label !== undefined) {
      if (!updates.label || !updates.label.trim()) {
        delete merged.label;
      } else {
        merged.label = updates.label.trim();
      }
    }
    await db.saveItem(merged);
    await reload();
    notifyDataModified();
  };

  const updateMany = async (itemUpdatesList: { id: string; updates: Partial<FileSystemItem> }[]) => {
    const now = Date.now();
    const updatedItems: FileSystemItem[] = [];
    for (const { id, updates } of itemUpdatesList) {
      let it = items.find((i) => i.id === id);
      if (!it) {
        it = await db.getItem(id);
      }
      if (it) {
        updatedItems.push({ ...it, ...updates, updatedAt: now });
      }
    }
    if (updatedItems.length > 0) {
      await db.saveItems(updatedItems);
      await reload();
      notifyDataModified();
    }
  };

  const collectDescendants = (rootIds: string[]): string[] => {
    const all = new Set<string>();
    const walk = (id: string) => {
      if (all.has(id)) return;
      all.add(id);
      items.filter((i) => i.parentId === id).forEach((c) => walk(c.id));
    };
    rootIds.forEach(walk);
    return [...all];
  };

  const deleteMany = async (ids: string[]) => {
    const activeIds = ids.filter(id => {
      if (id === 'folder-catatan' || id === 'folder-pharse' || id === 'folder-clipkey') return false;
      const it = items.find(i => i.id === id);
      if (it && it.type === 'phrase') return false; // Jangan pernah izinkan pharse dihapus
      return true;
    });
    if (activeIds.length === 0) return;

    // Jika yang dihapus adalah folder di dalam area pharse (sub folder pharse),
    // pindahkan item anak di dalamnya ke root 'folder-pharse' agar isinya TIDAK ikut terhapus.
    const reassignItems: FileSystemItem[] = [];
    for (const id of activeIds) {
      const it = items.find(i => i.id === id);
      if (it && it.type === 'folder' && (it.parentId === 'folder-pharse' || isDescendant('folder-pharse', it.parentId || ''))) {
        const children = items.filter(child => child.parentId === id);
        children.forEach(child => {
          reassignItems.push({ ...child, parentId: 'folder-pharse', updatedAt: Date.now() });
        });
      }
    }

    if (reassignItems.length > 0) {
      await db.saveItems(reassignItems);
    }

    const all = collectDescendants(activeIds);
    const finalIdsToDelete = all.filter(id => {
      if (id === 'folder-catatan' || id === 'folder-pharse' || id === 'folder-clipkey') return false;
      const it = items.find(item => item.id === id);
      if (it && it.type === 'phrase') return false;
      return true;
    });

    if (finalIdsToDelete.length > 0) {
      await db.deleteItems(finalIdsToDelete);
      try {
        const stored = localStorage.getItem('tautanlumina:deleted_ids');
        const currentDeleted: string[] = stored ? JSON.parse(stored) : [];
        const updatedDeleted = Array.from(new Set([...currentDeleted, ...finalIdsToDelete]));
        localStorage.setItem('tautanlumina:deleted_ids', JSON.stringify(updatedDeleted));
      } catch (e) {}
      setItems((prev) => prev.filter((it) => !finalIdsToDelete.includes(it.id)));
    }
    await reload();
    notifyDataModified();
  };

  const clearClipboardAndPharseContents = useCallback(async () => {
    const allDbItems = await db.getAllItems();
    const isInsideFolder = (ancestorId: string, nodeId: string | null): boolean => {
      let cur = allDbItems.find((i) => i.id === nodeId);
      while (cur && cur.parentId) {
        if (cur.parentId === ancestorId) return true;
        cur = allDbItems.find((i) => i.id === cur!.parentId);
      }
      return false;
    };

    const targetIds = allDbItems
      .filter((it) => {
        // Jangan pernah menghapus folder permanen clipboard atau pharse itu sendiri
        if (it.id === 'folder-clipkey' || it.id === 'folder-pharse') return false;
        
        // Hapus semua isi di dalam folder clipboard
        const insideClipboard = it.parentId === 'folder-clipkey' || isInsideFolder('folder-clipkey', it.parentId);
        // Hapus semua isi di dalam folder pharse
        const insidePharse = it.parentId === 'folder-pharse' || isInsideFolder('folder-pharse', it.parentId);
        // Hapus item bertipe phrase
        const isPhraseType = it.type === 'phrase';

        return insideClipboard || insidePharse || isPhraseType;
      })
      .map((it) => it.id);

    if (targetIds.length > 0) {
      await db.deleteItems(targetIds);
    }

    if (
      currentFolderId === 'folder-clipkey' || 
      currentFolderId === 'folder-pharse' || 
      isInsideFolder('folder-clipkey', currentFolderId) || 
      isInsideFolder('folder-pharse', currentFolderId)
    ) {
      setCurrentFolderId(null);
    }

    await reload();
    notifyDataModified();
  }, [currentFolderId, reload]);

  const clearPharseFolder = async () => {
    const allDbItems = await db.getAllItems();
    const pharseItemIds = allDbItems
      .filter(it => it.id !== 'folder-pharse' && (it.parentId === 'folder-pharse' || isDescendant('folder-pharse', it.parentId || '')))
      .map(it => it.id);
    
    if (pharseItemIds.length > 0) {
      await db.deleteItems(pharseItemIds);
      try {
        const stored = localStorage.getItem('tautanlumina:deleted_ids');
        const currentDeleted: string[] = stored ? JSON.parse(stored) : [];
        const updatedDeleted = Array.from(new Set([...currentDeleted, ...pharseItemIds]));
        localStorage.setItem('tautanlumina:deleted_ids', JSON.stringify(updatedDeleted));
      } catch (e) {}
    }
    await reload();
    notifyDataModified();
  };

  const isDescendant = (ancestorId: string, nodeId: string): boolean => {
    let cur = items.find((i) => i.id === nodeId);
    while (cur && cur.parentId) {
      if (cur.parentId === ancestorId) return true;
      cur = items.find((i) => i.id === cur!.parentId);
    }
    return false;
  };

  const isPharseFolder = (folderId: string | null): boolean => {
    if (!folderId) return false;
    if (folderId === 'folder-pharse') return true;
    return isDescendant('folder-pharse', folderId);
  };

  const isNoteFolder = (folderId: string | null): boolean => {
    if (!folderId) return false;
    if (folderId === 'folder-clipkey') return true;
    return isDescendant('folder-clipkey', folderId);
  };

  const isPharseItem = (it: FileSystemItem): boolean => {
    return it.type === 'phrase' || isPharseFolder(it.parentId);
  };

  const isNoteItem = (it: FileSystemItem): boolean => {
    return it.type === 'note' || isNoteFolder(it.parentId);
  };

  const getRootAncestorFolderId = (folderId: string): string | null => {
    let cur = items.find((i) => i.id === folderId);
    if (!cur || !cur.parentId) return null;
    while (cur && cur.parentId) {
      const parent = items.find((i) => i.id === cur!.parentId);
      if (!parent) return cur.parentId;
      if (!parent.parentId) return parent.id;
      cur = parent;
    }
    return cur ? cur.id : null;
  };

  const moveMany = async (ids: string[], targetParentId: string | null) => {
    const isTargetPharse = isPharseFolder(targetParentId);
    const isTargetNote = isNoteFolder(targetParentId);

    const validIds = ids.filter((id) => {
      if (id === targetParentId) return false;
      if (id === 'folder-catatan' || id === 'folder-pharse' || id === 'folder-clipkey') return false;
      const it = items.find((i) => i.id === id);
      if (!it) return false;
      if (it.type === 'folder' && targetParentId && isDescendant(id, targetParentId)) return false;

      // Aturan: folder di root tidak dapat dipindahkan, dan sub folder tidak dapat dipindahkan ke luar folder utama
      if (it.type === 'folder') {
        const rootAnc = getRootAncestorFolderId(it.id);
        if (!rootAnc) {
          // Folder di root tidak dapat dipindahkan
          return false;
        }
        // Sub folder hanya bisa dipindahkan ke dalam rootAnc atau sub folder di bawah rootAnc
        const isInsideMainFolder = targetParentId === rootAnc || (targetParentId ? isDescendant(rootAnc, targetParentId) : false);
        if (!isInsideMainFolder) {
          return false;
        }
      }

      const isPharseContent = isPharseItem(it);
      const isNoteContent = isNoteItem(it);

      if (isPharseContent) {
        // Konten folder pharse hanya dapat dipindahkan di dalam folder pharse
        return isTargetPharse;
      } else if (isNoteContent) {
        // Konten folder note hanya dapat dipindahkan di dalam folder note
        return isTargetNote;
      } else {
        // Konten di luar pharse dan note tidak dapat dipindahkan ke folder pharse atau note
        return !isTargetPharse && !isTargetNote;
      }
    });

    if (ids.length > 0 && validIds.length === 0) {
      const isSubFolderViolation = ids.some((id) => {
        const it = items.find((i) => i.id === id);
        if (it && it.type === 'folder') {
          const rootAnc = getRootAncestorFolderId(it.id);
          if (!rootAnc) return true; // folder di root
          const isInside = targetParentId === rootAnc || (targetParentId ? isDescendant(rootAnc, targetParentId) : false);
          return !isInside;
        }
        return false;
      });

      if (isSubFolderViolation) {
        throw new Error('Sub folder tidak dapat dipindahkan ke luar folder utama');
      }

      const isAnyPharse = ids.some((id) => {
        const it = items.find((i) => i.id === id);
        return it && isPharseItem(it);
      });
      const isAnyNote = ids.some((id) => {
        const it = items.find((i) => i.id === id);
        return it && isNoteItem(it);
      });

      if (isAnyPharse && !isTargetPharse) {
        throw new Error('Konten folder pharse tidak dapat dipindahkan ke luar folder pharse');
      }
      if (isAnyNote && !isTargetNote) {
        throw new Error('Konten folder note tidak dapat dipindahkan ke luar folder note');
      }
      if (!isAnyPharse && !isAnyNote && isTargetPharse) {
        throw new Error('Konten di luar folder pharse tidak dapat dipindahkan ke folder pharse');
      }
      if (!isAnyPharse && !isAnyNote && isTargetNote) {
        throw new Error('Konten di luar folder note tidak dapat dipindahkan ke folder note');
      }
      throw new Error('Item tidak dapat dipindahkan ke folder tujuan');
    }
    const targetFolder = targetParentId ? items.find((i) => i.id === targetParentId) : null;
    const isTargetAutoDomain = targetFolder?.type === 'folder' && (
      Boolean(targetFolder.autoDomain) ||
      Boolean(targetFolder.name && targetFolder.name.includes('.') && getMainDomain(targetFolder.name).toLowerCase() === targetFolder.name.trim().toLowerCase())
    );
    const targetAutoDomainName = isTargetAutoDomain ? (getMainDomain(targetFolder!.name).toLowerCase() || targetFolder!.name.trim().toLowerCase()) : null;

    const targetSiblings = items.filter((i) => i.parentId === targetParentId);
    let base = targetSiblings.length ? Math.max(...targetSiblings.map((s) => s.order ?? 0)) + 1 : 0;
    const updated: FileSystemItem[] = [];
    validIds.forEach((id) => {
      const it = items.find((i) => i.id === id);
      if (!it) return;

      let finalParent = targetParentId;
      // "folder yang dibuat otomatis tidak boleh memiliki bookmark dengan domain yang berbeda,
      // jika terjadi maka akan di tempatkan di luar folder."
      if (it.type === 'file' && isTargetAutoDomain && targetAutoDomainName) {
        const itemDomain = getMainDomain(it.content || it.name).trim().toLowerCase();
        if (itemDomain && itemDomain !== targetAutoDomainName) {
          finalParent = targetFolder!.parentId; // di tempatkan di luar folder
        }
      }

      let finalName = it.name;
      if (it.type === 'file' && it.content) {
        finalName = extractTitleFromUrl(it.content, Boolean(finalParent));
      }

      updated.push({ ...it, name: finalName, parentId: finalParent, order: base++, updatedAt: Date.now() });
    });
    if (updated.length) {
      await db.saveItems(updated);
      await reload();
      notifyDataModified();
    }
  };

  const copyMany = async (ids: string[], targetParentId: string | null) => {
    const isTargetPharse = isPharseFolder(targetParentId);
    const isTargetNote = isNoteFolder(targetParentId);

    const validIds = ids.filter((id) => {
      const it = items.find((i) => i.id === id);
      if (!it) return false;
      const isPharseContent = isPharseItem(it);
      const isNoteContent = isNoteItem(it);

      if (isPharseContent) {
        return isTargetPharse;
      } else if (isNoteContent) {
        return isTargetNote;
      } else {
        return !isTargetPharse && !isTargetNote;
      }
    });

    if (validIds.length === 0) return;

    const all = collectDescendants(validIds);
    const map: Record<string, string> = {};
    const now = Date.now();
    const targetSiblings = items.filter((i) => i.parentId === targetParentId);
    let base = targetSiblings.length ? Math.max(...targetSiblings.map((s) => s.order ?? 0)) + 1 : 0;

    all.forEach((id) => (map[id] = uid()));

    const copies: FileSystemItem[] = all.map((id) => {
      const it = items.find((i) => i.id === id)!;
      const isRoot = ids.includes(id);
      return {
        ...it,
        id: map[id],
        parentId: isRoot ? targetParentId : map[it.parentId!] ?? targetParentId,
        order: isRoot ? base++ : it.order,
        createdAt: now,
        updatedAt: now,
      };
    });
    await db.saveItems(copies);
    await reload();
    notifyDataModified();
  };

  const duplicateItem = async (id: string) => {
    const it = items.find((i) => i.id === id);
    if (!it) return;
    await copyMany([id], it.parentId);
  };

  const reorderInParent = async (parentId: string | null, orderedIds: string[]) => {
    let finalIds = [...orderedIds];
    if (parentId === null) {
      const systemIds = ['folder-clipkey', 'folder-pharse'];
      const nonSystem = finalIds.filter((id) => !systemIds.includes(id));
      finalIds = [...systemIds, ...nonSystem];
    }
    const updated: FileSystemItem[] = [];
    finalIds.forEach((id, idx) => {
      const it = items.find((i) => i.id === id);
      if (it && it.parentId === parentId) {
        updated.push({ ...it, order: idx, updatedAt: Date.now() });
      }
    });
    if (updated.length) {
      await db.saveItems(updated);
      await reload();
      notifyDataModified();
    }
  };

  const getBreadcrumbs = useCallback((): FileSystemItem[] => {
    const crumbs: FileSystemItem[] = [];
    let cur = items.find((i) => i.id === currentFolderId);
    while (cur) {
      crumbs.unshift(cur);
      cur = items.find((i) => i.id === cur!.parentId);
    }
    return crumbs;
  }, [items, currentFolderId]);

  const currentItems = useMemo(() => {
    return childrenOf(currentFolderId);
  }, [childrenOf, currentFolderId]);

  const searchItems = useCallback(
    (q: string): FileSystemItem[] => {
      const query = q.trim().toLowerCase();
      if (!query) return [];
      return items
        .filter((i) => {
          if (i.name.toLowerCase().includes(query)) return true;
          if (i.label && i.label.toLowerCase().includes(query)) return true;
          if (i.type === 'file' && i.content && i.content.toLowerCase().includes(query)) return true;
          if (i.type === 'note' && i.content && i.content.toLowerCase().includes(query)) return true;
          return false;
        })
        .sort((a, b) => {
          // 1. Folder clipboard dan frasa SELALU nomor 1 dan 2
          const sysRank = (id: string) => {
            if (id === 'folder-clipkey' || id === 'folder-catatan') return 1;
            if (id === 'folder-pharse') return 2;
            return 999;
          };
          const rankA = sysRank(a.id);
          const rankB = sysRank(b.id);
          if (rankA !== rankB) {
            return rankA - rankB;
          }

          // 2. Folder selalu di tempatkan keatas
          if (a.type === 'folder' && b.type !== 'folder') return -1;
          if (b.type === 'folder' && a.type !== 'folder') return 1;

          const keyA = getItemSortKeys(a);
          const keyB = getItemSortKeys(b);
          const primaryDiff = compareAlphabetical(keyA.primary, keyB.primary);
          if (primaryDiff !== 0) return primaryDiff;
          const secondaryDiff = compareAlphabetical(keyA.secondary, keyB.secondary);
          if (secondaryDiff !== 0) return secondaryDiff;
          return a.name.localeCompare(b.name);
        });
    },
    [items],
  );

  const pathOf = useCallback(
    (id: string | null): string => {
      if (!id) return '/';
      const parts: string[] = [];
      let cur = items.find((i) => i.id === id);
      while (cur) {
        const name = cur.id === 'folder-clipkey' ? 'clipboard' : cur.id === 'folder-pharse' ? 'frasa' : cur.name;
        parts.unshift(name);
        cur = items.find((i) => i.id === cur!.parentId);
      }
      return '/' + parts.join('/');
    },
    [items],
  );

  const exportJSON = () => {
    const aiKey = localStorage.getItem('tautanlumina:ai-key') || '';
    const aiModel = localStorage.getItem('tautanlumina:ai-model') || '';
    const pinHash = getStoredPinHash();
    const pinUpdatedAt = getStoredPinUpdatedAt();
    const cleanItems = items.filter(it => it.id !== 'folder-hello-world');
    return JSON.stringify({ 
      app: 'tautanlumina', 
      version: 1, 
      items: cleanItems, 
      apiKey: aiKey, 
      model: aiModel,
      pinHash,
      pinUpdatedAt
    }, null, 2);
  };

  const importJSON = async (
    json: string, 
    replace: boolean = true, 
    targetParentId?: string | null,
    isSyncPull: boolean = false
  ) => {
    const data = JSON.parse(json);
    const incoming: FileSystemItem[] = Array.isArray(data) ? data : data.items || [];
    
    if (data.apiKey) {
      if (replace || !localStorage.getItem('tautanlumina:ai-key')) {
        localStorage.setItem('tautanlumina:ai-key', data.apiKey);
      }
    }
    if (data.model) {
      if (replace || !localStorage.getItem('tautanlumina:ai-model')) {
        localStorage.setItem('tautanlumina:ai-model', data.model);
      }
    }
    if (typeof data.pinHash === 'string') {
      if (replace || !getStoredPinHash()) {
        setStoredPinHash(data.pinHash, data.pinUpdatedAt || Date.now());
      }
    }

    // Pemulihan cadangan menempatkan item persis pada posisi aslinya
    await importItems(incoming, replace, targetParentId);
    if (!isSyncPull) {
      notifyDataModified();
    }
  };

  const importItems = async (incoming: FileSystemItem[], replace: boolean = true, targetParentId?: string | null) => {
    // Bersihkan folder-hello-world & folder-catatan jika terbawa dari file cadangan lama
    const sanitizedIncoming = incoming
      .filter((it) => it.id !== 'folder-hello-world' && it.id !== 'folder-catatan')
      .map((it) => {
        if (it.parentId === 'folder-hello-world') {
          return { ...it, parentId: null };
        }
        if (it.parentId === 'folder-catatan') {
          return { ...it, parentId: it.type === 'note' ? 'folder-clipkey' : null };
        }
        if (it.id === 'folder-clipkey') {
          return { ...it, parentId: null, name: 'clipboard' };
        }
        return it;
      });

    if (replace) {
      await db.clearItems();
      await db.saveItems(sanitizedIncoming);
    } else {
      const nonSystemIncoming = sanitizedIncoming.filter((it) => it.id !== 'folder-pharse' && it.id !== 'folder-clipkey');
      const currentDb = await db.getAllItems();
      const currentIds = new Set(currentDb.map(it => it.id));

      const map: Record<string, string> = {};
      nonSystemIncoming.forEach((it) => {
        if (currentIds.has(it.id)) {
          map[it.id] = uid();
        } else {
          map[it.id] = it.id;
        }
      });

      const remapped = nonSystemIncoming.map((it) => {
        const hasParentInIncoming = it.parentId && map[it.parentId];
        return {
          ...it,
          id: map[it.id],
          parentId: hasParentInIncoming ? map[it.parentId!] : (it.parentId ?? targetParentId ?? null),
        };
      });
      await db.saveItems(remapped);
    }
    await reload();
  };

  const clearAll = useCallback(async () => {
    await db.clearAll();
    setItems([]);
    setCurrentFolderId(null);
    try {
      localStorage.removeItem('tautanlumina:deleted_ids');
    } catch (e) {}
    await reload();
    notifyDataModified();
  }, [reload]);

  const purgeChangeHistory = useCallback(async () => {
    try {
      localStorage.removeItem('tautanlumina:deleted_ids');
      const all = await db.getAllItems();
      const toDeleteIds: string[] = [];
      const validFolderIds = new Set(all.filter((it) => it.type === 'folder').map((it) => it.id));
      all.forEach((it) => {
        if (it.deletedAt) {
          toDeleteIds.push(it.id);
        } else if (
          it.parentId &&
          it.parentId !== 'folder-pharse' &&
          it.parentId !== 'folder-clipkey' &&
          !validFolderIds.has(it.parentId)
        ) {
          toDeleteIds.push(it.id);
        }
      });
      if (toDeleteIds.length > 0) {
        await db.deleteItems(toDeleteIds);
      }
      await reload();
      return true;
    } catch {
      return false;
    }
  }, [reload]);

  return {
    items,
    loaded,
    currentItems,
    currentFolderId,
    setCurrentFolderId,
    childrenOf,
    createItem,
    updateContent,
    renameItem,
    updateItem,
    updateMany,
    deleteMany,
    moveMany,
    copyMany,
    duplicateItem,
    reorderInParent,
    getBreadcrumbs,
    searchItems,
    pathOf,
    exportJSON,
    importJSON,
    importItems,
    isDescendant,
    isPharseFolder,
    isNoteFolder,
    clearAll,
    clearPharseFolder,
    clearClipboardAndPharseContents,
    purgeChangeHistory,
  };
};
