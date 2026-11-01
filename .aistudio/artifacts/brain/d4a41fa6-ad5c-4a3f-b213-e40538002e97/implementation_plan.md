# Salin Otomatis Label & Judul Header Pharse

Rencana implementasi untuk menambahkan kemampuan salin otomatis gabungan label dan judul frase (dipisahkan spasi) ketika pengguna mengklik area header jendela modal Pharse.

---

### User Review & Critical Decisions

> [!IMPORTANT]
> **Keputusan Berdasarkan Klarifikasi Pengguna:**
> 1. **Format Teks Salinan**: Teks yang disalin ke clipboard adalah gabungan label dan judul yang digenerate dengan pemisah spasi, misalnya: `web3.bitget.com opinion`. Jika hanya ada salah satunya, maka nilai yang tersedia yang akan disalin.
> 2. **Target Interaksi Klik**: Mengklik seluruh area teks header (meliputi label berwarna oranye dan judul teks) akan langsung memicu penyalinan keduanya secara instan.
> 3. **Indikator Visual**: Menampilkan ikon centang sukses (`Check`) serta toast konfirmasi singkat agar pengguna mendapatkan umpan balik yang jelas bahwa teks telah tersalin ke clipboard.

---

### 1. Overview & Core Concept

- **Tujuan**: Memudahkan pengguna menyalin identitas lengkap frase (domain/label beserta kata kunci judul yang digenerate) hanya dengan satu kali klik pada header modal tampilan frase (`PhraseViewModal`).
- **Alur Interaksi**:
  1. Pengguna membuka suatu frase dari folder Pharse sehingga modal `PhraseViewModal` terbuka.
  2. Header modal menampilkan label (misal: `web3.bitget.com`) dan judul yang digenerate (misal: `opinion`).
  3. Pengguna mengklik teks header tersebut.
  4. Teks `"web3.bitget.com opinion"` otomatis tersalin ke clipboard perangkat.
  5. Ikon centang hijau muncul sesaat di samping judul dan notifikasi toast konfirmasi ditampilkan.

---

### 2. User Experience & Visual Design

- **Struktur Header**:
  - Mengubah elemen judul header menjadi tombol interaktif tunggal yang membungkus label dan judul:
    - Bagian Label: Teks tebal berwarna oranye khas TautanLumina (`text-[#FF4F00]`), atau sesuai tema aksen.
    - Bagian Judul: Teks font medium/bold adaptif (`text-neutral-900 dark:text-neutral-100`).
    - Ikon Feedback: Ikon `Check` halus berwarna hijau emerald saat berhasil disalin.
  - Efek Hover & Klik:
    - Cursor pointer dengan hover highlight.
    - Micro-interaction `active:scale-95` dan transisi warna halus.
    - Tooltip atribut `title`: `"Klik untuk menyalin: web3.bitget.com opinion"`.

---

### 3. Key Product Decisions & Trade-Offs

- **Penggabungan Trigger Klik**:
  - *Sebelumnya*: Hanya label yang memiliki tombol salin terpisah, sedangkan judul tidak dapat diklik.
  - *Perbaikan*: Seluruh kesatuan header (label + judul) dijadikan satu tombol klik yang intuitif, menyalin string gabungan `"${displayLabel} ${displayTitle}"`.

---

### 4. Technical Architecture & Data Strategy

```
┌────────────────────────────────────────────────────────┐
│             Modal Header (PhraseViewModal)             │
│                                                        │
│  ┌──────────────────────────────────────────────┐  ┌─┐ │
│  │ [Klik] web3.bitget.com opinion [✓]           │  │X│ │
│  └──────────────────────┬───────────────────────┘  └─┘ │
└─────────────────────────┼──────────────────────────────┘
                          │
                          ▼
┌────────────────────────────────────────────────────────┐
│           Handler: handleCopyHeader()                  │
│  - Text: `${displayLabel} ${displayTitle}`.trim()       │
│  - navigator.clipboard.writeText(fullText)             │
│  - setCopied(true) -> auto-reset 2 detik               │
│  - sonnerToast.success('Label & judul disalin')        │
└────────────────────────────────────────────────────────┘
```

#### File yang Dimodifikasi:
- **`src/components/PhraseViewModal.tsx`**:
  - Menyatukan handler penyalinan menjadi `handleCopyHeader` yang menggabungkan `displayLabel` dan `displayTitle` dengan pemisah spasi.
  - Membungkus teks header dalam `<button type="button" onClick={handleCopyHeader} ...>` dengan styling yang rapi, responsif, dan mendukung dark mode.
  - Menampilkan feedback visual ikon `Check` saat status `copied` aktif.

---

### Verifikasi & Uji Coba
1. Membuka item frase yang memiliki label dan judul.
2. Mengklik teks header di bagian atas modal dan memastikan clipboard berisi `"web3.bitget.com opinion"`.
3. Membuka item frase yang hanya memiliki judul tanpa label dan memverifikasi hanya judul yang tersalin tanpa spasi berlebih.
4. Menjalankan `compile_applet` dan `lint_applet` untuk memastikan tidak ada error kompilasi.
