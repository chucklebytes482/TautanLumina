# Pembersihan Isi Folder Clipboard & Pharse Saat Logout

Rencana ini direvisi sesuai instruksi spesifik pengguna: saat melakukan logout dari akun, data yang dihapus dari perangkat/browser **hanya isi dari folder clipboard dan folder pharse**. Kedua folder permanen tersebut (`clipboard` dan `pharse`) tetap ada di root, dan seluruh bookmark, folder domain, serta folder lainnya tetap tersimpan aman.

---

### User Review & Critical Decisions

> [!IMPORTANT]
> **Keputusan Spesifik Pembersihan Saat Logout:**
> 1. **Target Pembersihan**: Hanya item-item di dalam folder **`clipboard`** (`folder-clipkey`) dan folder **`Pharse`** (`folder-pharse`) beserta sub-item turunannya yang akan dihapus dari penyimpanan lokal (IndexedDB) dan memori.
> 2. **Folder Permanen Tetap Utuh**: Folder `clipboard` dan `Pharse` tidak akan dihapus, melainkan tetap berada di root (`/`) dalam kondisi kosong (tanpa isi).
> 3. **Semua Bookmark & Folder Lain Aman**: Tautan bookmark di root, folder otomatis per domain, serta folder kustom buatan pengguna **tidak akan tersentuh** dan tetap tersimpan di perangkat.
> 4. **Sesi Akun**: Sesi Appwrite tetap diputus dengan aman (`account.deleteSession('current')`).

---

### 1. Overview & Core Concept

- **Tujuan**: Menghapus catatan teks sementara (clipboard) dan frasa sensitif (pharse) saat pengguna keluar dari akun, sambil memastikan seluruh koleksi bookmark dan folder tautan tetap utuh di perangkat lokal.
- **Perilaku Saat Logout**:
  1. Pengguna menekan tombol **Keluar (Logout)**.
  2. Sesi login Appwrite diakhiri.
  3. Sistem memindai database lokal dan mengumpulkan semua item yang memiliki `parentId === 'folder-clipkey'` atau `parentId === 'folder-pharse'` (termasuk item di dalam sub-folder turunan keduanya).
  4. Menghapus item-item isi tersebut dari IndexedDB (`db.deleteItems(...)`).
  5. Jika pengguna sedang membuka folder `clipboard` atau `Pharse`, navigasi otomatis kembali ke root (`/`).
  6. Folder `clipboard` dan `Pharse` tetap tampil di urutan atas root sebagai folder permanen kosong.

---

### 2. User Experience & Visual Design

- **Alur Interaksi Saat Logout**:
  1. Pengguna membuka menu akun dan memilih **Keluar (Logout)**.
  2. Sistem menjalankan pembersihan selektif di background:
     - Mengakhiri sesi Appwrite.
     - Menghapus semua catatan di dalam folder `clipboard`.
     - Menghapus semua frase di dalam folder `Pharse`.
     - Memperbarui daftar item lokal secara reaktif.
  3. Toast konfirmasi muncul: *"Berhasil keluar. Isi clipboard & pharse telah dibersihkan."* (atau toast keluar standar yang bersih).
  4. Pengguna tetap melihat semua bookmark dan folder domain miliknya di antarmuka.

---

### 3. Key Product Decisions & Trade-Offs

- **Menghapus Hanya Isi (Bukan Folder Induk)**:
  - *Pendekatan*: Folder `folder-clipkey` dan `folder-pharse` memiliki ID tetap di root. Kita hanya mengidentifikasi item yang merupakan anak/keturunan (`isDescendant` atau `parentId`) dari kedua folder tersebut.
  - *Keuntungan*: Struktur navigasi tidak rusak, tidak perlu inisialisasi ulang folder, dan UI langsung siap menerima catatan atau frasa baru kapan saja.
- **Menghilangkan Pemanggilan `clearAll()`**:
  - *Sebelumnya*: `handleLogout` di `src/App.tsx` memanggil `await clearAll()`, yang menghapus seluruh database termasuk bookmark.
  - *Perbaikan*: Dihapus dan digantikan dengan fungsi terarah `clearClipboardAndPharseContents()`.

---

