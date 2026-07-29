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

## 8. Aturan Perbaikan Kalimat & Lokalisasi Multi-Bahasa

- Setiap kali pengguna meminta untuk memperbaiki, mengubah, atau memperbarui suatu kalimat, teks, atau label UI, AI **WAJIB** secara otomatis memperbarui dan menyesuaikan teks tersebut di **seluruh 6 bahasa** yang didukung (Bahasa Indonesia, Inggris, Mandarin, Jepang, Korea, dan Rusia) pada file `src/lib/i18n-missing.ts` atau file lokalisasi terkait tanpa harus diminta berulang kali.

---

## 9. Aturan Pembatasan Fitur Free vs Pro

- **Fitur Utama Selalu Gratis**: Sinkronisasi Awan, Tagging & Rangkuman AI, serta Keamanan PIN Akses tidak boleh dibatasi untuk pengguna Free.
- **Batasan Fitur Pro (Opsional)**:
  1. **Komentar Pengumuman**: Menulis komentar pada pengumuman khusus untuk akun Pro/Admin.
  2. **Pesan Pribadi Admin**: Mengirim pesan pribadi direct ke Admin khusus untuk akun Pro/Admin.
  3. **Generate Ulang AI**: Akun Free dibatasi maksimal **2 kali per hari** (kuota di-reset setiap hari), sedangkan akun Pro/Admin tanpa batas.
  4. **Kunci Folder**: Akun Free dibatasi maksimal **1 folder terkunci**, sedangkan akun Pro/Admin dapat mengunci folder tanpa batas.


