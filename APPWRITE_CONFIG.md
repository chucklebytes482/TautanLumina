# Panduan & Aturan Konfigurasi Appwrite Console (TautanLumina)

Dokumen ini berisi panduan teknis dan aturan konfigurasi detail untuk Appwrite Console. AI Agent dan Pengembang WAJIB membaca dan mematuhi panduan ini saat melakukan pemeliharaan atau pengembangan aplikasi.

---

## 1. Environment & Server Details

| Parameter | Nilai / Setting | Keterangan |
| :--- | :--- | :--- |
| **Endpoint** | `https://sgp.cloud.appwrite.io/v1` | Wilayah SGP (Singapore) |
| **Project ID** | `6a616ac3001f1f3875c5` | Project TautanLumina |
| **Database ID** | `6a616b8f00229e5d63da` | Database Utama |
| **Storage Bucket ID** | `6a61c1ac0024510878a6` | Penyimpanan File / Media |
| **Admin Email** | `abdulkarim94786@gmail.com` | Pengelola & Superadmin |

---

## 2. Struktur Koleksi Database (Database Collections)

Appwrite menggunakan **3 Koleksi Utama** dalam Database `6a616b8f00229e5d63da`:

### A. Koleksi 1: `tautanlumina`
Penyimpanan data tautan, profil, atau direktori umum.

| Nama Atribut | Tipe Data | Size / Format | Required | Default / Catatan |
| :--- | :--- | :--- | :--- | :--- |
| `title` | String | 255 | Ya | Judul Tautan / Item |
| `url` | String | 1000 / URL | Ya | Alamat Link |
| `category` | String | 100 | Tidak | Kategori link |
| `description`| String | 1000 | Tidak | Deskripsi tambahan |
| `icon` | String | 255 | Tidak | Nama ikon Lucide / URL |
| `createdAt` | Integer / String | - | Tidak | Milidetik `Date.now()` atau ISO String |

> **Catatan Waktu System (`$createdAt`)**: Appwrite secara otomatis menyediakan atribut bawaan sistem `$createdAt` (Format ISO-8601 String). Dalam query/sorting SDK, disarankan menggunakan fallback ganda untuk `createdAt` (custom integer/string) dan `$createdAt` (system builtin) agar aplikasi selalu lancar tanpa error jika salah satu belum terdaftar di kustom atribut.

---

### B. Koleksi 2: `announcements`
Penyimpanan pesan pengumuman publik dari Admin dan komentar pengumuman.

| Nama Atribut | Tipe Data | Size | Required | Catatan |
| :--- | :--- | :--- | :--- | :--- |
| `content` | String | 5000 | Ya | Teks pengumuman / Data pesan |
| `senderEmail` | String | 255 | Ya | Email pengirim (default Admin) |
| `senderName` | String | 255 | Tidak | Nama tampilan pengirim |
| `comments` | String | 100000 | Tidak | JSON String array daftar komentar & sub-komentar |
| `createdAt` | Integer / String | - | Tidak | Timestamp pengumuman |

**Indeks (Indexes)**:
- Indeks pada `createdAt` (Type: Key, Order: DESC) atau gunakan `$createdAt` bawaan Appwrite.

---

### C. Koleksi 3: `private_messages`
Penyimpanan percakapan private & pesan suara (voice chat).

| Nama Atribut | Tipe Data | Size | Required | Catatan |
| :--- | :--- | :--- | :--- | :--- |
| `senderEmail` | String | 255 | Ya | Email pengirim pesan |
| `receiverEmail` | String | 255 | Ya | Email penerima pesan |
| `content` | String | 100000 | Ya | Isi pesan teks ATAU Data Base64 Audio `[AUDIO]data:audio/webm;base64,...` |
| `createdAt` | Integer / String | - | Tidak | Timestamp pesan |

**Aturan Ukuran Atribut `content`**:
- Atribut `content` harus memiliki ukuran minimum **100,000 karakter** (atau tipe `String` ukuran besar) di Appwrite Console agar dapat menampung string audio base64 pesan suara tanpa terpotong.

---

## 3. Hak Akses & Izin (Permissions & Security Rules)

Untuk setiap koleksi di Appwrite Console (`tautanlumina`, `announcements`, `private_messages`), pastikan menyetel **Collection Permissions** sebagai berikut:

- **Read Access**: `Any` / `Users` (Semua pengguna dapat membaca/menerima pesan).
- **Create Access**: `Users` / `Any` (Semua pengguna terautentikasi / publik dapat mengirim pesan).
- **Update / Delete Access**: `Users` / Role `Admin` (`abdulkarim94786@gmail.com`).

---

## 4. Aturan Fitur Voice Chat (Pesan Suara)

1. **Format Audio**: Diubah menjadi Base64 WebM/MP4 dengan prefiks tag `[AUDIO]`.
2. **Durasi Maksimal**: **30 Detik**.
3. **Mekanisme Otomatis**:
   - Ketika durasi rekam mencapai detik ke-30, perekaman **otomatis berhenti**.
   - Sistem **TIDAK** langsung mengirim audio secara otomatis.
   - Sistem menampilkan **Modul Pratinjau (Preview)** di mana pengguna dapat mendengarkan hasil rekaman, menekan **"Batal"** untuk membuang, atau menekan **"Kirim"** untuk menyetujui pengiriman.
4. **Pencegahan Quota Storage Limit**:
   - Perekaman audio menggunakan bitrate efisien (`16kbps`, mono 16kHz).
   - LocalStorage fallback menggunakan safe helper `safeSetLocalStorage()` yang otomatis memangkas cache lama jika kapasitas `QuotaExceededError` tercapai.

---

## 5. Pedoman Kode Client & Fallback AI Agent

- **Robust Fallback**: Jika koneksi Appwrite mengalami timeout, ganti ke mode `local_fallback` menggunakan IndexedDB / LocalStorage tanpa merusak UI.
- **Double Query Fallback**: Pada pemanggilan `databases.listDocuments()`, selalu gunakan `try-catch` fallback antara `Query.orderDesc('createdAt')` dan `Query.orderDesc('$createdAt')`.
- **Obfuscated Credentials**: Kunci konfigurasi di dalam `/src/lib/appwrite.ts` harus tetap terlindungi agar tidak terekstrak sebagai plain text.