### 4. Technical Architecture & Data Strategy

```
┌────────────────────────────────────────────────────────┐
│                   Aksi Pengguna: Logout                │
└───────────────────────────┬────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────┐
│               1. Appwrite Server Session               │
│        account.deleteSession('current')                │
│        - Hapus sesi Appwrite & cache status akun       │
└───────────────────────────┬────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────┐
│      2. Pembersihan Isi: Clipboard & Pharse            │
│ ┌────────────────────────────────────────────────────┐ │
│ │  Cari semua item anak/keturunan dari:              │ │
│ │  - parentId === 'folder-clipkey' (Isi Clipboard)   │ │
│ │  - parentId === 'folder-pharse'  (Isi Pharse)      │ │
│ │  (Item 'folder-clipkey' & 'folder-pharse' DISIMPAN)│ │
│ │                                                    │ │
│ │  Jalankan: db.deleteItems(childItemIds)            │ │
│ └────────────────────────────────────────────────────┘ │
│ ┌────────────────────────────────────────────────────┐ │
│ │  Data yang DIBIARKAN UTUH:                         │ │
│ │  ✓ Semua Bookmark / Tautan (type: 'file')          │ │
│ │  ✓ Semua Folder Domain & Folder Pengguna           │ │
│ │  ✓ Folder 'clipboard' & 'Pharse' (kondisi kosong)  │ │
│ └────────────────────────────────────────────────────┘ │
└───────────────────────────┬────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────┐
│          3. Pembaruan State & Navigasi                 │
│       - Jika currentFolderId berada di clipboard       │
│         atau pharse, kembalikan ke root (null)         │
│       - Reset modal frase/catatan yang aktif           │
│       - Panggil reload() untuk memperbarui tampilan    │
└───────────────────────────┘
```

#### Modifikasi Kode yang Direncanakan:
1. **`src/hooks/useFileSystem.ts`**:
   - Menambahkan helper `clearClipboardAndPharseContents()`:
     ```ts
     const clearClipboardAndPharseContents = useCallback(async () => {
       const allDbItems = await db.getAllItems();
       const targetIds = allDbItems
         .filter(it => 
           it.id !== 'folder-clipkey' && 
           it.id !== 'folder-pharse' && 
           (
             it.parentId === 'folder-clipkey' || 
             it.parentId === 'folder-pharse' || 
             isDescendant('folder-clipkey', it.parentId || '') || 
             isDescendant('folder-pharse', it.parentId || '')
           )
         )
         .map(it => it.id);

       if (targetIds.length > 0) {
         await db.deleteItems(targetIds);
       }
       if (currentFolderId === 'folder-clipkey' || currentFolderId === 'folder-pharse' || isDescendant('folder-clipkey', currentFolderId || '') || isDescendant('folder-pharse', currentFolderId || '')) {
         setCurrentFolderId(null);
       }
       await reload();
       notifyDataModified();
     }, [currentFolderId, isDescendant, reload]);
     ```
   - Mengekspos fungsi `clearClipboardAndPharseContents` ke hook return object.
2. **`src/App.tsx`**:
   - Memperbarui `handleLogout`:
     ```ts
     const handleLogout = async () => {
       await logout();
       await clearClipboardAndPharseContents();
     };
     ```
   - Memastikan tidak ada pemanggilan `clearAll()`.
3. **`src/hooks/useAppwriteSync.ts`**:
   - Memastikan fungsi `logout()` hanya mengakhiri sesi Appwrite dan menghapus cache pengguna tanpa menghapus database lokal.

---

### Verifikasi & Uji Coba
- **Uji Coba Logout**:
  1. Buat catatan di folder `clipboard`.
  2. Buat frasa di folder `Pharse`.
  3. Buat beberapa bookmark dan folder reguler di root.
  4. Lakukan logout.
  5. Verifikasi:
     - Bookmark dan folder kustom tetap ada persis seperti semula.
     - Folder `clipboard` tetap ada di root, namun isinya 0 (kosong).
     - Folder `Pharse` tetap ada di root, namun isinya 0 (kosong).
- Jalankan `compile_applet` dan `lint_applet` untuk memastikan tidak ada error kompilasi.
