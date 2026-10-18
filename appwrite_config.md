# Appwrite Configuration - TautanLumina

Dokumentasi konfigurasi Appwrite Cloud untuk sinkronisasi data, autentikasi, dan penyimpanan TautanLumina.

---

## 1. Project & Endpoint

| Parameter | Nilai |
| :--- | :--- |
| **Endpoint** | `https://sgp.cloud.appwrite.io/v1` |
| **Project ID** | `6a616ac3001f1f3875c5` |
| **Database ID** | `6a616b8f00229e5d63da` |
| **Storage Bucket ID** | `6a61c1ac0024510878a6` |
| **Admin Email** | `abdulkarim94786@gmail.com` |

---

## 2. Koleksi Database

### A. Koleksi Utama: `tautanlumina`
- **Collection ID**: `tautanlumina`
- **Fungsi**: Sinkronisasi data bookmark, catatan, dan pharse per pengguna.
- **Aturan Dokumen**: ID dokumen = `$id` user Appwrite.
- **Atribut**:
  - `data` (String / Long Text, required): Payload JSON data item atau referensi Storage file jika payload > 60KB.
  - `email` (String, required): Email pemilik data.
- **Izin (Permissions)**:
  - Read: `Role.user(userId)`, `Role.users()`
  - Update: `Role.user(userId)`, `Role.users()`
  - Delete: `Role.user(userId)`, `Role.users()`

### B. Koleksi Pengumuman: `announcements`
- **Collection ID**: `announcements`
- **Fungsi**: Pesan siaran dan pengumuman dari Admin ke seluruh pengguna.
- **Atribut**:
  - `content` (String, required): Teks pengumuman.
  - `senderEmail` (String, required): Email pengirim (`abdulkarim94786@gmail.com`).
  - `senderName` (String, required): Nama penampil pengirim.
  - `createdAt` (Integer, required): Unix timestamp (ms).
  - `comments` (String, optional): JSON array komentar.
- **Izin (Permissions)**:
  - Read: `Role.any()`, `Role.users()`
  - Create/Update/Delete: Admin / `Role.users()`

### C. Koleksi Pesan Pribadi: `private_messages`
- **Collection ID**: `private_messages`
- **Fungsi**: Jalur komunikasi chat antara pengguna dan Admin.
- **Atribut**:
  - `senderEmail` (String, required): Email pengirim.
  - `receiverEmail` (String, required): Email penerima.
  - `content` (String, required): Isi pesan.
  - `createdAt` (Integer, required): Unix timestamp (ms).
- **Izin (Permissions)**:
  - Read: `Role.any()`, `Role.users()`
  - Create/Update/Delete: `Role.any()`, `Role.users()`

---

## 3. Storage Bucket

- **Bucket ID**: `6a61c1ac0024510878a6`
- **Fungsi**: Penyimpanan payload data sinkronisasi berukuran besar (> 60KB) sebagai file `sync_data_{userId}.json`.
- **Izin File**:
  - Read, Update, Delete: `Role.user(userId)`

---

## 4. Autentikasi & Sesi
- **Metode**: Email & Password via Appwrite Account SDK.
- **Verifikasi Email**: Wajib. Sesi pengguna tanpa verifikasi email dibersihkan secara otomatis.
- **Offline / Local Fallback**: Menggunakan IndexedDB lokal (`tautanlumina_${userId}` atau `tautanlumina_anonymous`) dengan `idb`. Jika offline atau ping Appwrite gagal, aplikasi tetap berfungsi penuh secara lokal.
