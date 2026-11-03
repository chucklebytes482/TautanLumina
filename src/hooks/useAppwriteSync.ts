import { useState, useCallback, useEffect, useRef } from 'react';
import { ID, Permission, Role } from 'appwrite';
import { account, databases, storage, APPWRITE_DATABASE_ID, APPWRITE_COLLECTION_ID, APPWRITE_BUCKET_ID, ADMIN_EMAIL, getSyncDocId } from '../lib/appwrite';
import { toast } from 'sonner';
import { FileSystemItem } from '../Types';
import { useI18n } from '../lib/i18n';
import { removePin, getStoredPinHash, getStoredPinUpdatedAt, setStoredPinHash } from '../lib/pin';
import * as db from '../db/db';
import { extractTitleFromUrl } from '../lib/titleExtractor';
import { groupBookmarksByDomain } from '../lib/domainGrouper';

const getInitialUser = () => {
  if (typeof localStorage === 'undefined') return null;
  try {
    const cachedStr = localStorage.getItem('tautanlumina:cached_user');
    if (cachedStr) {
      const cached = JSON.parse(cachedStr);
      if (cached && cached.$id) {
        db.setDatabaseUser(cached.$id);
        return cached;
      }
    }
  } catch (e) {
    console.warn('Failed to parse initial cached user:', e);
  }
  return null;
};

