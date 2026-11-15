# TautanLumina

TautanLumina adalah aplikasi React + Vite. GitHub menjadi sumber kode utama, sedangkan Appwrite menyediakan layanan backend dan Appwrite Sites membangun serta meng-host aplikasi dari repository tersebut.

## Menjalankan secara lokal

1. Pasang Node.js yang mendukung versi Vite di `package.json`.
2. Salin `.env.example` menjadi `.env.local`.
3. Jalankan `npm ci` lalu `npm run dev`.
4. Buka alamat lokal yang dicetak oleh Vite.

Konfigurasi Appwrite dibaca saat build melalui `import.meta.env`. Semua variabel `VITE_*` masuk ke bundle browser dan bukan tempat menyimpan rahasia. Jangan meletakkan API key server, password, atau service-account secret dalam variabel `VITE_*`.

## Backend Appwrite

`.env.example` memuat endpoint, project ID, database ID, dan bucket ID dari dokumen env referensi. Nilai tersebut merupakan identitas project yang memang digunakan oleh klien browser. Aplikasi juga menggunakan collection ID `tautanlumina`, `announcements`, dan `private_messages`; pastikan collection, atribut, index, bucket, serta permission yang dibutuhkan aplikasi sudah tersedia pada project Appwrite tersebut.

Di Appwrite Console, aktifkan metode autentikasi yang dipakai aplikasi. Tambahkan domain lokal saat pengembangan dan domain situs Appwrite setelah situs dibuat ke daftar platform/allowed origins project. Atur URL verifikasi email dan pemulihan password agar mengarah ke URL situs yang benar.

## Deploy GitHub ke Appwrite Sites

Buat atau hubungkan sebuah Site dari project Appwrite melalui **Sites → Create site → Connect a repository**, lalu pilih repository GitHub `chucklebytes482/TautanLumina` dan branch produksi `main`. Set konfigurasi build berikut:

- Root directory: `.`
- Install command: `npm ci`
- Build command: `npm run build`
- Output directory: `dist`
- Environment variables: tambahkan empat variabel `VITE_APPWRITE_*` dari `.env.example` di pengaturan Site.

Push ke branch produksi akan memicu build dan deployment baru jika repository sudah terhubung. Setelah build pertama berhasil, Appwrite menyediakan domain bawaan/subdomain Appwrite pada pengaturan domain Site. Domain tersebut dapat digunakan langsung; domain kustom bersifat opsional. Untuk menguji perubahan tanpa mengganti versi produksi, buat pull request atau deploy dari branch lain dan gunakan preview deployment Appwrite.

Dokumentasi resmi: [Deploy from Git](https://appwrite.io/docs/products/sites/deploy-from-git) dan [Sites templates](https://appwrite.io/docs/products/sites/templates).
