import { useState, useEffect, useCallback, useMemo } from 'react';
import { FileSystemItem, FileSystemItemType } from '../Types';
import * as db from '../db/db';
import { parseNetscapeBookmarks, isNetscapeBookmarkHTML } from '../lib/bookmarkParser';
import { exportNetscapeBookmarks } from '../lib/bookmarkExporter';
import { useI18n } from '../lib/i18n';

const uid = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2) + Date.now().toString(36);

export const useFileSystem = () => {
  const { t } = useI18n();
  const [items, setItems] = useState<FileSystemItem[]>([]);
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  const reload = useCallback(async () => {
    try {
      let all = await db.getAllItems();
      
      let changed = false;
      const catatanExists = all.some(it => it.id === 'folder-catatan');
      if (!catatanExists) {
        const folderCatatan: FileSystemItem = {
          id: 'folder-catatan',
          parentId: null,
          name: 'Note',
          type: 'folder',
          order: 0,
          createdAt: 0,
          updatedAt: Date.now(),
        };
        await db.saveItem(folderCatatan);
        changed = true;
      }

      const helloWorldExists = all.some(it => it.id === 'folder-hello-world');
      if (!helloWorldExists) {
        const folderHelloWorld: FileSystemItem = {
          id: 'folder-hello-world',
          parentId: null,
          name: 'hello world',
          type: 'folder',
          order: 1,
          createdAt: 0,
          updatedAt: Date.now(),
        };
        await db.saveItem(folderHelloWorld);
        changed = true;
      }

      const pharseExists = all.some(it => it.id === 'folder-pharse');
      if (!pharseExists) {
        const folderPharse: FileSystemItem = {
          id: 'folder-pharse',
          parentId: null,
          name: 'Pharse',
          type: 'folder',
          order: 2,
          createdAt: 0,
          updatedAt: Date.now(),
        };
        await db.saveItem(folderPharse);
        changed = true;
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
        it.parentId !== 'folder-catatan' && 
        it.parentId !== 'folder-hello-world' && 
        it.parentId !== 'folder-pharse' && 
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

      setItems(all);
    } catch (e) {
      console.warn('Failed to load file system items:', e);
    } finally {
      setLoaded(true);
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

  const childrenOf = useCallback(
    (pid: string | null) =>
      items
        .filter((i) => i.parentId === pid)
        .sort((a, b) => {
          if (pid === null) {
            const sysRank = (id: string) => {
              if (id === 'folder-hello-world') return 1;
              if (id === 'folder-catatan') return 2;
              if (id === 'folder-pharse') return 3;
              return 999;
            };
            const rankA = sysRank(a.id);
            const rankB = sysRank(b.id);
            if (rankA !== rankB) {
              return rankA - rankB;
            }
          }

          if (a.type === 'folder' && b.type !== 'folder') return -1;
          if (b.type === 'folder' && a.type !== 'folder') return 1;

          if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
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
    // Query direct fresh DB items to guarantee no false duplicate matches from stale state or deleted items
    const currentDbItems = await db.getAllItems();
    if (type === 'file') {
      const normContent = content.trim().replace(/\/+$/, '');
      const exists = currentDbItems.some(it => !it.deletedAt && it.type === 'file' && it.content?.trim().replace(/\/+$/, '') === normContent);
      if (exists) {
        throw new Error('Tautan ini sudah ada');
      }
    }
    if (type === 'phrase') {
      const normContent = content.trim();
      const exists = currentDbItems.some(it => !it.deletedAt && it.type === 'phrase' && it.content?.trim() === normContent);
      if (exists) {
        throw new Error('Pharse ini sudah ada');
      }
    }
    const targetParentId = type === 'phrase'
      ? 'folder-pharse'
      : (type === 'note' && !parentId)
      ? 'folder-catatan'
      : parentId;
    const firstWordFromContent = (content || '').trim().split(/\s+/)[0] || '';
    const itemName = type === 'note'
      ? content.trim()
      : type === 'phrase'
      ? (firstWordFromContent || 'pharse')
      : (name.trim() || (type === 'folder' ? 'Folder' : 'Untitled'));
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
  };

  const renameItem = async (id: string, name: string) => {
    if (id === 'folder-catatan' || id === 'folder-hello-world' || id === 'folder-pharse') {
      throw new Error('Tidak dapat diubah');
    }
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
    if (updates.label !== undefined) {
      if (!updates.label || !updates.label.trim()) {
        delete merged.label;
      } else {
        merged.label = updates.label.trim();
      }
    }
    await db.saveItem(merged);
    await reload();
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
      if (id === 'folder-catatan' || id === 'folder-hello-world' || id === 'folder-pharse') return false;
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
    // Pastikan item bertipe 'phrase' tidak pernah masuk dalam daftar hapus
    const finalIdsToDelete = all.filter(id => {
      const it = items.find(item => item.id === id);
      return it && it.type !== 'phrase';
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
  };

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

  const moveMany = async (ids: string[], targetParentId: string | null) => {
    const isTargetPharse = isPharseFolder(targetParentId);

    const validIds = ids.filter((id) => {
      if (id === targetParentId) return false;
      if (id === 'folder-catatan' || id === 'folder-hello-world' || id === 'folder-pharse') return false;
      const it = items.find((i) => i.id === id);
      if (!it) return false;
      if (it.type === 'folder' && targetParentId && isDescendant(id, targetParentId)) return false;

      const isPharseContent = it.type === 'phrase' || isPharseFolder(it.parentId);
      if (isPharseContent) {
        // Isi folder pharse dapat dipindahkan HANYA ke sub folder pharse (atau folder pharse)
        return isTargetPharse;
      } else {
        // Item biasa selain pharse tidak boleh dimasukkan ke dalam folder pharse
        return !isTargetPharse;
      }
    });

    if (ids.length > 0 && validIds.length === 0) {
      const isAnyPharse = ids.some((id) => {
        const it = items.find((i) => i.id === id);
        return it && (it.type === 'phrase' || isPharseFolder(it.parentId));
      });
      if (isAnyPharse && !isTargetPharse) {
        throw new Error('Isi folder pharse hanya dapat dipindahkan ke sub folder pharse');
      }
      if (!isAnyPharse && isTargetPharse) {
        throw new Error('Item di luar pharse tidak dapat dipindahkan ke folder pharse');
      }
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
    }
  };

  const copyMany = async (ids: string[], targetParentId: string | null) => {
    const all = collectDescendants(ids);
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
  };

  const duplicateItem = async (id: string) => {
    const it = items.find((i) => i.id === id);
    if (!it) return;
    await copyMany([id], it.parentId);
  };

  const reorderInParent = async (parentId: string | null, orderedIds: string[]) => {
    let finalIds = [...orderedIds];
    if (parentId === null) {
      const systemIds = ['folder-hello-world', 'folder-catatan', 'folder-pharse'];
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
    return JSON.stringify({ app: 'plaintxtai', version: 1, items, apiKey: aiKey, model: aiModel }, null, 2);
  };

  const exportHTML = () => {
    return exportNetscapeBookmarks(items);
  };

  const importJSON = async (json: string, replace: boolean, targetParentId?: string | null) => {
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

    await importItems(incoming, replace, targetParentId);
  };

  const importHTML = async (htmlContent: string, replace: boolean, targetParentId?: string | null) => {
    const incoming = parseNetscapeBookmarks(htmlContent);
    if (incoming.length === 0) {
      throw new Error('No bookmarks found in HTML file');
    }
    await importItems(incoming, replace, targetParentId);
    return incoming.length;
  };

  const importItems = async (incoming: FileSystemItem[], replace: boolean, targetParentId?: string | null) => {
    const defaultParentId = targetParentId ? targetParentId : 'folder-hello-world';

    if (replace) {
      await db.clearItems();
      await db.saveItems(incoming);
    } else {
      const nonSystemIncoming = incoming.filter((it) => it.id !== 'folder-catatan' && it.id !== 'folder-hello-world' && it.id !== 'folder-pharse');
      const nonSystemIds = new Set(nonSystemIncoming.map((it) => it.id));

      const map: Record<string, string> = {};
      nonSystemIncoming.forEach((it) => {
        map[it.id] = uid();
      });

      const remapped = nonSystemIncoming.map((it) => {
        const hasParentInIncoming = it.parentId && nonSystemIds.has(it.parentId);
        return {
          ...it,
          id: map[it.id],
          parentId: hasParentInIncoming ? map[it.parentId!] : defaultParentId,
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
  }, []);

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
    exportHTML,
    importJSON,
    importHTML,
    importItems,
    isDescendant,
    clearAll,
    clearPharseFolder,
  };
};
