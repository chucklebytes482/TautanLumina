import { createContext, useContext, ReactNode } from 'react';

export type LanguageCode = 'id';

const flatTranslations = {
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
  deleteConfirm: 'Yakin ingin menghapus?',
};

const nestedTranslations: Record<string, any> = {
  action: {
    cancel: 'Batal',
    delete: 'Hapus',
    editTitle: 'Edit Judul',
    itemsSelected: 'item terpilih',
    move: 'Pindah',
    moveItems: 'Pindah Item',
    moveToFolder: 'Pindah ke folder',
    moveToNum: 'Pindah ke posisi',
    paste: 'Tempel',
    regenerate: 'Generate ulang judul',
    rename: 'Ganti Nama',
    selected: 'Terpilih',
  },
  app: {
    heroDesc:
      'TautanLumina adalah pengelola bookmark & catatan yang cepat dan ultra-minimalis. Otomatisasi judul dari URL dengan kata dan spasi yang rapi, kunci folder PIN 4-digit, voice note 30 detik dengan pratinjau audio, urutan posisi Keypad Move, serta sinkronisasi Awan Appwrite.',
    tagline: 'Tautan Anda, Cerdas & Bercahaya.',
  },
  btn: {
    exportJSON: 'Ekspor JSON',
    importJSON: 'Impor JSON atau HTML',
    newBookmark: 'Bookmark Baru',
    newFolder: 'Folder Baru',
    newNote: 'Catatan Baru',
    newPhrase: 'Frasa (1x Klik Tempel)',
    selectAll: 'Pilih Semua',
  },
  chat: {
    title: 'Obrolan',
  },
  empty: {
    folder: 'Folder ini kosong',
    search: 'Tidak ada hasil',
  },
  guide: {
    title: 'Panduan Penggunaan',
    subtitle: 'Panduan ringkas fitur-fitur TautanLumina',
    searchPlaceholder: 'Cari topik panduan...',
  },
  feature: {
    aiTagging: {
      desc: 'Ekstraksi judul otomatis dari URL',
      title: 'Otomatisasi Judul URL',
    },
    cloudSync: {
      desc: 'Appwrite Cloud & penyimpanan lokal',
      title: 'Sinkronisasi Awan',
    },
    htmlImport: {
      desc: 'Cadangan HTML markah & JSON',
      title: 'Impor & Ekspor',
    },
    pinLock: {
      desc: 'Lindungi folder sensitif secara aman',
      title: 'Kunci PIN 4-Digit',
    },
    voiceChat: {
      desc: 'Pratinjau audio sebelum pesan dikirim',
      title: 'Obrolan Suara ≤30s',
    },
  },
  file: {
    bookmark: 'Markah',
    editContent: 'Edit Konten',
    folder: 'Folder',
    menu: 'Menu',
    note: 'Catatan',
  },
  note: {
    chars: 'karakter',
    lines: 'baris',
    clickToCopy: 'Klik untuk salin',
  },
  login: {
    createAccount: 'Buat Akun',
    email: 'Email',
    emailPlaceholder: 'Masukkan email',
    errorAlias: 'Alias email tidak valid',
    errorDisposable: 'Email sekali pakai dilarang',
    forgotDesc: 'Masukkan email untuk reset',
    forgotLink: 'Lupa kata sandi?',
    forgotTitle: 'Reset Kata Sandi',
    hasAccount: 'Sudah punya akun?',
    expandFeatures: 'Fitur App',
    collapseFeatures: 'Ciutkan',
    min8: 'Minimal 8 karakter',
    min8Alert: 'Kata sandi minimal 8 karakter',
    newPassword: 'Kata Sandi Baru',
    noAccount: 'Belum punya akun?',
    password: 'Kata Sandi',
    resetDesc: 'Atur kata sandi baru',
    resetTitle: 'Reset Kata Sandi',
    savePassword: 'Simpan',
    sendLink: 'Kirim Tautan',
    signIn: 'Masuk',
    signInDesc: 'Selamat datang kembali',
    signUp: 'Daftar',
    signUpDesc: 'Buat akun baru',
    welcome: 'Selamat Datang',
  },
  menu: {
    all: 'Semua',
    api: 'API',
    general: 'Umum',
    personal: 'Pribadi',
    profile: 'Profil',
    sync: 'Sinkron',
    wallet: 'Langganan',
  },
  modal: {
    bookmarkUrl: 'URL',
    cancel: 'Batal',
    done: 'Selesai',
    folderName: 'Nama Folder',
    newName: 'Nama Baru',
    newUrl: 'URL Baru',
    noteText: 'Konten Catatan',
  },
  move: {
    determinePosition: 'Tentukan posisi',
    enterPosition: 'Masukkan posisi',
    example: 'Contoh',
    maxPositionError: 'Kesalahan posisi maks',
    rangeError: 'Kesalahan jangkauan',
  },
  picker: {
    empty: 'Kosong',
    newFolder: 'Folder Baru',
    up: 'Ke atas',
  },
  pin: {
    enterAccountPassword: 'Kata Sandi Akun',
    enterPin: 'Masukkan PIN',
    folderLocked: 'Folder Terkunci',
    forgotPin: 'Lupa PIN? Reset dengan password',
    folderUnlockedSuccess: 'Folder Terbuka',
    lock: 'Kunci',
    lockedBadge: 'Terkunci',
    manageTitle: 'Kelola PIN',
    noFolders: 'Tidak ada Folder',
    pinResetSuccess: 'PIN Berhasil Direset',
    resetPinDesc: 'Reset PIN Anda',
    savePin: 'Simpan PIN',
    selectFolderToLock: 'Pilih folder dikunci',
    setSuccess: 'PIN Berhasil Diatur',
    setupTitle: 'Atur PIN',
    subfolderCannotLock: 'Subfolder tak dapat dikunci',
    unlockFolderDesc: 'Buka kunci untuk melihat konten',
    unlockingTitle: 'Membuka kunci',
    unlockPin: 'Buka PIN',
    lockPin: 'Kunci PIN',
    unlockTitle: 'Buka Kunci',
    verifyAccountPassword: 'Verifikasi Kata Sandi Akun',
    verifyResetPin: 'Verifikasi Reset PIN',
    wrong: 'PIN Salah',
    wrongAccountPassword: 'Kata sandi salah',
  },
  search: {
    placeholder: 'Cari...',
  },
  settings: {
    clipboardEmpty: 'Papan klip kosong',
    clipboardError: 'Kesalahan papan klip',
    export: {
      success: 'Berhasil diekspor',
    },
    import: {
      success: 'Berhasil diimpor',
      tooLarge: 'File terlalu besar',
    },
    logout: 'Keluar',
    managePin: 'Kelola PIN',
    managePinDesc: 'Kelola pengaturan PIN Anda',
    menu: 'Menu',
    pinActive: 'PIN Aktif',
    pinDesc: 'PIN melindungi folder',
    pinNotSet: 'PIN Belum Diatur',
    pinSecurity: 'Keamanan PIN',
    profile: {
      notLoggedIn: 'Belum masuk',
      title: 'Profil',
    },
    setNewPin: 'Atur PIN Baru',
  },
  sync: {
    export: {
      desc: 'Ekspor data Anda',
    },
    import: {
      desc: 'Impor data',
    },
    backup: {
      title: 'Cadangan Data',
    },
  },
  toast: {
    addressCopied: 'Alamat disalin',
    bookmarkSaved: 'Bookmark disimpan',
    cantMoveSearch: 'Tidak dapat dipindah',
    clipboardError: 'Kesalahan papan klip',
    copied: 'Disalin',
    copyFailed: 'Gagal menyalin',
    deleted: 'Dihapus',
    emailNotVerified: 'Email belum diverifikasi',
    emptyClipboard: 'Papan klip kosong',
    folderLocked: 'Folder dikunci',
    folderUnlocked: 'Folder dibuka',
    folderSystemCannotDelete: 'Tidak dapat dihapus',
    folderSystemCannotRename: 'Tidak dapat diubah',
    folderSystemCannotLock: 'Tidak dapat dikunci',
    invalidFileFormat: 'Format tidak valid',
    bookmarkSaveFailed: 'Gagal simpan',
    importBookmarksSuccess: '{count} bookmark diimpor',
    folderOpened: 'Folder dibuka',
    invalidCredentials: 'Email atau password salah',
    userAlreadyExists: 'Email sudah terdaftar',
    userEmailNotFound: 'Email tidak ditemukan',
    invalidUrl: 'URL tidak valid',
    lockedItem: 'Item terkunci',
    loggedOut: 'Keluar',
    loginError: 'Gagal masuk',
    loginSuccess: 'Berhasil masuk',
    logoutError: 'Gagal keluar',
    moved: 'Dipindahkan',
    noBookmarksInFolder: 'Tidak ada bookmark',
    noteSaved: 'Catatan disimpan',
    offlineModeNotice: 'Sinkronisasi otomatis ke cloud',
    offlineReadonlyNotice: 'Mode offline',
    onlineBack: 'Online kembali',
    otpWait: 'Mohon tunggu',
    passwordChanged: 'Password diubah',
    passwordChangeError: 'Gagal ubah password',
    proLimitComment: 'Batas 1 komentar per hari',
    proLimitFolderLock: 'Batas 1 folder terkunci',
    proLimitPrivateMsg: 'Batas 3 pesan per hari',
    proLimitRegenerate: 'Batas generate tercapai',
    regenerated: 'Judul diperbarui',
    regenerating: 'Memperbarui...',
    resetLinkError: 'Gagal kirim link reset',
    resetLinkSent: 'Tautan reset dikirim',
    saved: 'Disimpan',
    signupError: 'Gagal mendaftar',
    signupSuccess: 'Berhasil mendaftar',
    syncCompleted: 'Sinkronisasi selesai',
    syncError: 'Gagal sinkron',
    syncing: 'Menyinkronkan',
    syncOffline: 'Sinkronisasi offline',
    syncSuccess: 'Sinkronisasi berhasil',
    urlPasted: 'URL ditempel',
    verifyEmailError: 'Verifikasi gagal',
    verifyEmailSuccess: 'Verifikasi berhasil',
  },
  lang: {
    title: 'Bahasa',
  },
};

const tFn = (key: string): string => {
  const keys = key.split('.');
  let val: any = nestedTranslations;
  for (const k of keys) {
    if (val && val[k] !== undefined) {
      val = val[k];
    } else {
      return key;
    }
  }
  return typeof val === 'string' ? val : key;
};

const tProxy = new Proxy(tFn, {
  get(target, prop) {
    if (typeof prop === 'string' && prop in flatTranslations) {
      return (flatTranslations as any)[prop];
    }
    return Reflect.get(target, prop);
  },
});

const contextValue = {
  lang: 'id' as LanguageCode,
  setLang: () => {},
  t: tProxy,
};

const I18nContext = createContext<{ lang: LanguageCode; setLang: (l: any) => void; t: any } | null>(contextValue);

export function I18nProvider({ children }: { children: ReactNode }) {
  return <I18nContext.Provider value={contextValue}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within I18nProvider');
  }
  return context;
}
