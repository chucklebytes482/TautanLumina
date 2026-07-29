import { openDB, IDBPDatabase, deleteDB } from 'idb';
import { FileSystemItem } from '../Types';

const DB_NAME = 'tautanlumina';
const LEGACY_DB_NAME = 'simpanteks';
const DB_VERSION = 3;
const STORE = 'items';

let dbPromise: Promise<IDBPDatabase> | null = null;
let currentDBName = 'tautanlumina_anonymous';

export const setDatabaseUser = async (userId: string | null) => {
  const nextDBName = userId ? `tautanlumina_${userId}` : 'tautanlumina_anonymous';
  if (currentDBName !== nextDBName) {
    if (dbPromise) {
      const db = await dbPromise;
      db.close();
      dbPromise = null;
    }
    currentDBName = nextDBName;
  }
};

/**
 * Migrasi otomatis dari IndexedDB lama ke nama baru yang diisolasi.
 * Berjalan sekali saat pertama kali DB baru dibuka & masih kosong.
 */
const migrateLegacy = async (db: IDBPDatabase, dbName: string) => {
  const count = await db.count(STORE);
  if (count > 0) return; // sudah ada data → skip
  try {
    const existing = await indexedDB.databases?.();
    
    // Jika membuka DB anonim, migrasikan dari 'tautanlumina' (nama DB tunggal lama)
    if (dbName === 'tautanlumina_anonymous') {
      const hasOldNewDb = existing?.some((d) => d.name === 'tautanlumina');
      if (hasOldNewDb) {
        const oldNewDb = await openDB('tautanlumina', DB_VERSION);
        if (oldNewDb.objectStoreNames.contains(STORE)) {
          const items = await oldNewDb.getAll(STORE);
          oldNewDb.close();
          if (items.length > 0) {
            const tx = db.transaction(STORE, 'readwrite');
            await Promise.all(items.map((it) => tx.store.put(it)));
            await tx.done;
            await deleteDB('tautanlumina');
            return;
          }
        }
      }
    }

    // Cek apakah DB lama 'simpanteks' ada
    if (existing && !existing.some((d) => d.name === LEGACY_DB_NAME)) return;
    const legacy = await openDB(LEGACY_DB_NAME, 1);
    if (!legacy.objectStoreNames.contains(STORE)) {
      legacy.close();
      return;
    }
    const items = await legacy.getAll(STORE);
    legacy.close();
    if (items.length > 0) {
      const tx = db.transaction(STORE, 'readwrite');
      await Promise.all(items.map((it) => tx.store.put(it)));
      await tx.done;
      // Hapus DB lama setelah migrasi berhasil
      await deleteDB(LEGACY_DB_NAME);
    }
  } catch {
    /* migrasi opsional — biarkan saja jika gagal */
  }
};

export const initDB = () => {
  if (!dbPromise) {
    dbPromise = openDB(currentDBName, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE)) {
          const s = db.createObjectStore(STORE, { keyPath: 'id' });
          s.createIndex('parentId', 'parentId');
        }
      },
    }).then(async (db) => {
      await migrateLegacy(db, currentDBName);
      return db;
    });
  }
  return dbPromise;
};

export const getAllItems = async (): Promise<FileSystemItem[]> => {
  const db = await initDB();
  return db.getAll(STORE);
};

export const saveItem = async (item: FileSystemItem) => {
  const db = await initDB();
  await db.put(STORE, item);
};

export const saveItems = async (items: FileSystemItem[]) => {
  const db = await initDB();
  const tx = db.transaction(STORE, 'readwrite');
  await Promise.all(items.map((it) => tx.store.put(it)));
  await tx.done;
};

export const deleteItems = async (ids: string[]) => {
  const db = await initDB();
  const tx = db.transaction(STORE, 'readwrite');
  await Promise.all(ids.map((id) => tx.store.delete(id)));
  await tx.done;
};

export const clearAll = async () => {
  const db = await initDB();
  await db.clear(STORE);
};

export const clearItems = async () => {
  const db = await initDB();
  await db.clear(STORE);
};

