import { FileSystemItem } from '../Types';
import { getMainDomain } from './titleExtractor';

export const MIN_AUTO_DOMAIN_BOOKMARKS = 4;

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

      const others = duplicates.filter((d) => d.id !== primary.id);
      others.forEach((dup) => {
        deletedFolders.push(dup.id);

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

        all = all.filter((i) => i.id !== dup.id);
      });
    });
  });

  // =========================================================================
  // FASE 1.5: RELOKASI BOOKMARK DENGAN DOMAIN BERBEDA DARI FOLDER autoDomain
  // "folder yang dibuat otomatis tidak boleh memiliki bookmark dengan domain yang berbeda,
  // jika terjadi maka akan di tempatkan di luar folder."
  // =========================================================================
  const allAutoDomainFolders = all.filter(
    (it) =>
      it.type === 'folder' &&
      !it.deletedAt &&
      (it.autoDomain ||
        Boolean(
          it.name &&
            it.name.includes('.') &&
            getMainDomain(it.name).toLowerCase() === it.name.trim().toLowerCase()
        )) &&
      !isExcludedFolder(it.id)
  );

  allAutoDomainFolders.forEach((folder) => {
    const expectedDomain = (getMainDomain(folder.name) || folder.name).trim().toLowerCase();
    const childrenInside = all.filter(
      (it) => it.type === 'file' && !it.deletedAt && it.parentId === folder.id
    );

    childrenInside.forEach((child) => {
      const childDomain = getMainDomain(child.content || child.name).trim().toLowerCase();
      if (childDomain && expectedDomain && childDomain !== expectedDomain) {
        // Pindahkan ke luar folder (yaitu folder.parentId)
        const updatedChild: FileSystemItem = {
          ...child,
          parentId: folder.parentId,
          updatedAt: Date.now(),
        };
        modifiedMap.set(child.id, updatedChild);
        const childIdx = all.findIndex((i) => i.id === child.id);
        if (childIdx !== -1) {
          all[childIdx] = updatedChild;
        }
      }
    });
  });

  // =========================================================================
  // FASE 2: HAPUS FOLDER autoDomain JIKA KURANG DARI 4 BOOKMARK
  // =========================================================================
  const autoDomainFolders = all.filter(
    (it) => it.type === 'folder' && !it.deletedAt && it.autoDomain && !isExcludedFolder(it.id)
  );

  autoDomainFolders.forEach((folder) => {
    const lowerDomain = folder.name.trim().toLowerCase();
    const childrenInside = all.filter(
      (it) => it.type === 'file' && !it.deletedAt && it.parentId === folder.id
    );
    const siblingsOutside = all.filter(
      (it) =>
        it.type === 'file' &&
        !it.deletedAt &&
        it.parentId === folder.parentId &&
        getMainDomain(it.content || it.name).toLowerCase() === lowerDomain
    );

    const totalDomainBookmarks = childrenInside.length + siblingsOutside.length;

    if (totalDomainBookmarks < MIN_AUTO_DOMAIN_BOOKMARKS) {
      // Hapus folder autoDomain ini dan keluarkan seluruh isinya ke folder induk (folder.parentId)
      deletedFolders.push(folder.id);

      childrenInside.forEach((child, idx) => {
        const updatedChild: FileSystemItem = {
          ...child,
          parentId: folder.parentId,
          order: idx,
          updatedAt: Date.now(),
        };
        modifiedMap.set(child.id, updatedChild);
        const childIdx = all.findIndex((i) => i.id === child.id);
        if (childIdx !== -1) {
          all[childIdx] = updatedChild;
        }
      });

      // Hapus folder dari all
      all = all.filter((i) => i.id !== folder.id);
    }
  });

  // =========================================================================
  // FASE 3: KELOMPOKKAN BOOKMARK DENGAN DOMAIN SAMA KE DALAM FOLDER JIKA >= 4
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

    // Active folders directly under this parent
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
      let targetFolder = foldersUnderParent.find(
        (f) => f.name.trim().toLowerCase() === lowerDomain
      );

      // Cari berapa item yang ada di targetFolder saat ini
      const existingInTarget = targetFolder
        ? all.filter((it) => it.type === 'file' && !it.deletedAt && it.parentId === targetFolder!.id).length
        : 0;

      const totalItems = existingInTarget + domainFiles.length;

      // Jika belum ada folder dan total bookmark >= 4, buat satu folder baru
      if (!targetFolder && totalItems >= MIN_AUTO_DOMAIN_BOOKMARKS) {
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

      // Jika targetFolder tersedia dan total bookmark >= 4, pindahkan file-file ke dalamnya
      if (targetFolder && totalItems >= MIN_AUTO_DOMAIN_BOOKMARKS) {
        domainFiles.forEach((file, idx) => {
          if (file.parentId !== targetFolder!.id) {
            const updated: FileSystemItem = {
              ...file,
              parentId: targetFolder!.id,
              order: existingInTarget + idx,
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
