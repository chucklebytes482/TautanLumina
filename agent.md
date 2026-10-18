# Panduan Pengembang & Agen - TautanLumina

Dokumentasi ringkas standar arsitektur dan aturan pengembangan TautanLumina.

---

## 1. Arsitektur & Teknologi

- **Frontend**: React 19 + TypeScript + Vite + Tailwind CSS.
- **Ikon & Notifikasi**: Lucide React & Sonner.
- **Penyimpanan Lokal**: IndexedDB (`idb`) terisolasi per user (`tautanlumina_${userId}` atau `tautanlumina_anonymous`).
- **Cloud & Autentikasi**: Appwrite Cloud (SDK `appwrite`) di `src/lib/appwrite.ts`.
- **PWA**: Dukungan offline penuh melalui Service Worker (`sw.js`) dan Web App Manifest.

---

## 2. Aturan & Kondisi Saat Ini

1. **Bahasa Standar**:
   - Bahasa tunggal adalah **Bahasa Indonesia**.
   - Tidak ada tombol pengalih bahasa (*language selector*) atau ikon bendera bahasa.

2. **Tipe Item (`FileSystemItemType`)**:
   - `file`: Tautan / Bookmark web (judul diekstrak otomatis dari URL atau kata pertama domain).
   - `folder`: Direktori folder (dapat dikunci dengan PIN 4 digit).
   - `note`: Catatan teks standar.
   - `phrase`: Catatan frasa rahasia (minimal 12 kata dipisahkan spasi).

3. **Aturan Khusus Fitur Pharse & Anti-Duplikat**:
   - **Judul Otomatis**: Judul pharse diambil otomatis dari kata pertama isi pharse (`item.content.trim().split(/\s+/)[0]`).
   - **Tanpa Edit Judul/Isi**: Fitur ubah/edit judul dan teks untuk pharse ditiadakan demi keamanan.
   - **Dapat Dihapus**: Pharse dapat dihapus melalui menu aksi atau pemilihan massal dengan konfirmasi.
   - **Anti-Duplikat**: Anti-duplikat memvalidasi secara ketat terhadap item aktif di database. Sesuatu yang pernah dihapus (baik bookmark maupun pharse) dapat ditambahkan kembali kapan saja tanpa terblokir.
   - **Tampilan Minimalis**: Modal tampilan pharse (`PhraseViewModal`) bebas dari kotak peringatan, label sub-judul berlebih, atau disclaimer footer.

4. **Keamanan & PIN**:
   - PIN 4 digit untuk folder/catatan terkunci di-hash secara aman menggunakan SHA-256 lokal (`src/lib/pin.ts`).
   - Kunci terproteksi otomatis saat aplikasi diminimalkan atau ditutup.

5. **Prinsip Antarmuka (UI/UX)**:
   - Desain ultra-minimalis, bersih, tanpa teks instruksi atau banner redundan.
   - Responsif untuk perangkat mobile maupun desktop.
