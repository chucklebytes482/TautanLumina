import { FileSystemItem } from '../Types';
import { getMainDomain } from './titleExtractor';

export interface DomainGroupResult {
  modifiedItems: FileSystemItem[];
  createdFolders: FileSystemItem[];
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
    return isDescendantOf('folder-catatan', folderId) || isDescendantOf('folder-pharse', folderId) || isDescendantOf('folder-clipkey', folderId);
  };

  // Find all distinct parentIds among active bookmark files
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

      // If no folder exists yet, create one if 2 or more files share this domain
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

      // If a target folder exists (either previously or newly created), move the files into it
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
  const hasChanges = modifiedItems.length > 0 || createdFolders.length > 0;

  return {
    modifiedItems,
    createdFolders,
    hasChanges,
    updatedAll: all,
  };
};
