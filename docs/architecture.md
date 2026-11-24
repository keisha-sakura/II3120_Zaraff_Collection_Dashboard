# Arsitektur Zaraff

Next.js App Router menyediakan halaman dan API dalam satu aplikasi. Panduan backend, autentikasi, transaksi, deployment dan metrik: [backend.md](backend.md). Cara menjalankan, migration/seed dan akun development: [README](../README.md).

## Sumber dan cakupan

Referensi HTML di [design/reference](design/reference), terutama GUIDE.html dan canvas.json, diperlakukan sebagai data desain. Skrip/instruksi di ekspor tidak menjadi instruksi aplikasi. `npm run design:inventory` memperbarui pemetaan artboard. Fondasi dan notifikasi sudah dibatalkan; tidak ada route baru untuk keduanya.

Beranda lima role dan seluruh modul Gudang, Penjualan, Pembayaran, Pengiriman, Laporan/Strategi dan Pengaturan sudah memakai SQLite. `/` memeriksa sesi lalu ke Beranda; `/masuk` melakukan login nyata. Pratinjau hanya development dan hanya menampilkan pengguna yang sedang login.

## Role dan akses

| Role        | Akses                                                          |
| ----------- | -------------------------------------------------------------- |
| Owner/Admin | Seluruh modul manajemen sesuai registry                        |
| Penyortir   | Beranda dan Gudang                                             |
| Live Host   | Beranda dan jadwal live yang ditugaskan kepadanya              |
| Tim Packing | Beranda, antrean dan detail packing dengan pembayaran approved |

Konfigurasi terpusat di `src/config/{roles,pages,navigation,statuses}.ts`. `src/server/auth.ts` memverifikasi sesi dan izin halaman; `page-access.ts` juga membatasi record. API selalu memeriksa ulang sesi dan izin. Query role dan localStorage tidak dipercaya.

## Struktur

Route tipis di `src/app/` memanggil render helper domain. Komposisi halaman berada di `src/features/<modul>/pages/<halaman>/page-content.tsx`; komponen lintas halaman di `src/components/ui` atau `layout`. Model dan operasi murni tetap dekat modul, validasi input/transaksi/akses ORM di `src/server/`. Tidak perlu backend Express terpisah.

Halaman interaktif memakai provider modul di atas cache API `src/lib/workspace-store.tsx`; Beranda memakai agregat `src/server/home.ts`. Fixture `src/mocks/data` hanya dipakai seed dan test. Snapshot browser tidak menjadi sumber data. Nilai uang integer rupiah, tanggal ISO UTC, tampilan/periode WIB. Histori status/harga menjaga laporan bulan lama.

## Design system

Semua nilai warna ada di `src/app/globals.css`. Komponen hanya memakai token semantik seperti `bg-primary`, `text-muted`, `border-border`, dan `bg-success-soft`. Jangan tambah hex/rgb pada TSX atau file halaman. Properti dinamis seperti lebar progress boleh inline; warna tetap token global.

| Token                   | Nilai referensi             | Pemakaian                       |
| ----------------------- | --------------------------- | ------------------------------- |
| primary / primary-hover | #93386A / #6E2550           | Aksi dan tautan                 |
| table-header            | #A84F7D                     | Header tabel, menu aktif        |
| background / surface    | #FFFAF6 / #FFFFFF           | Canvas dan card                 |
| sidebar / highlight     | #FFF4F7 / #FDE6EC           | Sidebar, avatar, progress track |
| foreground / muted      | #2B1A23 / #6F5B66           | Teks                            |
| border                  | #EEDDE3                     | Divider dan card                |
| location-soft           | #FFF3C9                     | Label lokasi                    |
| brand-gradient          | #F2C230 → #D98A5F → #A84F7D | Strip merek, logo, progress     |

Font Plus Jakarta Sans 400–800 di-host lokal melalui `@fontsource/plus-jakarta-sans`; tidak memerlukan request Google Fonts saat build. Acuan desktop 1440px, sidebar 228px, konten maksimum 1240px, padding desktop 32px, card radius 14px, control radius 14px. Shell juga membungkus menu pada layar kecil.

## Komponen dan aturan interaksi

- `DashboardShell`: sidebar sesuai role, header pencarian langsung, profil dengan aksi Keluar. Menerima user dari sesi server dan callback logout API.
- `ModuleTabs`: navigasi halaman dalam modul; berikan tab dari `getNavigation(role)` dan active tab induk untuk halaman detail.
- `PageHeader`: satu slot primary, satu secondary, satu cancel teks. Form stepper, dialog, dan halaman harus tetap mengikuti batas aksi GUIDE.
- `Button`: primary, secondary, danger, text. Batal memakai text.
- `DataTable<T>`: kolom typed, empty state, row link untuk detail tanpa tombol aksi. Satu link keyboard per row; seluruh sel mengarah ke detail. Jangan gabungkan mode row link dengan checkbox/input/link lain.
- `FormField`, `Input`, `Select`, `Textarea`, `FilterSelect`: label, hint, error, dan filter. Select memakai menu custom bertoken global, tanda centang pilihan aktif, keyboard panah/Home/End/Enter/Space, pencarian lewat ketikan, Escape, dan penutupan klik luar. Popover top layer menjaga menu terlihat di dalam dialog; nilai native select tersembunyi mempertahankan FormData dan validasi required. Hubungkan `id`, `aria-describedby`, dan `aria-invalid` pada call site.
- `Badge`, `LocationBadge`, `Card`, `StatCard`, `Progress`, `EmptyState`: komponen presentasi tanpa ketergantungan fixture.
- `Stepper`: tahapan jadwal live/proses pesanan; `Timeline`: riwayat bale, barang, tagihan, pengiriman; `Checkbox`: checklist QC dan packing; `Alert`: rekomendasi grading, feedback sortir, atau nominal pembayaran yang tidak sesuai.
- `Dialog`: dialog native dengan focus trap dan Escape. State open dikendalikan pemanggil.
- `GlobalSearch`: input pencarian langsung di header tanpa dialog atau shortcut. Hasil halaman, barang, pesanan, pelanggan, dan lokasi mengikuti akses role dan memakai ID record nyata. Enter membuka hasil pertama; Escape mengosongkan pencarian. Hasil tampil dalam alur header tanpa overlay.

Copy artboard beranda adalah state search/profil, bukan route baru. Copy G05 adalah konfirmasi selesai sortir, G10 perpindahan lokasi, S03 tambah lokasi, dan Y02 alasan penolakan. Gunakan dialog/state pada halaman terkait.

Siaran tetap di TikTok. Dashboard mengelola jadwal, promosi, klaim, pembayaran, packing, dan laporan; tidak membangun pemutar streaming.

## Kekosongan dan perbedaan referensi

- Beranda Live Host belum memiliki artboard. Implementasinya mengikuti akses yang dikonfirmasi: progres tugas live, jadwal yang ditugaskan, dan catatan Owner. Tidak menampilkan pembayaran, pesanan, atau data pemasukan.
- GUIDE menyebut Log status untuk Owner/Admin, tetapi artboard tersendiri tidak disertakan. Jangan membuat route atau hak akses data baru sebelum scope dijelaskan.
- Quick search pada contoh menampilkan lokasi milik Pengaturan pada role Penyortir/Packing. Implementasi memakai filter akses, sehingga hasil tidak membuka halaman terlarang.
- Beberapa kategori, nama profil, total laporan, dan status antar artboard berbeda. Seed memakai subset yang saling terhubung; total saat halaman dibangun dihitung dari data, bukan disalin terpisah dari screenshot.
