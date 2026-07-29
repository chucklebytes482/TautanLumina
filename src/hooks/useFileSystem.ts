import { useState, useEffect, useCallback, useMemo } from 'react';
import { FileSystemItem, FileSystemItemType } from '../Types';
import * as db from '../db/db';
import { parseNetscapeBookmarks, isNetscapeBookmarkHTML } from '../lib/bookmarkParser';

const uid = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2) + Date.now().toString(36);

export const useFileSystem = () => {
  const [items, setItems] = useState<FileSystemItem[]>([]);
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  const reload = useCallback(async () => {
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

    setItems(all);
    setLoaded(true);
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
    const itemName = type === 'note' ? content.trim() : (name.trim() || (type === 'folder' ? 'Folder' : 'Untitled'));
    const item: FileSystemItem = {
      id: uid(),
      parentId,
      name: itemName,
      type,
      content: type === 'folder' ? undefined : content,
      category,
      order: nextOrder(parentId),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    await db.saveItem(item);
    await reload();
    return item;
  };

  const updateContent = async (id: string, content: string) => {
    const it = items.find((i) => i.id === id);
    if (!it) return;
    if (!content.trim()) {
      await deleteMany([id]);
      return;
    }
    await db.saveItem({ ...it, content, updatedAt: Date.now() });
    await reload();
  };

  const renameItem = async (id: string, name: string) => {
    if (id === 'folder-catatan' || id === 'folder-hello-world') {
      throw new Error('Folder sistem tidak dapat diubah namanya');
    }
    const it = items.find((i) => i.id === id);
    if (!it) return;
    const finalName = name.trim();
    if (!finalName && it.type === 'folder') return;
    
    if (finalName) {
      const existing = items.find((i) => i.id !== id && i.parentId === it.parentId && i.name === finalName && i.type === it.type);
      if (existing) {
        throw new Error('Nama sudah ada di folder ini');
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
    await db.saveItem({ ...it, ...updates, updatedAt: Date.now() });
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
    const activeIds = ids.filter(id => id !== 'folder-catatan' && id !== 'folder-hello-world');
    if (activeIds.length === 0) return;
    const all = collectDescendants(activeIds);
    if (all.length > 0) {
      await db.deleteItems(all);
      try {
        const stored = localStorage.getItem('tautanlumina:deleted_ids');
        const currentDeleted: string[] = stored ? JSON.parse(stored) : [];
        const updatedDeleted = Array.from(new Set([...currentDeleted, ...all]));
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

  const moveMany = async (ids: string[], targetParentId: string | null) => {
    const validIds = ids.filter((id) => {
      if (id === targetParentId) return false;
      const it = items.find((i) => i.id === id);
      if (!it) return false;
      if (it.type === 'folder' && targetParentId && isDescendant(id, targetParentId)) return false;
      return true;
    });
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
          if (i.type === 'file' && i.content && i.content.toLowerCase().includes(query)) return true;
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

  const importJSON = async (json: string, replace: boolean) => {
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

    await importItems(incoming, replace);
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
    const incomingIds = new Set(incoming.map((it) => it.id));
    const defaultParentId = targetParentId ? targetParentId : null;

    if (replace) {
      await db.clearItems();
      const updatedIncoming = incoming.map((it) => {
        if (it.id === 'folder-catatan' || it.id === 'folder-hello-world') {
          return it;
        }
        
        if (!it.parentId) {
          return {
            ...it,
            parentId: null,
          };
        }

        const isSystemParent = it.parentId === 'folder-catatan' || it.parentId === 'folder-hello-world';
        const hasParentInIncoming = incomingIds.has(it.parentId) || isSystemParent;

        return {
          ...it,
          parentId: hasParentInIncoming ? it.parentId : defaultParentId,
        };
      });
      await db.saveItems(updatedIncoming);
    } else {
      const map: Record<string, string> = {};
      incoming.forEach((it) => {
        if (it.id === 'folder-catatan' || it.id === 'folder-hello-world') {
          map[it.id] = it.id;
        } else {
          map[it.id] = uid();
        }
      });
      const remapped = incoming.map((it) => {
        if (it.id === 'folder-catatan' || it.id === 'folder-hello-world') {
          return it;
        }
        const hasParentInIncoming = it.parentId && incomingIds.has(it.parentId);
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
    importJSON,
    importHTML,
    importItems,
    isDescendant,
    clearAll,
  };
};
