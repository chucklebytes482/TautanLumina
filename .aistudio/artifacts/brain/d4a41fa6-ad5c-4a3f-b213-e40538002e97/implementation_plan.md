# Pembersihan Aset & Optimasi Kode Tanpa Mengubah Perilaku Fitur

Merampingkan aplikasi TautanLumina dengan menghapus seluruh aset tangkapan layar sementara, menyatukan kamus Bahasa Indonesia, serta membersihkan kode mati dan duplikasi logika internal tanpa mengubah antarmuka maupun perilaku fitur yang ada.

## User Review & Critical Decisions

> [!IMPORTANT]
> Seluruh pembersihan dilakukan secara non-destruktif terhadap fitur aktif. Fungsionalitas utama (Bookmark, Folder Otomatis Domain, Clipboard, Frasa BIP-39, Keamanan PIN 4-Digit, Chat/Pengumuman, dan Sinkronisasi Appwrite Cloud) tetap 100% identik secara visual maupun perilaku.

- **Keputusan Terkonfirmasi 1 (Cakupan Pembersihan File)**: Menghapus seluruh file yang tidak terpakai termasuk aset tangkapan layar riwayat percakapan, dokumentasi internal yang tidak dirujuk aplikasi, serta menyatukan kamus terjemahan Bahasa Indonesia sehingga kamus multibahasa asing yang tidak terpakai dapat dihapus.
- **Keputusan Terkonfirmasi 2 (Fokus Optimasi)**: Fokus penuh pada pembersihan kode mati (*dead code*), fungsi yang tidak lagi dipanggil, dan penyatuan duplikasi logika sanitasi/normalisasi URL tanpa mengubah alur kerja aplikasi.

---

## 1. Overview & Core Concept

- **What It Does**: Menghilangkan beban file statis yang tidak terpakai, memangkas kamus terjemahan multibahasa yang tidak digunakan (karena aplikasi menggunakan Bahasa Indonesia tunggal), menghapus fungsi warisan (*legacy helpers*) yang sudah tidak dipanggil, serta menyatukan logika normalisasi dan sanitasi data di antara modul lokal dan sinkronisasi awan.
- **Target Audience / Persona**: Pengguna TautanLumina yang menginginkan aplikasi yang ringan, cepat dimuat, dan bebas dari beban skrip atau aset sisa pengembangan.
- **Key Value**: Ukuran *bundle* aplikasi lebih kecil, basis kode lebih bersih dan mudah dipelihara, serta konsistensi 100% antara aturan pembersihan lokal dan sinkronisasi cloud.

---

## 2. User Experience & Visual Design

- **Key User Flows**:
  - Seluruh alur pengguna tetap berjalan persis seperti saat ini:
    1. Penambahan bookmark melalui modal input dengan validasi domain dan anti-duplikat.
    2. Penambahan catatan clipboard dan frasa BIP-39 (1x klik tempel).
    3. Pengelompokan otomatis domain ketika mencapai minimal 4 bookmark.
    4. Tombol terpadu **Perbarui & Sinkronisasi** yang membersihkan duplikat, menormalisasi judul bookmark, dan menyinkronkan ke Appwrite Cloud.
- **Visual Identity & Theme**:
  - *Aesthetic Direction*: Ultra-minimalis, bersih, dan hangat sesuai identitas TautanLumina saat ini.
  - *Color Palette & Mood*: Mempertahankan permukaan krem hangat (`#faf8f5`), kartu putih bersih (`#ffffff`), perbatasan halus (`#e2ddd5`), dan aksen utama oranye terang (`#FF4F00`).
  - *Typography & Hierarchy*: Mempertahankan tipografi sistem dan hierarki padat yang responsif di perangkat seluler maupun desktop.
- **Interactive Feedback & Motion**:
  - Semua dialog konfirmasi, modal input, indikator putar (*spin*) saat sinkronisasi, dan notifikasi *toast* tetap memberikan respons yang sama tanpa perubahan perilaku.

---

## 3. Key Product Decisions & Trade-Offs

- **Keputusan 1: Penyatuan Kamus Bahasa Indonesia Tunggal**
  - *Chosen Approach*: Memindahkan hanya entri Bahasa Indonesia yang dibutuhkan langsung ke penyedia bahasa utama dan menghapus kamus bahasa asing (`en`, `zh`, `ja`, `ko`, `es`, `ru`) beserta kunci-kunci fitur warisan (seperti konfigurasi AI Key, model picker, dan langganan kripto) yang sudah tidak digunakan.
  - *Why*: Aplikasi telah menetapkan Bahasa Indonesia sebagai bahasa tunggal. Menghapus ribuan baris terjemahan bahasa asing menghemat puluhan kilobyte ukuran *bundle* JavaScript secara instan.
  - *Alternatives Considered*: Membiarkan kamus multibahasa tetap terpisah; ditolak karena membebani ukuran unduhan awal tanpa manfaat bagi pengguna.

