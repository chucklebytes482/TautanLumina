import { FileSystemItem } from '../Types';
import { getMainDomain } from './titleExtractor';

export interface DomainGroupResult {
  modifiedItems: FileSystemItem[];
  createdFolders: FileSystemItem[];
  deletedFolders: string[];
  hasChanges: boolean;
  updatedAll: FileSystemItem[];
}

export const groupBookmarksByDomain = (
  items: FileSystemItem[],
  uidFn: () => string
): DomainGroupResult => {
  let all = [...items];
  const modifiedMap = new Map<string, FileSystemItem>();
  const createdFolders: FileSystemItem[] = [];
  const deletedFolders: string[] = [];

  const isDescendantOf = (ancestorId: string, id: string | null): boolean => {
    let cur = id;
    const visited = new Set<string>();
    while (cur && !visited.has(cur)) {
      visited.add(cur);
      if (cur === ancestorId) return true;
      const parent = all.find((i) => i.id === cur);
      cur = parent ? parent.parentId : null;
    }
    return false;
  };

  const isExcludedFolder = (folderId: string | null): boolean => {
    if (!folderId) return false;
    if (folderId === 'folder-catatan' || folderId === 'folder-pharse' || folderId === 'folder-clipkey') return true;
    return (
      isDescendantOf('folder-catatan', folderId) ||
      isDescendantOf('folder-pharse', folderId) ||
      isDescendantOf('folder-clipkey', folderId)
    );
  };

  // =========================================================================
  // FASE 1: DEDUP FOLDER DENGAN NAMA SAMA DI BAWAH INDUK (PARENT) YANG SAMA
  // =========================================================================
  const folderParents = new Set<string | null>();
  all.forEach((item) => {
    if (item.type === 'folder' && !item.deletedAt && !isExcludedFolder(item.id)) {
      folderParents.add(item.parentId);
    }
  });

  folderParents.forEach((parentId) => {
    const foldersUnderParent = all.filter(
      (it) =>
        it.type === 'folder' &&
        !it.deletedAt &&
        it.parentId === parentId &&
        it.id !== 'folder-clipkey' &&
        it.id !== 'folder-pharse' &&
        it.id !== 'folder-catatan'
    );

    // Kelompokkan folder berdasarkan nama (case-insensitive)
    const nameMap = new Map<string, FileSystemItem[]>();
    foldersUnderParent.forEach((f) => {
      const lowerName = f.name.trim().toLowerCase();
      if (!lowerName) return;
      if (!nameMap.has(lowerName)) {
        nameMap.set(lowerName, []);
      }
      nameMap.get(lowerName)!.push(f);
    });

    nameMap.forEach((duplicates) => {
      if (duplicates.length <= 1) return;

      // Pilih folder utama: yang paling lama dibuat atau pertama
      // Prioritaskan yang autoDomain jika ada
      const primary = duplicates.reduce((prev, curr) => {
        if (prev.autoDomain && !curr.autoDomain) return prev;
        if (!prev.autoDomain && curr.autoDomain) return curr;
        return (prev.createdAt || 0) <= (curr.createdAt || 0) ? prev : curr;
      });

      const anyAutoDomain = duplicates.some((d) => d.autoDomain);
      if (anyAutoDomain && !primary.autoDomain) {
        primary.autoDomain = true;
        primary.updatedAt = Date.now();
        modifiedMap.set(primary.id, primary);
      }

      // Untuk setiap folder duplikat (selain primary):
      const others = duplicates.filter((d) => d.id !== primary.id);
      others.forEach((dup) => {
        deletedFolders.push(dup.id);

        // Pindahkan semua item anak yang ada di dalam duplicate folder ke primary folder
        all.forEach((child) => {
          if (child.parentId === dup.id) {
            const updatedChild: FileSystemItem = {
              ...child,
              parentId: primary.id,
              updatedAt: Date.now(),
            };
            modifiedMap.set(child.id, updatedChild);
            const childIdx = all.findIndex((i) => i.id === child.id);
            if (childIdx !== -1) {
              all[childIdx] = updatedChild;
            }
          }
        });

        // Hapus duplicate folder dari array all
        all = all.filter((i) => i.id !== dup.id);
      });
    });
  });

  // =========================================================================
  // FASE 2: KELOMPOKKAN BOOKMARK DENGAN DOMAIN SAMA KE DALAM FOLDER
  // =========================================================================
  const fileParents = new Set<string | null>();
  all.forEach((item) => {
    if (item.type === 'file' && !item.deletedAt && !isExcludedFolder(item.parentId)) {
      fileParents.add(item.parentId);
    }
  });

  fileParents.forEach((parentId) => {
    const parentFolder = parentId ? all.find((i) => i.id === parentId) : null;
    const parentFolderName = parentFolder?.name?.trim().toLowerCase();

    // Active files directly under this parent
    const filesUnderParent = all.filter(
      (i) => i.type === 'file' && !i.deletedAt && i.parentId === parentId
    );

    // Active folders directly under this parent (sudah bersih dari duplikat di Fase 1)
    const foldersUnderParent = all.filter(
      (i) => i.type === 'folder' && !i.deletedAt && i.parentId === parentId
    );

    // Group files by domain
    const domainMap = new Map<string, FileSystemItem[]>();
    filesUnderParent.forEach((file) => {
      const domain = getMainDomain(file.content || file.name);
      if (domain && domain.includes('.')) {
        const lowerDomain = domain.toLowerCase();
        // If parent folder already has this domain name, it's already in its domain folder
        if (parentFolderName === lowerDomain) {
          return;
        }
        if (!domainMap.has(lowerDomain)) {
          domainMap.set(lowerDomain, []);
        }
        domainMap.get(lowerDomain)!.push(file);
      }
    });

    domainMap.forEach((domainFiles, lowerDomain) => {
      // Cari folder yang sudah ada dengan nama domain yang sama
      let targetFolder = foldersUnderParent.find(
        (f) => f.name.trim().toLowerCase() === lowerDomain
      );

      // Jika belum ada folder dan terdapat 2 atau lebih bookmark dari domain ini, buat satu folder baru
      if (!targetFolder && domainFiles.length >= 2) {
        const newFolderId = uidFn();
        const siblings = all.filter((i) => i.parentId === parentId);
        const nextOrder = siblings.length
          ? Math.max(...siblings.map((s) => (typeof s.order === 'number' ? s.order : 0))) + 1
          : 0;

        targetFolder = {
          id: newFolderId,
          parentId,
          name: lowerDomain,
          type: 'folder',
          autoDomain: true,
          order: nextOrder,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };

        createdFolders.push(targetFolder);
        all.push(targetFolder);
        foldersUnderParent.push(targetFolder);
      } else if (targetFolder && !targetFolder.autoDomain) {
        targetFolder.autoDomain = true;
        targetFolder.updatedAt = Date.now();
        modifiedMap.set(targetFolder.id, targetFolder);
        const tfIdx = all.findIndex((i) => i.id === targetFolder!.id);
        if (tfIdx !== -1) {
          all[tfIdx] = targetFolder;
        }
      }

      // Jika targetFolder tersedia (sudah ada sebelumnya atau baru dibuat), pindahkan file-file ke dalamnya
      if (targetFolder) {
        domainFiles.forEach((file, idx) => {
          if (file.parentId !== targetFolder!.id) {
            const updated: FileSystemItem = {
              ...file,
              parentId: targetFolder!.id,
              order: idx,
              updatedAt: Date.now(),
            };
            modifiedMap.set(file.id, updated);
            const allIdx = all.findIndex((i) => i.id === file.id);
            if (allIdx !== -1) {
              all[allIdx] = updated;
            }
          }
        });
      }
    });
  });

  const modifiedItems = Array.from(modifiedMap.values());
  const hasChanges = modifiedItems.length > 0 || createdFolders.length > 0 || deletedFolders.length > 0;

  return {
    modifiedItems,
    createdFolders,
    deletedFolders,
    hasChanges,
    updatedAll: all,
  };
};
