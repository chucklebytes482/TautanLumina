# AI Agent Guidelines & Project Rules (TautanLumina)

Dokumen ini dibaca secara otomatis oleh AI System Instructions pada setiap sesi untuk dijadikan pedoman pengkodean dan pengembangan aplikasi.

---

## 1. Instruksi Wajib Konfigurasi Appwrite

- AI **WAJIB** membaca dan merujuk pada file `/APPWRITE_CONFIG.md` untuk seluruh aturan database, nama koleksi, atribut, ID project, dan izin akses.
- **Daftar ID Utama**:
  - Endpoint: `https://sgp.cloud.appwrite.io/v1`
  - Project ID: `6a616ac3001f1f3875c5`
  - Database ID: `6a616b8f00229e5d63da`
  - Storage Bucket ID: `6a61c1ac0024510878a6`
  - Collections: `tautanlumina`, `announcements`, `private_messages`

---

## 2. Aturan Fitur Voice Chat (Pesan Suara)

1. **Batas Durasi Maksimal 30 Detik**:
   - Timer perekaman suara tidak boleh melebihi 30 detik.
   - Jika perekaman mencapai detik ke-30, sistem secara otomatis menghentikan perekaman dan masuk ke mode **Pratinjau (Preview)**.
2. **Konfirmasi & Pembatalan Pengguna**:
   - Ketika rekaman berhenti (baik manual atau mencapai 30 detik), pengguna diberikan pilihan:
     - **Batal**: Membuang audio tanpa mengirim.
     - **Putar/Dengarkan (Play/Pause)**: Memutar ulang suara untuk dicek.
     - **Kirim**: Menyetujui dan memproses pengiriman pesan suara.
   - Perekaman **TIDAK BENTUK APAPUN Boleh Terkirim Otomatis** tanpa persetujuan tombol Kirim dari pengguna.

---

## 3. Aturan Query Database & Timestamp Fallback

- Appwrite menyediakan atribut bawaan `$createdAt` dan kustom atribut `createdAt`.
- Selalu gunakan penanganan *double try-catch query* untuk fungsi `listDocuments`:
  ```ts
  let response;
  try {
    response = await databases.listDocuments(DB_ID, COLL_ID, [Query.orderDesc('createdAt'), Query.limit(50)]);
  } catch {
    response = await databases.listDocuments(DB_ID, COLL_ID, [Query.orderDesc('$createdAt'), Query.limit(50)]);
  }
  ```
- Saat membaca timestamp dokumen:
  ```ts
  createdAt: typeof doc.createdAt === 'number' ? doc.createdAt : (doc.$createdAt ? new Date(doc.$createdAt).getTime() : Date.now())
  ```

---

## 4. Keamanan LocalStorage & Penanganan Error Quota (`QuotaExceededError`)

- Selalu gunakan penolong `safeSetLocalStorage()` saat menyimpan data besar (seperti pesan pribadi/suara) ke LocalStorage untuk mencegah error `QuotaExceededError`.
- Jika kuota penyimpanan browser penuh, pangkas (*trim*) pesan lama dan simpan hanya pesan terbaru.

---

## 5. Kepatuhan Desain & Kualitas Kode

- Gunakan Tailwind CSS untuk antarmuka yang bersih, responsif, dan elegan.
- Pastikan semua tombol memiliki tooltip/umpan balik visual yang jelas.
- Pertahankan dukungan peningkatan bertahap (progressive enhancement) dari mode offline (local IndexedDB/LocalStorage) hingga sinkronisasi awan Appwrite.

---

## 6. Antarmuka Chat & Header Minimalis

- **Header Compact**: Tata letak modal chat menggunakan header compact bersatu yang menggabungkan tab switcher dan tombol penutup (X) dalam satu baris ringkas.
- **Tanpa Ikon Unnecessary**: Sembunyikan ikon sinkron/refresh atau tombol berlebih untuk menjaga estetika tetap minimalis dan bersih.

---

## 7. Modal Pemilih Model AI (Model Picker)

