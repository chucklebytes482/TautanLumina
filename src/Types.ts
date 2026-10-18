export type FileSystemItemType = 'file' | 'folder' | 'note' | 'phrase';

export interface FileSystemItem {
  id: string;
  parentId: string | null;
  name: string;
  type: FileSystemItemType;
  content?: string;
  order: number;
  createdAt: number;
  updatedAt: number;
  deletedAt?: number;
  pinned?: boolean;
  category?: string;
  locked?: boolean;
}

