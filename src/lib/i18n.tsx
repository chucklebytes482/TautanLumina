import React, { createContext, useContext, ReactNode } from 'react';
import { missingTranslations } from './i18n-missing';

export type LanguageCode = 'id';

export const translations = {
  id: {
    room1Announcements: 'Ruang 1: Pengumuman',
    room2AdminChat: 'Ruang 2: Chat Admin',
    micNotSupported: 'Perangkat Anda tidak mendukung perekaman suara.',
    micNotAllowed: 'Akses mikrofon tidak diizinkan. Silakan izinkan akses mikrofon di pengaturan browser Anda atau buka aplikasi di Tab Baru.',
    micPermissionDenied: 'Izin mikrofon tidak diberikan atau perangkat mikrofon tidak ditemukan.',
    cancel: 'Batal',
    recording: 'Merekam...',
    done: 'Selesai',
    previewVoiceMsg: 'Pratinjau Pesan Suara',
    listenBeforeSend: '• Dengarkan sebelum kirim',
    send: 'Kirim',
    recordVoiceChat: 'Rekam Voice Chat (Maks 30 detik)',
    voice: 'Voice',
    typeReply: 'Ketik balasan...',
    typeMessage: 'Ketik pesan Anda di sini...',
    voiceMessage: 'Pesan Suara',
    unreadMessages: 'Pesan Belum Dibaca',
    writeAnnouncement: 'Tulis pengumuman...',
    message: 'Pesan',
    admin: 'Admin',
    searchConversation: 'Cari percakapan...',
    deleteAll: 'Hapus Semua',
    searching: 'Mencari...',
    noMessages: 'Belum ada pesan.',
    delete: 'Hapus',
    adminLumina: 'Admin TautanLumina',
    announcements: 'Pengumuman',
    myMessages: 'Pesan Saya',
    doneAndPreview: 'Selesai & Pratinjau Suara',
    pause: 'Jeda',
    playPreview: 'Putar Pratinjau',
    you: 'Anda',
    justNow: 'Baru saja',
    today: 'Hari ini',
    yesterday: 'Kemarin',
    sendToAdmin: 'Kirim Pesan ke Admin',
    back: 'Kembali',
    close: 'Tutup',
    refresh: 'Refresh',
    deleteSuccess: 'Berhasil dihapus',
    deleteConfirm: 'Yakin ingin menghapus?'
  }
};

const I18nContext = createContext<{ lang: LanguageCode; setLang: (l: any) => void; t: any } | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const lang: LanguageCode = 'id';
  const setLang = () => {};

  const tObj = translations.id;
  const missingObj = (missingTranslations as any).id || (missingTranslations as any).en || {};

  // A helper function that works both as t('nested.key') AND t.someProp
  const tFn = (key: string) => {
    const keys = key.split('.');
    let val: any = missingObj;
    for (const k of keys) {
      if (val && val[k] !== undefined) {
        val = val[k];
      } else {
        let fallback: any = (missingTranslations as any).id || (missingTranslations as any).en;
        for (const fk of keys) {
          if (fallback && fallback[fk] !== undefined) fallback = fallback[fk];
          else { fallback = key; break; }
        }
        val = fallback;
        break;
      }
    }
    return val;
  };

  const tProxy = new Proxy(tFn, {
    get(target, prop) {
      if (typeof prop === 'string' && prop in tObj) {
        return (tObj as any)[prop];
      }
      return Reflect.get(target, prop);
    }
  });

  return <I18nContext.Provider value={{ lang, setLang, t: tProxy }}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within I18nProvider');
  }
  return context;
}