- **Keputusan 2: Penyatuan Logika Normalisasi & Sanitasi Bookmark**
  - *Chosen Approach*: Menyatukan fungsi bantu normalisasi URL dan deteksi folder sistem/clipboard agar digunakan bersama oleh pengelola penyimpanan lokal, fitur Perbarui, dan modul sinkronisasi Appwrite.
  - *Why*: Sebelumnya fungsi normalisasi URL dan pengecekan hierarki folder ditulis berulang di beberapa modul. Menyatukannya menghilangkan duplikasi logika dan mencegah ketidaksinkronan aturan.
  - *Alternatives Considered*: Membiarkan fungsi duplikat di masing-masing kait (*hook*); ditolak karena rawan menimbulkan perbedaan perilaku saat aturan diperbarui.

- **Keputusan 3: Penghapusan Fungsi & Ekspor Mati (*Dead Code*)**
  - *Chosen Approach*: Menghapus fungsi pengurutan papan ketik lama (*QWERTY sort*) yang sudah digantikan pengurutan alfabetis, menghapus fungsi ekstraksi label lama yang tidak terpakai, serta membersihkan ekspor dan properti/state yang tidak pernah dipanggil di komponen antarmuka.
  - *Why*: Menjaga kode tetap ramping dan bebas dari fungsi yatim (*orphan functions*).

---

## 4. Technical Architecture & Data Strategy *(Technical Reference)*

- **Architecture & Component Diagram**:

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        Antarmuka Utama (App View)                       │
│  ┌──────────────────┐  ┌────────────────────┐  ┌─────────────────────┐  │
│  │  Header & Tools  │  │    FileBrowser     │  │   Modals & Drawers  │  │
│  │ (Cari, Perbarui, │  │ (Daftar Folder,    │  │ (Dialog, PinModal,  │  │
│  │  Tambah Item)    │  │  Bookmark, Frasa)  │  │  Chat, Settings)    │  │
│  └────────┬─────────┘  └─────────┬──────────┘  └──────────┬──────────┘  │
└───────────┼──────────────────────┼────────────────────────┼─────────────┘
            │                      │                        │
            ▼                      ▼                        ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                   Lapisan Logika & State (Custom Hooks)                 │
│  ┌─────────────────────────────────┐  ┌──────────────────────────────┐  │
│  │       useFileSystem Hook        │◄─┤     useAppwriteSync Hook     │  │
│  │ (CRUD, Urutan A-Z, Pembersihan) │  │ (Sinkronisasi & Sanitasi)    │  │
│  └────────────────┬────────────────┘  └──────────────┬───────────────┘  │
└───────────────────┼──────────────────────────────────┼──────────────────┘
                    │                                  │
                    ▼                                  ▼
┌─────────────────────────────────────────────────────────────────────────┐
│             Utilitas Terpadu & Penyimpanan (Core Libraries)             │
│  ┌────────────────────┐  ┌────────────────────┐  ┌───────────────────┐  │
│  │  titleExtractor &  │  │   IndexedDB (idb)  │  │  Appwrite Cloud   │  │
│  │   domainGrouper    │  │  (Penyimpanan      │  │ (Database, Auth,  │  │
│  │ (Normalisasi URL & │  │   Lokal Terisolasi)│  │  Storage Bucket)  │  │
│  │  Folder Otomatis)  │  └────────────────────┘  └───────────────────┘  │
│  └────────────────────┘                                                 │
└─────────────────────────────────────────────────────────────────────────┘
```

- **Data Model & State**:
  - Entitas `FileSystemItem` menyimpan item bertipe `file` (bookmark), `folder`, `note` (clipboard), dan `phrase` (frasa BIP-39) di dalam IndexedDB lokal yang terisolasi per pengguna dan disinkronkan ke Appwrite Cloud.
- **Interactive Component & State Mapping**:
  - **Utilitas Tautan & Domain**: Menyediakan fungsi tunggal untuk membersihkan teks, mengekstrak domain utama, menormalisasi URL untuk pengecekan anti-duplikat, dan memformat judul bookmark (baik di Root maupun di dalam Folder).
  - **Penyedia Bahasa Tunggal (I18n)**: Menyediakan kamus Bahasa Indonesia yang ringkas dan hanya memuat kunci teks yang benar-benar digunakan oleh komponen aktif.
  - **Manajemen File & Sinkronisasi**: Menggunakan utilitas normalisasi terpadu saat menambah bookmark baru, menjalankan tombol Perbarui & Sinkronisasi, serta saat menggabungkan data lokal dengan Appwrite Cloud.