export function useAppwriteSync(
  items: FileSystemItem[],
  importJSON: (jsonStr: string, replace: boolean, targetParentId?: string | null, isSyncPull?: boolean) => Promise<void>,
  exportJSON: () => string,
  loaded: boolean = true
) {
  const { t } = useI18n();
  const initialUser = getInitialUser();
  const [user, setUser] = useState<any>(initialUser);
  const [loading, setLoading] = useState<boolean>(!initialUser);
  const [syncing, setSyncing] = useState(false);
  const autoSyncedUserRef = useRef<string | null>(null);

  useEffect(() => {
    let mounted = true;

    // Safety timeout: Never leave loading true for more than 3 seconds
    const timer = setTimeout(() => {
      if (mounted) setLoading(false);
    }, 3000);

    account.get().then((res) => {
      if (!mounted) return;
      if (!res.emailVerification) {
        account.deleteSession('current').finally(async () => {
          await db.setDatabaseUser(null);
          if (mounted) {
            setUser(null);
            localStorage.removeItem('tautanlumina:current_user_email');
            localStorage.removeItem('tautanlumina:cached_user');
            localStorage.removeItem('tautanlumina:cached_user_id');
            window.dispatchEvent(new Event('tautanlumina:user_changed'));
            setLoading(false);
          }
        });
      } else {
        db.setDatabaseUser(res.$id).then(() => {
          if (!mounted) return;
          setUser(res);
          localStorage.setItem('tautanlumina:current_user_email', res.email);
          localStorage.setItem('tautanlumina:cached_user', JSON.stringify(res));
          localStorage.setItem('tautanlumina:cached_user_id', res.$id);
          window.dispatchEvent(new Event('tautanlumina:user_changed'));
          setLoading(false);
        });
      }
    }).catch(async (err: any) => {
      if (!mounted) return;
      const isUnauthenticated = err?.code === 401 || err?.code === 403;

      if (isUnauthenticated) {
        // Explicit 401/403 from server means session is revoked or expired
        await db.setDatabaseUser(null);
        setUser(null);
        localStorage.removeItem('tautanlumina:current_user_email');
        localStorage.removeItem('tautanlumina:cached_user');
        localStorage.removeItem('tautanlumina:cached_user_id');
        window.dispatchEvent(new Event('tautanlumina:user_changed'));
      } else {
        // Offline or network error: keep initialUser / cached_user logged in!
        const cachedUserStr = localStorage.getItem('tautanlumina:cached_user');
        if (cachedUserStr) {
          try {
            const cachedUser = JSON.parse(cachedUserStr);
            if (cachedUser && cachedUser.$id) {
              await db.setDatabaseUser(cachedUser.$id);
              setUser(cachedUser);
            }
          } catch {}
        }
      }
      setLoading(false);
    }).finally(() => {
      clearTimeout(timer);
      if (mounted) setLoading(false);
    });

    return () => {
      mounted = false;
      clearTimeout(timer);
    };
  }, []);

  const verifyEmail = async (userId: string, secret: string) => {
    try {
      await account.updateVerification(userId, secret);
      toast.dismiss();
      toast.success(t('toast.verifyEmailSuccess'), { duration: 1500 });
      return true;
    } catch (e: any) {
      toast.dismiss();
      toast.error(t('toast.verifyEmailError'), { duration: 1500 });
      return false;
    }
  };

  const login = async (email: string, pass: string) => {
    try {
      try {
        await account.deleteSession('current');
      } catch {}

      await account.createEmailPasswordSession(email, pass);
      const acc = await account.get();
      if (!acc.emailVerification) {
        try {
          await account.createVerification(window.location.origin + '?action=verify');
        } catch {}
        await account.deleteSession('current');
        toast.dismiss();
        toast.error(t('toast.emailNotVerified'), { duration: 1500 });
        return false;
      }
      autoSyncedUserRef.current = acc.$id;
      await db.setDatabaseUser(acc.$id);
      setUser(acc);
      localStorage.setItem('tautanlumina:current_user_email', acc.email);
      localStorage.setItem('tautanlumina:cached_user', JSON.stringify(acc));
      localStorage.setItem('tautanlumina:cached_user_id', acc.$id);
      window.dispatchEvent(new Event('tautanlumina:user_changed'));
      toast.dismiss();
      toast.success(t('toast.loginSuccess'), { duration: 1500 });
      return true;
    } catch (e: any) {
      toast.dismiss();
      let msg = t('toast.loginError');
      const isDeveloper = email.toLowerCase() === ADMIN_EMAIL;
      if (e?.type === 'user_invalid_credentials' || e?.code === 401) {
        msg = `${t('toast.loginError')}: ${t('toast.invalidCredentials')}`;
      } else if (isDeveloper && e?.message) {
        msg = `${t('toast.loginError')}: ${e.message}`;
      }
      toast.error(msg, { duration: 1500 });
      return false;
    }
  };

  const register = async (email: string, pass: string) => {
    try {
      try {
        await account.deleteSession('current');
      } catch {}

      await account.create(ID.unique(), email, pass);
      await account.createEmailPasswordSession(email, pass);
      try {
        await account.createVerification(window.location.origin + '?action=verify');
      } catch {}
      await account.deleteSession('current');
      toast.dismiss();
      toast.success(t('toast.signupSuccess'), { duration: 1500 });
      return true;
    } catch (e: any) {
      toast.dismiss();
      let msg = t('toast.signupError');
      const isDeveloper = email.toLowerCase() === ADMIN_EMAIL;
      if (e?.type === 'user_already_exists' || e?.code === 409) {
        msg = `${t('toast.signupError')}: ${t('toast.userAlreadyExists')}`;
      } else if (isDeveloper && e?.message) {
        msg = `${t('toast.signupError')}: ${e.message}`;
      }
      toast.error(msg, { duration: 1500 });
      return false;
    }
  };

  const resetPassword = async (email: string) => {
    const LAST_OTP_KEY = 'tautanlumina:lastOtpTime';
    const lastOtp = localStorage.getItem(LAST_OTP_KEY);
    const now = Date.now();
    
    if (lastOtp && now - parseInt(lastOtp, 10) < 60 * 60 * 1000) {
      toast.dismiss();
      toast.error(t('toast.otpWait'), { duration: 1500 });
      return false;
    }

    try {
      await account.createRecovery(email, window.location.origin + '?action=reset');
      localStorage.setItem(LAST_OTP_KEY, now.toString());
      toast.dismiss();
      toast.success(t('toast.resetLinkSent'), { duration: 1500 });
      return true;
    } catch (e: any) {
      toast.dismiss();
      const isDeveloper = email.toLowerCase() === ADMIN_EMAIL;
      const details = (isDeveloper && e?.message) ? `: ${e.message}` : '';
      toast.error(`${t('toast.resetLinkError')}${details}`, { duration: 1500 });
      return false;
    }
  };

  const updatePasswordRecovery = async (userId: string, secret: string, newPass: string) => {
    try {
      await account.updateRecovery(userId, secret, newPass);
      toast.dismiss();
      toast.success(t('toast.passwordChanged'), { duration: 1500 });
      return true;
    } catch (e: any) {
      toast.dismiss();
      const details = e?.message ? `: ${e.message}` : '';
      toast.error(`${t('toast.passwordChangeError')}${details}`, { duration: 1500 });
      return false;
    }
  };

  const verifyPasswordAndResetPin = async (password: string) => {
    if (!user?.email) {
      toast.error(t('toast.userEmailNotFound'));
      return false;
    }
    try {
      try {
        await account.createEmailPasswordSession(user.email, password);
      } catch (err: any) {
        if (err?.type === 'user_session_already_exists' || err?.code === 409) {
          await account.deleteSession('current');
          await account.createEmailPasswordSession(user.email, password);
        } else {
          throw err;
        }
      }
      const acc = await account.get();
      setUser(acc);
      removePin();
      toast.dismiss();
      toast.success(t('pin.pinResetSuccess') || 'PIN berhasil direset dengan verifikasi password akun');
      return true;
    } catch (e: any) {
      console.error('Failed to verify password for PIN reset:', e);
      toast.dismiss();
      toast.error(t('pin.wrongAccountPassword') || 'Password akun salah. Silakan coba lagi.');
      return false;
    }
  };

  const logout = async () => {
    try {
      try {
        await account.deleteSessions();
      } catch {
        try {
          const sessionList = await account.listSessions();
          await Promise.all(
            sessionList.sessions.map((s) => account.deleteSession(s.$id).catch(() => {}))
          );
        } catch {
          await account.deleteSession('current').catch(() => {});
        }
      }
      autoSyncedUserRef.current = null;
      await db.setDatabaseUser(null);
      setUser(null);
      localStorage.removeItem('tautanlumina:current_user_email');
      localStorage.removeItem('tautanlumina:cached_user');
      localStorage.removeItem('tautanlumina:cached_user_id');
      localStorage.removeItem('tautanlumina:deleted_ids');
      window.dispatchEvent(new Event('tautanlumina:user_changed'));
      toast.dismiss();
      toast.info(t('toast.loggedOut') || 'Berhasil keluar dari semua sesi', { duration: 1500 });
    } catch (e: any) {
      toast.dismiss();
      toast.error(t('toast.logoutError') || 'Gagal keluar', { duration: 1500 });
    }
  };

  const logoutOtherDevices = async () => {
    try {
      const currentSession = await account.getSession('current');
      const sessionList = await account.listSessions();
      const otherSessions = sessionList.sessions.filter((s) => s.$id !== currentSession.$id);

      if (otherSessions.length === 0) {
        toast.dismiss();
        toast.info(t('settings.noOtherSessions') || 'Tidak ada sesi perangkat lain yang aktif', { duration: 2000 });
        return true;
      }

      await Promise.all(
        otherSessions.map((s) => account.deleteSession(s.$id).catch((e) => console.warn('Failed to delete session', s.$id, e)))
      );

      toast.dismiss();
      toast.success(
        t('settings.loggedOutOtherDevices') || `Berhasil keluar dari ${otherSessions.length} perangkat lain`,
        { duration: 2500 }
      );
      return true;
    } catch (e: any) {
      console.error('Failed to logout other devices:', e);
      toast.dismiss();
      toast.error(t('settings.logoutOtherDevicesError') || 'Gagal mengeluarkan perangkat lain', { duration: 2000 });
      return false;
    }
  };

  const syncInProgressRef = useRef(false);
  const pendingQueuedSyncRef = useRef(false);
  const debounceTimerRef = useRef<any>(null);
  const lastSyncedStrRef = useRef<string>('');

  const executeSync = async (userOverride?: any, suppressToast: boolean = false) => {
    const targetUser = userOverride || user;
    if (!targetUser) return;

    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      return;
    }

    if (syncInProgressRef.current) {
      pendingQueuedSyncRef.current = true;
      return;
    }

    syncInProgressRef.current = true;
    setSyncing(true);
    const toastId = suppressToast ? null : toast.loading(t('toast.syncing'));

    try {
      const docId = getSyncDocId(targetUser.$id);
      const [cloudDoc, currentLocalItems] = await Promise.all([
        databases.getDocument(APPWRITE_DATABASE_ID, APPWRITE_COLLECTION_ID, docId).catch((err: any) => {
          if (err.code !== 404 && err.code !== 403) throw err;
          return null;
        }),
        db.getAllItems()
      ]);

      const localApiKey = localStorage.getItem('tautanlumina:ai-key') || '';
      const localModel = localStorage.getItem('tautanlumina:ai-model') || '';
      const localPinHash = getStoredPinHash();
      const localPinUpdatedAt = getStoredPinUpdatedAt();

      let localDeletedIds: string[] = [];
      try {
        const stored = localStorage.getItem('tautanlumina:deleted_ids');
        if (stored) {
          localDeletedIds = JSON.parse(stored);
        }
      } catch (e) {}

      if (!cloudDoc) {
        const finalDataStr = JSON.stringify({ 
          app: 'plaintxtai', 
          version: 1, 
          items: currentLocalItems,
          deletedIds: localDeletedIds,
          apiKey: localApiKey,
          model: localModel,
          pinHash: localPinHash,
          pinUpdatedAt: localPinUpdatedAt
        });

        let dbDataValue = finalDataStr;
        let newFileId: string | null = null;
        if (finalDataStr.length > 60000) {
          newFileId = ID.unique();
          const file = new File([finalDataStr], `sync_data_${targetUser.$id}.json`, { type: 'application/json' });
          await storage.createFile(
            APPWRITE_BUCKET_ID,
            newFileId,
            file,
            [
              Permission.read(Role.user(targetUser.$id)),
              Permission.update(Role.user(targetUser.$id)),
              Permission.delete(Role.user(targetUser.$id))
            ]
          );
          dbDataValue = JSON.stringify({
            type: 'storage_ref',
            fileId: newFileId,
            version: 1,
            app: 'plaintxtai'
          });
        }

        await databases.createDocument(
          APPWRITE_DATABASE_ID, 
          APPWRITE_COLLECTION_ID, 
          docId, 
          { 
            data: dbDataValue,
            email: targetUser.email
          },
          [
            Permission.read(Role.user(targetUser.$id)),
            Permission.update(Role.user(targetUser.$id)),
            Permission.delete(Role.user(targetUser.$id)),
            Permission.read(Role.users()),
            Permission.update(Role.users()),
            Permission.delete(Role.users())
          ]
        );
        lastSyncedStrRef.current = finalDataStr;
        if (toastId) toast.success('diperbarui', { id: toastId, duration: 1500 });
        return;
      }

      let cloudDataJson = '';
      let existingStorageFileId: string | null = null;
      if (cloudDoc && cloudDoc.data) {
        try {
          const parsed = JSON.parse(cloudDoc.data);
          if (parsed && parsed.type === 'storage_ref' && parsed.fileId) {
            existingStorageFileId = parsed.fileId;
            const fileResult = await storage.getFileDownload(APPWRITE_BUCKET_ID, parsed.fileId);
            const res = await fetch(fileResult.toString());
            cloudDataJson = await res.text();
          } else {
            cloudDataJson = cloudDoc.data;
          }
        } catch {
          cloudDataJson = cloudDoc.data;
        }
      }

      let parsedCloud;
      try {
        parsedCloud = JSON.parse(cloudDataJson);
      } catch {
        parsedCloud = { items: [] };
      }

      const rawCloudItems: FileSystemItem[] = Array.isArray(parsedCloud) ? parsedCloud : (Array.isArray(parsedCloud?.items) ? parsedCloud.items : []);
      const cloudDeletedIds: string[] = Array.isArray(parsedCloud?.deletedIds) ? parsedCloud.deletedIds : [];

      const cloudApiKey = parsedCloud.apiKey || '';
      const cloudModel = parsedCloud.model || '';
      const cloudPinHash = typeof parsedCloud.pinHash === 'string' ? parsedCloud.pinHash : '';
      const cloudPinUpdatedAt = typeof parsedCloud.pinUpdatedAt === 'number' ? parsedCloud.pinUpdatedAt : 0;

      let mergedPinHash = localPinHash;
      let mergedPinUpdatedAt = localPinUpdatedAt;

      if (cloudPinUpdatedAt > localPinUpdatedAt) {
        mergedPinHash = cloudPinHash;
        mergedPinUpdatedAt = cloudPinUpdatedAt;
        setStoredPinHash(cloudPinHash, cloudPinUpdatedAt);
      } else if (localPinHash && !cloudPinHash && cloudPinUpdatedAt === 0) {
        mergedPinHash = localPinHash;
        mergedPinUpdatedAt = localPinUpdatedAt || Date.now();
        setStoredPinHash(localPinHash, mergedPinUpdatedAt);
      } else if (!localPinHash && cloudPinHash && localPinUpdatedAt === 0) {
        mergedPinHash = cloudPinHash;
        mergedPinUpdatedAt = cloudPinUpdatedAt || Date.now();
        setStoredPinHash(cloudPinHash, mergedPinUpdatedAt);
      } else {
        mergedPinHash = localPinHash;
        mergedPinUpdatedAt = localPinUpdatedAt;
      }

      const permanentlyDeletedSet = new Set<string>([...cloudDeletedIds, ...localDeletedIds]);

      const itemMap = new Map<string, FileSystemItem>();

      for (const item of rawCloudItems) {
        if (permanentlyDeletedSet.has(item.id)) continue;
        itemMap.set(item.id, item);
      }

      for (const item of currentLocalItems) {
        if (permanentlyDeletedSet.has(item.id)) continue;
        const existing = itemMap.get(item.id);
        if (!existing || (item.updatedAt || 0) >= (existing.updatedAt || 0)) {
          itemMap.set(item.id, item);
        }
      }

      // Sanitasi item yang digabung agar duplikat dari cloud/lokal langsung dibersihkan
      const rawMergedList = Array.from(itemMap.values()).map(it => {
        if (it.id === 'folder-pharse' && it.name !== 'frasa') {
          return { ...it, name: 'frasa', parentId: null };
        }
        if (it.id === 'folder-clipkey' && it.name !== 'clipboard') {
          return { ...it, name: 'clipboard', parentId: null };
        }
        if (it.type === 'folder' && !it.name?.trim()) {
          return { ...it, name: 'Folder' };
        }
        if (!mergedPinHash && it.type === 'folder' && it.locked) {
          return { ...it, locked: false };
        }
        return it;
      });

      const isClipboardTarget = (folderId: string | null): boolean => {
        let cur = folderId;
        const visited = new Set<string>();
        while (cur && !visited.has(cur)) {
          visited.add(cur);
          if (cur === 'folder-clipkey' || cur === 'folder-catatan') return true;
          const parent = rawMergedList.find((i) => i.id === cur);
          cur = parent ? parent.parentId : null;
        }
        return false;
      };

      const normalizeUrl = (url?: string | null): string => {
        if (!url) return '';
        return url
          .trim()
          .toLowerCase()
          .replace(/^https?:\/\//i, '')
          .replace(/^www\./i, '')
          .replace(/\/+$/, '');
      };

      // Bersihkan duplikat bookmark di luar folder clipboard dari data cloud/lokal
      const seenUrls = new Map<string, FileSystemItem>();
      const dedupedList: FileSystemItem[] = [];

      for (const it of rawMergedList) {
        if (it.type === 'file' && it.content && !isClipboardTarget(it.parentId)) {
          const norm = normalizeUrl(it.content);
          if (norm) {
            if (seenUrls.has(norm)) {
              // Hapus duplikat secara permanen (tambahkan ke permanentlyDeletedSet)
              permanentlyDeletedSet.add(it.id);
              continue;
            } else {
              seenUrls.set(norm, it);
            }
          }
        } else if (it.type === 'phrase' || it.parentId === 'folder-pharse') {
          const norm = (it.content || '').trim().toLowerCase();
          if (norm) {
            const phraseKey = `phrase:${norm}`;
            if (seenUrls.has(phraseKey)) {
              permanentlyDeletedSet.add(it.id);
              continue;
            } else {
              seenUrls.set(phraseKey, it);
            }
          }
        }
        dedupedList.push(it);
      }

      // Perbarui judul bookmark sesuai aturan (domain utama menampilkan domainnya, folder mengecualikan domain)
      const titledList = dedupedList.map(it => {
        if (it.type === 'file' && it.content) {
          const isInsideFolder = Boolean(it.parentId);
          const expectedTitle = extractTitleFromUrl(it.content, isInsideFolder);
          if (it.name !== expectedTitle) {
            return { ...it, name: expectedTitle };
          }
        }
        return it;
      });

      // Pengelompokan domain otomatis jika ada 4+ bookmark domain sama
      const groupRes = groupBookmarksByDomain(titledList, () => ID.unique());
      if (groupRes.deletedFolders && groupRes.deletedFolders.length > 0) {
        groupRes.deletedFolders.forEach(id => permanentlyDeletedSet.add(id));
      }

      const mergedItems = groupRes.updatedAll;

      const mergedApiKey = localApiKey || cloudApiKey;
      const mergedModel = localModel || cloudModel;

      const updatedDeletedIds = Array.from(permanentlyDeletedSet).slice(-1000);
      try {
        localStorage.setItem('tautanlumina:deleted_ids', JSON.stringify(updatedDeletedIds));
      } catch (e) {}

      // Skip redundant IndexedDB imports if local items are already in sync with mergedItems
      const currentLocalStr = JSON.stringify(currentLocalItems);
      const mergedItemsStr = JSON.stringify(mergedItems);
      if (currentLocalStr !== mergedItemsStr) {
        await importJSON(JSON.stringify({ 
          items: mergedItems, 
          apiKey: mergedApiKey, 
          model: mergedModel 
        }), true, undefined, true);
      }

      if (mergedApiKey) {
        localStorage.setItem('tautanlumina:ai-key', mergedApiKey);
      }
      if (mergedModel) {
        localStorage.setItem('tautanlumina:ai-model', mergedModel);
      }

      const finalDataStr = JSON.stringify({ 
        app: 'plaintxtai', 
        version: 1, 
        items: mergedItems,
        deletedIds: updatedDeletedIds,
        apiKey: mergedApiKey,
        model: mergedModel,
        pinHash: mergedPinHash,
        pinUpdatedAt: mergedPinUpdatedAt
      });

      // Optimization: Skip remote update if cloud and local data string is unchanged
      if (finalDataStr === cloudDataJson) {
        lastSyncedStrRef.current = finalDataStr;
        if (toastId) toast.success('diperbarui', { id: toastId, duration: 1500 });
        return;
      }

      let dbDataValue = finalDataStr;
      let newFileId: string | null = null;

      if (finalDataStr.length > 60000) {
        newFileId = ID.unique();
        const file = new File([finalDataStr], `sync_data_${targetUser.$id}.json`, { type: 'application/json' });
        await storage.createFile(
          APPWRITE_BUCKET_ID,
          newFileId,
          file,
          [
            Permission.read(Role.user(targetUser.$id)),
            Permission.update(Role.user(targetUser.$id)),
            Permission.delete(Role.user(targetUser.$id))
          ]
        );
        dbDataValue = JSON.stringify({
          type: 'storage_ref',
          fileId: newFileId,
          version: 1,
          app: 'plaintxtai'
        });
      }

      if (dbDataValue !== cloudDoc.data) {
        await databases.updateDocument(APPWRITE_DATABASE_ID, APPWRITE_COLLECTION_ID, docId, {
          data: dbDataValue,
          email: targetUser.email
        });
      }

      if (existingStorageFileId && existingStorageFileId !== newFileId) {
        try {
          await storage.deleteFile(APPWRITE_BUCKET_ID, existingStorageFileId);
        } catch {}
      }

      lastSyncedStrRef.current = finalDataStr;
      if (toastId) toast.success('diperbarui', { id: toastId, duration: 1500 });
    } catch (e: any) {
      console.warn('SmartSync error details:', e);
      if (toastId) {
        const isNetworkOrServerErr = 
          e?.message?.includes('NetworkError') || 
          e?.message?.includes('fetch') || 
          e?.message?.includes('Server Error') ||
          e?.code === 500 || 
          e?.code === 502 || 
          e?.code === 503 ||
          !navigator.onLine;

        let errorMsg = isNetworkOrServerErr 
          ? (t('toast.syncError') || 'Gagal terhubung ke server Appwrite')
          : t('toast.syncError');

        const isDeveloper = targetUser?.email?.toLowerCase() === ADMIN_EMAIL;
        if (isDeveloper && e?.message && !isNetworkOrServerErr) {
          errorMsg = `${t('toast.syncError')}: ${e.message}`;
        }
        toast.error(errorMsg, { id: toastId, duration: 3000 });
      }
    } finally {
      syncInProgressRef.current = false;
      setSyncing(false);

      if (pendingQueuedSyncRef.current) {
        pendingQueuedSyncRef.current = false;
        setTimeout(() => {
          executeSync(targetUser, true);
        }, 300);
      }
    }
  };

  const smartSync = useCallback((userOverrideOrSuppress?: any, maybeSuppressToast?: boolean) => {
    let userOverride: any = undefined;
    let suppressToast = false;
    if (typeof userOverrideOrSuppress === 'boolean') {
      suppressToast = userOverrideOrSuppress;
    } else {
      userOverride = userOverrideOrSuppress;
      suppressToast = !!maybeSuppressToast;
    }

    if (suppressToast) {
      // Debounce auto background syncs to batch rapid changes
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      debounceTimerRef.current = setTimeout(() => {
        executeSync(userOverride, true);
      }, 600);
      return Promise.resolve();
    } else {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      return executeSync(userOverride, false);
    }
  }, [user, importJSON, t]);

  // Sinkronisasi hanya berjalan saat aksi modifikasi data
  useEffect(() => {
    if (!user) return;

    const handleDataModified = () => {
      if (!user) return;
      smartSync(true);
    };

    window.addEventListener('tautanlumina:data_modified', handleDataModified);
    return () => {
      window.removeEventListener('tautanlumina:data_modified', handleDataModified);
    };
  }, [user, smartSync]);

  const purgeSyncHistory = useCallback(async () => {
    try {
      localStorage.removeItem('tautanlumina:deleted_ids');
      if (user && user.$id) {
        const docId = getSyncDocId(user.$id);
        const cloudDoc = await databases.getDocument(APPWRITE_DATABASE_ID, APPWRITE_COLLECTION_ID, docId).catch(() => null);
        if (cloudDoc && cloudDoc.data) {
          let parsed: any;
          try {
            parsed = JSON.parse(cloudDoc.data);
          } catch {
            parsed = null;
          }
          if (parsed && typeof parsed === 'object') {
            parsed.deletedIds = [];
            const updatedDataStr = JSON.stringify(parsed);
            if (updatedDataStr !== cloudDoc.data) {
              await databases.updateDocument(APPWRITE_DATABASE_ID, APPWRITE_COLLECTION_ID, docId, {
                data: updatedDataStr,
                email: user.email
              });
              lastSyncedStrRef.current = updatedDataStr;
            }
          }
        }
      }
      return true;
    } catch (err) {
      console.warn('Failed to purge sync history in cloud:', err);
      return false;
    }
  }, [user]);

  const clearCloudData = useCallback(async () => {
    try {
      if (user && user.$id) {
        const docId = getSyncDocId(user.$id);
        const cloudDoc = await databases.getDocument(APPWRITE_DATABASE_ID, APPWRITE_COLLECTION_ID, docId).catch(() => null);
        if (cloudDoc) {
          const emptyData = JSON.stringify({
            app: 'plaintxtai',
            version: 1,
            items: [],
            deletedIds: [],
            apiKey: '',
            model: '',
            pinHash: '',
            pinUpdatedAt: 0
          });
          await databases.updateDocument(APPWRITE_DATABASE_ID, APPWRITE_COLLECTION_ID, docId, {
            data: emptyData,
            email: user.email
          });
          lastSyncedStrRef.current = emptyData;
        }
      }
      return true;
    } catch (e) {
      console.warn('Failed to clear cloud data:', e);
      return false;
    }
  }, [user]);

  return {
    user,
    loading,
    syncing,
    login,
    register,
    verifyEmail,
    resetPassword,
    updatePasswordRecovery,
    verifyPasswordAndResetPin,
    logout,
    logoutOtherDevices,
    smartSync,
    purgeSyncHistory,
    clearCloudData
  };
}