- **Default Filter Free**: Saat jendela model dibuka pertama kali, filter **WAJIB** secara otomatis mengarah pada tab **🎁 Free**.
- **Pengurutan Otomatis Tanpa Ornamen**: Daftar model diurutkan secara otomatis berdasarkan peringkat skor kualitas terbaik (tanpa opsi dropdown sortir manual dan tanpa badge dekoratif seperti "🔥 Top") untuk pengalaman pengguna yang bersih dan efisien.

---

## 8. Aturan Lokalisasi & Terjemahan Multi-Bahasa

- **Bahasa Utama Pengembang**: **Bahasa Indonesia (ID)** adalah bahasa utama pengembang dan basis utama aplikasi.
- **5 Bahasa Terjemahan Pendukung**:
  1. 🇬🇧 **Inggris (EN)**
  2. 🇨🇳 **Mandarin / Cina (ZH)**
  3. 🇯🇵 **Jepang (JA)**
  4. 🇰🇷 **Korea (KO)**
  5. 🇷🇺 **Rusia (RU)**
- **Kewajiban Otomatis AI**: Setiap kali pengguna meminta untuk menambah, memperbaiki, mengubah, atau memperbarui teks, kalimat, petunjuk, panduan, atau label UI apapun, AI **WAJIB** secara otomatis menyediakan dan menyesuaikan terjemahan lengkap di **Bahasa Indonesia serta 5 bahasa terjemahan pendukung** (EN, ZH, JA, KO, RU) pada file `src/lib/i18n-missing.ts` atau file lokalisasi terkait tanpa harus diminta berulang kali.

---

## 9. Aturan Pembatasan Fitur Free vs Pro

- **Fitur Utama Selalu Gratis**: Sinkronisasi Awan, Tagging & Rangkuman AI, serta Keamanan PIN Akses tidak boleh dibatasi untuk pengguna Free.
- **Batasan Fitur Pro (Opsional)**:
  1. **Komentar Pengumuman**: Akun Free dibatasi maksimal **1 kali komentar per hari** di pengumuman (kuota di-reset setiap hari), sedangkan akun Pro/Admin tanpa batas.
  2. **Pesan Pribadi Admin**: Akun Free dibatasi maksimal **3 kali kirim pesan** pribadi ke Admin per hari (kuota di-reset setiap hari), sedangkan akun Pro/Admin tanpa batas.
  3. **Generate Ulang AI**: Akun Free dibatasi maksimal **2 kali per hari** (kuota di-reset setiap hari), sedangkan akun Pro/Admin tanpa batas.
  4. **Kunci Folder**: Akun Free dibatasi maksimal **1 folder terkunci**, sedangkan akun Pro/Admin dapat mengunci folder tanpa batas.

---

## 10. Aturan Pembaruan Otomatis Metadata, Landing Page, Keterangan & Panduan Penggunaan

- **Kewajiban Sinkronisasi Setiap Perubahan**: Setiap kali terdapat penambahan, perubahan, pembaruan, atau perbaikan fitur pada aplikasi, AI **WAJIB** secara otomatis memperbarui komponen dan dokumen terkait agar selalu selaras dan akurat:
  1. **`metadata.json`**: Perbarui deskripsi (`description`) aplikasi jika terdapat perubahan atau penambahan kapabilitas utama.
  2. **Landing Page / Halaman Utama**: Sesuaikan seluruh teks promosi, instruksi singkat, dan keterangan fitur di antarmuka utama.
  3. **Keterangan & Label UI (Lokalisasi)**: Perbarui penjelasan, tooltip, dan teks petunjuk UI di `src/lib/i18n-missing.ts` untuk Bahasa Indonesia serta 5 bahasa terjemahan pendukung (EN, ZH, JA, KO, RU).
  4. **Panduan Penggunaan (`GuideTabContent.tsx`)**: Tambahkan atau perbarui langkah-langkah penggunaan fitur terbaru di dalam modul panduan penggunaan secara lengkap untuk Bahasa Indonesia dan 5 bahasa terjemahan pendukung.


