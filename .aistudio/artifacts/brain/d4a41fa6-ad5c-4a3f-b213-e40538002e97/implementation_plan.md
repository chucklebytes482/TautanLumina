# Pencegahan & Penggabungan Folder Otomatis Duplikat

Rencana implementasi untuk mencegah terbentuknya duplikat pada folder otomatis (berdasarkan domain), serta mendeteksi dan menggabungkan (*merge*) folder otomatis yang telah terlanjur duplikat di dalam folder induk yang sama.

---

### User Review & Critical Decisions

> [!IMPORTANT]
> **Keputusan Berdasarkan Klarifikasi Pengguna:**
> 1. **Penanganan Folder Duplikat yang Sudah Ada**: Jika ditemukan dua atau lebih folder dengan nama domain yang sama di dalam folder induk yang sama, sistem akan otomatis memindahkan seluruh item anak dari folder-folder duplikat ke dalam folder utama (*primary folder*), kemudian menghapus folder duplikat yang berlebih dari penyimpanan.
> 2. **Batasan / Cakupan Pengecekan**: Pengecekan duplikasi berlaku per folder induk yang sama (*same parent folder*). Dua folder dengan nama sama di lokasi folder induk yang berbeda tidak akan dianggap duplikat.
> 3. **Pencegahan Saat Pembuatan Baru (*Idempotent Grouping*)**: Algoritma pengelompokan domain akan selalu memeriksa folder yang sudah ada (secara *case-insensitive*) sebelum memutuskan membuat folder baru, serta mencegah eksekusi konkurensi ganda saat memuat data.

---

### 1. Overview & Core Concept

- **Tujuan**: Menjaga kebersihan dan kerapian struktur folder bookmark sehingga setiap domain hanya memiliki 1 folder tunggal di setiap direktori/level induk.
- **Masalah yang Diatasi**: Saat sinkronisasi atau pemuatan data berjalan, proses otomatis dapat membuat lebih dari satu folder untuk domain yang sama (misalnya: dua folder `youtube.com` di root).
- **Hasil yang Diharapkan**:
  - Hanya ada 1 folder per domain di tingkat folder induk yang sama.
  - Semua bookmark dari domain tersebut terkumpul di folder tunggal tersebut.
  - Folder duplikat yang kosong setelah dipindahkan dihapus dari database.

---

### 2. User Experience & Visual Design

- **Tampilan Bersih & Rapi**:
  - Pengguna tidak akan melihat folder kembar dengan nama yang sama.
  - Saat membuka folder domain, semua bookmark domain tersebut langsung terkumpul dalam satu tempat.
- **Otomatis & Tanpa Gangguan**:
  - Proses pembersihan dan penggabungan berjalan otomatis saat data dimuat (*reload*).
  - Tidak ada data bookmark yang hilang; hanya kontainer folder duplikat yang dirapikan.

---

### 3. Key Product Decisions & Trade-Offs

- **Strategi Pemilihan Folder Utama (*Primary Folder Selection*)**:
  - *Pendekatan*: Folder dengan tanggal pembuatan paling awal atau yang memiliki ID tetap dipertahankan sebagai folder utama.
  - *Alasan*: Menjaga konsistensi referensi ID dan urutan posisi folder.
- **Migrasi Anak Item (*Child Reassignment*)**:
  - *Pendekatan*: Seluruh item anak (file bookmark atau subfolder) yang sebelumnya menginduk pada folder duplikat diperbarui `parentId`-nya ke ID folder utama.
- **Pembersihan Database Bersih**:
  - *Pendekatan*: Folder duplikat yang telah dikosongkan dihapus dari IndexedDB via `db.deleteItems(...)`.

---

### 4. Technical Architecture & Data Strategy

```
┌────────────────────────────────────────────────────────┐
│            Evaluasi Folder di Parent yang Sama         │
│               (parentId === targetParentId)            │
└───────────────────────────┬────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────┐
│    1. Deteksi Folder dengan Nama Domain Sama (Map)     │
│       Key: `${parentId || 'root'}:${lowerDomain}`      │
└───────────────────────────┬────────────────────────────┘
                            │
            ┌───────────────┴───────────────┐
            ▼                               ▼
┌───────────────────────┐       ┌───────────────────────┐
│     Hanya 1 Folder    │       │   > 1 Folder Duplikat │
│   (Pertahankan Utuh)  │       └───────────┬───────────┘
└───────────────────────┘                   │
                                            ▼
                                ┌───────────────────────┐
                                │ 2. Pilih Folder Utama │
                                │    (Primary Folder)   │
                                └───────────┬───────────┘
                                            │
                                            ▼
                                ┌───────────────────────┐
                                │ 3. Pindahkan Semua    │
                                │    Item Anak ke Utama │
                                └───────────┬───────────┘
                                            │
                                            ▼
                                ┌───────────────────────┐
                                │ 4. Hapus Folder       │
                                │    Duplikat dari DB   │
                                └───────────────────────┘
```

#### Komponen & Modul yang Diperbarui:
1. **`src/lib/domainGrouper.ts`**:
   - Menambahkan fase dedup folder awal sebelum proses grouping berjalan:
     - Mengelompokkan folder berdasarkan `parentId` dan nama (case-insensitive).
     - Mengidentifikasi folder kembar/duplikat.
     - Mengalihkan referensi `parentId` anak ke folder utama dan mengumpulkan ID folder duplikat untuk dihapus (`deletedFolders: string[]`).
   - Memastikan saat grouping bookmark baru, folder yang sudah ada selalu digunakan ulang (*reused*) dan tidak pernah membuat folder baru jika nama domain sudah ada di level parent tersebut.
2. **`src/hooks/useFileSystem.ts`**:
   - Menerima `deletedFolders` dari hasil `groupBookmarksByDomain`.
   - Menghapus folder duplikat dari IndexedDB via `await db.deleteItems(deletedFolders)`.
   - Menggunakan referensi flag (*reload lock*) untuk mencegah eksekusi `reload()` paralel yang dapat memicu *race condition* saat pembuatan folder.

---

### Verifikasi & Uji Coba
- **Uji Coba Penggabungan Duplikat**:
  1. Jika terdapat dua folder dengan nama domain yang sama (misal `youtube.com` dan `youtube.com`) di root, setelah reload hanya tersisa satu folder `youtube.com`.
  2. Seluruh bookmark dari kedua folder tersebut kini berada di dalam satu folder tersebut.
- **Uji Coba Pencegahan**:
  1. Menambahkan bookmark baru dengan domain yang sudah memiliki folder otomatis.
  2. Memastikan bookmark langsung masuk ke folder yang ada dan TIDAK membuat folder baru.
- Menjalankan `compile_applet` dan `lint_applet` untuk memastikan build bersih tanpa error.
