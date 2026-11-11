import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { FileSystemItem, FileSystemItemType } from '../Types';
import * as db from '../db/db';
import { getStoredPinHash, getStoredPinUpdatedAt, setStoredPinHash } from '../lib/pin';
import { compareAlphabetical } from '../lib/titleExtractor';

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

      // Purge: Hapus semua data bookmark (type === 'file'), folder otomatis domain, folder-clipkey, dan semua catatan/clipboard (type === 'note')
      const itemsToPurge = all.filter(
        it => (it as any).type === 'file' ||
              (it as any).type === 'note' ||
              (it as any).autoDomain === true ||
              it.id === 'folder-clipkey' ||
              it.id === 'folder-catatan' ||
              it.id === 'folder-hello-world'
      );
      if (itemsToPurge.length > 0) {
        const purgeIds = itemsToPurge.map(it => it.id);
        await db.deleteItems(purgeIds);
        try {
          const stored = localStorage.getItem('tautanlumina:deleted_ids');
          const currentDeleted: string[] = stored ? JSON.parse(stored) : [];
          const updatedDeleted = Array.from(new Set([...currentDeleted, ...purgeIds]));
          localStorage.setItem('tautanlumina:deleted_ids', JSON.stringify(updatedDeleted));
        } catch (e) {}
        all = all.filter(it => !purgeIds.includes(it.id));
        changed = true;
        notifyDataModified();
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

      // Hapus folder frasa ('folder-pharse') dan pindahkan semua isinya ke root (parentId: null)
      const existingPharse = all.find(it => it.id === 'folder-pharse');
      if (existingPharse) {
        const pharseChildren = all.filter(it => it.parentId === 'folder-pharse');
        if (pharseChildren.length > 0) {
          pharseChildren.forEach(c => {
            c.parentId = null;
            c.updatedAt = Date.now();
          });
          await db.saveItems(pharseChildren);
        }
        await db.deleteItems(['folder-pharse']);
        try {
          const stored = localStorage.getItem('tautanlumina:deleted_ids');
          const currentDeleted: string[] = stored ? JSON.parse(stored) : [];
          const updatedDeleted = Array.from(new Set([...currentDeleted, 'folder-pharse']));
          localStorage.setItem('tautanlumina:deleted_ids', JSON.stringify(updatedDeleted));
        } catch (e) {}
        all = all.filter(it => it.id !== 'folder-pharse');
        changed = true;
        notifyDataModified();
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
        !allFolderIds.has(it.parentId)
      );
      if (orphanedItems.length > 0) {
        await db.deleteItems(orphanedItems.map(it => it.id));
        all = all.filter(it => !orphanedItems.some(op => op.id === it.id));
      }

      // Ensure all phrase items' names are automatically taken from wallet address if set, otherwise 1st word of content
      const phraseItems = all.filter(it => it.type === 'phrase' && it.content);
      const invalidPhrases: FileSystemItem[] = [];
      phraseItems.forEach(it => {
        const walletAddress = it.label ? it.label.trim() : '';
        const firstWord = it.content!.trim().split(/\s+/)[0] || 'frasa';
        const expectedName = walletAddress || firstWord;
        if (it.name !== expectedName) {
          it.name = expectedName;
          it.updatedAt = Date.now();
          invalidPhrases.push(it);
        }
      });
      if (invalidPhrases.length > 0) {
        await db.saveItems(invalidPhrases);
        all = await db.getAllItems();
      }

      // Bersihkan duplikat frasa
      const seenContent = new Set<string>();
      const duplicateIds: string[] = [];
      all.forEach(it => {
        if (it.content && it.type === 'phrase') {
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
    if (it.type === 'folder') {
      return { primary: it.name, secondary: '' };
    }
    if (it.type === 'phrase') {
      return { primary: it.name || it.content || '', secondary: it.content || '' };
    }
    return { primary: it.content || it.name || '', secondary: '' };
  };

  const childrenOf = useCallback(
    (pid: string | null) =>
      items
        .filter((i) => i.parentId === pid)
        .sort((a, b) => {
          // 1. Folder selalu di tempatkan keatas
          if (a.type === 'folder' && b.type !== 'folder') return -1;
          if (b.type === 'folder' && a.type !== 'folder') return 1;

          if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;

          const keyA = getItemSortKeys(a);
          const keyB = getItemSortKeys(b);

          const primaryDiff = compareAlphabetical(keyA.primary, keyB.primary);
          if (primaryDiff !== 0) return primaryDiff;

          const secondaryDiff = compareAlphabetical(keyA.secondary, keyB.secondary);
          if (secondaryDiff !== 0) return secondaryDiff;

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
    label?: string,
  ): Promise<FileSystemItem> => {
    const targetParentId = parentId;

    // Query direct fresh DB items to guarantee no false duplicate matches from stale state or deleted items
    const currentDbItems = await db.getAllItems();

    if (type === 'phrase') {
      const normContent = content.trim().toLowerCase();
      const exists = currentDbItems.some(it => !it.deletedAt && it.type === 'phrase' && it.content?.trim().toLowerCase() === normContent);
      if (exists) {
        throw new Error('Frasa ini sudah ada');
      }
    }

    if (type === 'folder') {
      const normName = name.trim().toLowerCase();
      const exists = currentDbItems.some(
        it => !it.deletedAt && it.type === 'folder' && it.parentId === targetParentId && it.name?.trim().toLowerCase() === normName
      );
      if (exists) {
        throw new Error('Folder dengan nama ini sudah ada');
      }
    }

    const firstWordFromContent = (content || '').trim().split(/\s+/)[0] || '';
    const trimmedLabel = label ? label.trim() : (name ? name.trim() : '');
    const itemName = type === 'phrase'
      ? (trimmedLabel || firstWordFromContent || 'frasa')
      : (name.trim() || (type === 'folder' ? 'Folder' : 'Untitled'));
    const item: FileSystemItem = {
      id: uid(),
      parentId: targetParentId,
      name: itemName,
      type,
      content: type === 'folder' ? undefined : content,
      label: type === 'phrase' && trimmedLabel ? trimmedLabel : undefined,
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
    const it = items.find((i) => i.id === id);
    if (!it) return;
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
        if (it.type === 'phrase' && it.content) {
          merged.name = it.content.trim().split(/\s+/)[0] || 'frasa';
        }
      } else {
        merged.label = updates.label.trim();
        if (it.type === 'phrase') {
          merged.name = merged.label;
        }
      }
    } else if (it.type === 'phrase' && merged.label) {
      merged.name = merged.label;
    }
    await db.saveItem(merged);
    await reload();
    notifyDataModified();
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
      const it = items.find(i => i.id === id);
      if (it && it.type === 'phrase') return false; // Jangan pernah izinkan pharse dihapus
      return true;
    });
    if (activeIds.length === 0) return;

    // Jika folder dihapus, pindahkan item frasa di dalamnya ke parent folder atau ke root agar isinya tidak hilang
    const reassignItems: FileSystemItem[] = [];
    for (const id of activeIds) {
      const it = items.find(i => i.id === id);
      if (it && it.type === 'folder') {
        const children = items.filter(child => child.parentId === id);
        children.forEach(child => {
          reassignItems.push({ ...child, parentId: it.parentId ?? null, updatedAt: Date.now() });
        });
      }
    }

    if (reassignItems.length > 0) {
      await db.saveItems(reassignItems);
    }

    const all = collectDescendants(activeIds);
    const finalIdsToDelete = all.filter(id => {
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
    const targetIds = allDbItems
      .filter((it) => it.type === 'phrase' || (it as any).type === 'note')
      .map((it) => it.id);

    if (targetIds.length > 0) {
      await db.deleteItems(targetIds);
    }

    await reload();
    notifyDataModified();
  }, [reload]);

  const isDescendant = (ancestorId: string, nodeId: string): boolean => {
    let cur = items.find((i) => i.id === nodeId);
    while (cur && cur.parentId) {
      if (cur.parentId === ancestorId) return true;
      cur = items.find((i) => i.id === cur!.parentId);
    }
    return false;
  };

  const isPharseFolder = (_folderId: string | null): boolean => {
    return false;
  };

  const isPharseItem = (it: FileSystemItem): boolean => {
    return it.type === 'phrase';
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
    const validIds = ids.filter((id) => {
      if (id === targetParentId) return false;
      const it = items.find((i) => i.id === id);
      if (!it) return false;

      // Cegah folder dipindahkan ke dalam dirinya sendiri atau ke dalam keturunannya
      if (it.type === 'folder' && targetParentId && (id === targetParentId || isDescendant(id, targetParentId))) return false;

      // Cegah memindahkan folder ke parent yang sama
      if (it.parentId === targetParentId) return false;

      return true;
    });

    if (ids.length > 0 && validIds.length === 0) {
      const isMovingIntoDescendant = ids.some((id) => {
        const it = items.find((i) => i.id === id);
        return it && it.type === 'folder' && targetParentId && (id === targetParentId || isDescendant(id, targetParentId));
      });
      if (isMovingIntoDescendant) {
        throw new Error('Folder tidak dapat dipindahkan ke dalam dirinya sendiri');
      }
      throw new Error('Item tidak dapat dipindahkan ke folder tujuan');
    }
    const targetSiblings = items.filter((i) => i.parentId === targetParentId);
    let base = targetSiblings.length ? Math.max(...targetSiblings.map((s) => s.order ?? 0)) + 1 : 0;
    const updated: FileSystemItem[] = [];
    validIds.forEach((id) => {
      const it = items.find((i) => i.id === id);
      if (!it) return;

      updated.push({ ...it, parentId: targetParentId, order: base++, updatedAt: Date.now() });
    });
    if (updated.length) {
      await db.saveItems(updated);
      await reload();
      notifyDataModified();
    }
  };

  const reorderInParent = async (parentId: string | null, orderedIds: string[]) => {
    const updated: FileSystemItem[] = [];
    orderedIds.forEach((id, idx) => {
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
          if (i.content && i.content.toLowerCase().includes(query)) return true;
          return false;
        })
        .sort((a, b) => {
          // 1. Folder selalu di tempatkan keatas
          if (a.type === 'folder' && b.type !== 'folder') return -1;
          if (b.type === 'folder' && a.type !== 'folder') return 1;

          const keyA = getItemSortKeys(a);
          const keyB = getItemSortKeys(b);
          const primaryDiff = compareAlphabetical(keyA.primary, keyB.primary);
          if (primaryDiff !== 0) return primaryDiff;
          const secondaryDiff = compareAlphabetical(keyA.secondary, keyB.secondary);
          if (secondaryDiff !== 0) return secondaryDiff;
          return a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' });
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
        parts.unshift(cur.name);
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
    // Bersihkan folder-hello-world, folder-catatan & folder-clipkey jika terbawa dari file cadangan lama
    const sanitizedIncoming = incoming
      .filter((it) => it.id !== 'folder-hello-world' && it.id !== 'folder-catatan' && it.id !== 'folder-clipkey')
      .map((it) => {
        if (it.parentId === 'folder-hello-world' || it.parentId === 'folder-catatan' || it.parentId === 'folder-clipkey') {
          return { ...it, parentId: null };
        }
        return it;
      });

    if (replace) {
      await db.clearItems();
      await db.saveItems(sanitizedIncoming);
    } else {
      const nonSystemIncoming = sanitizedIncoming.filter((it) => it.id !== 'folder-pharse');
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

  const refreshAndSanitizeAll = useCallback(async (): Promise<{
    duplicatesRemoved: number;
    titlesUpdated: number;
    foldersUpdated: number;
    totalChanges: number;
  }> => {
    let all = await db.getAllItems();
    let duplicatesRemoved = 0;
    let titlesUpdated = 0;
    let foldersUpdated = 0;

    const toDeleteIds: string[] = [];
    const toSaveMap = new Map<string, FileSystemItem>();

    // 1. Bersihkan folder-pharse jika masih ada dan pindahkan isinya ke root
    const pharseFolder = all.find((it) => it.id === 'folder-pharse');
    if (pharseFolder) {
      toDeleteIds.push(pharseFolder.id);
      foldersUpdated++;
      const pharseChildren = all.filter((it) => it.parentId === 'folder-pharse');
      pharseChildren.forEach((child) => {
        toSaveMap.set(child.id, { ...child, parentId: null, updatedAt: Date.now() });
      });
    }

    // 2. Bersihkan duplikat frasa
    const seenPhrases = new Set<string>();
    all.forEach((it) => {
      if (!it.deletedAt && it.content && it.type === 'phrase') {
        const norm = it.content.trim().toLowerCase();
        if (seenPhrases.has(norm)) {
          toDeleteIds.push(it.id);
          duplicatesRemoved++;
        } else {
          seenPhrases.add(norm);
        }
      }
    });

    // Hapus item-item duplikat dari database
    if (toDeleteIds.length > 0) {
      await db.deleteItems(toDeleteIds);
      try {
        const storedDeleted = JSON.parse(localStorage.getItem('tautanlumina:deleted_ids') || '[]');
        const updatedDeleted = Array.from(new Set([...storedDeleted, ...toDeleteIds])).slice(-1000);
        localStorage.setItem('tautanlumina:deleted_ids', JSON.stringify(updatedDeleted));
      } catch (e) {}
      all = await db.getAllItems();
    }

    if (toSaveMap.size > 0) {
      await db.saveItems(Array.from(toSaveMap.values()));
    }

    await reload();
    notifyDataModified();

    const totalChanges = duplicatesRemoved + titlesUpdated + foldersUpdated;
    return {
      duplicatesRemoved,
      titlesUpdated,
      foldersUpdated,
      totalChanges,
    };
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
    deleteMany,
    moveMany,
    reorderInParent,
    getBreadcrumbs,
    searchItems,
    pathOf,
    exportJSON,
    importJSON,
    importItems,
    isDescendant,
    isPharseFolder,
    clearClipboardAndPharseContents,
    refreshAndSanitizeAll,
  };
};
