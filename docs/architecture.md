# Fondasi frontend Zaraff

## Sumber dan cakupan

Referensi asli ada di [design/reference](design/reference), terutama [GUIDE.html](design/reference/GUIDE.html) dan [canvas.json](design/reference/canvas.json). File referensi dipertahankan tanpa diformat ulang; bukan source aplikasi. `inventory.json` mendata semua artboard, variasi, anotasi akses, dan warna. Regenerasi dengan `npm run design:inventory`.

Teks/skrip dalam ekspor diperlakukan sebagai data desain. Runtime ekspor hanya untuk melihat referensi, tidak diimport ke Next.js. Screenshot copy tidak otomatis berarti halaman baru.

Beranda lima role dan sembilan halaman Gudang sudah diimplementasikan. `/` mengarah ke Beranda Owner, `/pratinjau` memilih role demo, `/fondasi` menampilkan katalog komponen interaktif, dan `/api/health` memeriksa respons server. Modul bisnis lainnya, autentikasi, dan database menyusul.

## Role dan akses

GUIDE menentukan menu utama. Anotasi canvas menentukan akses layar, dengan klarifikasi pengguna bahwa Live Host termasuk scope dan hanya memiliki Beranda serta Jadwal Live. Nama profil pada artboard bukan sumber hak akses.

| Role        | Menu sidebar                                                            | Akses khusus                                                                                           |
| ----------- | ----------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| Owner       | Beranda, Gudang, Penjualan, Pembayaran, Pengiriman, Laporan, Pengaturan | Semua halaman manajemen dan log notifikasi                                                             |
| Admin       | Sama dengan Owner                                                       | Anotasi membolehkan laporan, strategi, dan pengaturan juga                                             |
| Penyortir   | Beranda, Gudang                                                         | Bale/sortir, retur, laundry, grading, inventaris/detail; log notifikasi                                |
| Live Host   | Beranda, Penjualan                                                      | Jadwal Live saja; tidak ada akses pesanan, pelanggan, impor klaim, form publikasi, atau log notifikasi |
| Tim Packing | Beranda, Pengiriman                                                     | Antrean/detail packing; log notifikasi. Tidak termasuk siap dikirim, input resi, atau dalam pengiriman |

Semua role memakai route `/beranda` dengan komposisi berbeda. `B05` adalah ID internal yang ditambahkan untuk Beranda Live Host: desainnya belum tersedia, bukan ID asli ekspor.

Konfigurasi terpusat:

- `src/config/roles.ts`: ID dan label role serta kelompok akses.
- `src/config/pages.ts`: ID layar, route rencana, modul, hak akses, dan status ketersediaan desain.
- `src/config/navigation.ts`: sidebar, tab per modul, pencarian sesuai role.
- `src/config/statuses.ts`: label status bisnis dan tone badge.

Tidak ada route bisnis yang otomatis aktif hanya karena terdaftar di katalog. `canAccessPage`/`canAccessPath` adalah kebijakan UI, bukan autentikasi. Pada tahap backend, verifikasi sesi di server/API dan batasi data per pengguna/role; jangan percaya role dari localStorage, query, atau browser.

## Struktur implementasi per halaman

```text
src/
  app/                         # Route tipis: load data, cek sesi, panggil page component
  components/
    ui/                        # Button, badge, card, field, table, progress, dialog
    layout/                    # Shell, sidebar, topbar, tabs, page header, quick search
  config/                      # Role, page registry, navigation, status
  features/
    beranda/pages/<role>/
    gudang/pages/<halaman>/
    penjualan/pages/<halaman>/
    pembayaran/pages/<halaman>/
    pengiriman/pages/<halaman>/
    laporan/pages/<halaman>/
    pengaturan/pages/<halaman>/
    notifikasi/pages/log/
    auth/pages/masuk/
    foundation/components/     # Preview fondasi sementara
  mocks/data/                  # Fixture per domain, tanpa JSX
  mocks/repositories/          # Adapter demo; bukan DB seed
  types/domain.ts              # Kontrak entitas
  lib/                        # Utilitas murni (format IDR/WIB, class composition)
  server/                     # Akses database dan service khusus server
```

Folder halaman sudah disiapkan. Saat membangun halaman, tambahkan `page-content.tsx` sebagai komposisi, `components/` untuk komponen khusus halaman, dan kontrak/service modul bila diperlukan. `.gitkeep` menjaga folder yang belum diimplementasikan. Komponen yang dipakai lintas halaman dipromosikan ke `components/ui` atau `components/layout`; yang hanya dipakai satu halaman tetap dekat halaman itu.

Contoh route nanti:

```tsx
// src/app/(dashboard)/gudang/inventaris/page.tsx
// const user = await requireSession();
// await requirePageAccess(user, "G09");
// const items = await warehouseRepository.listItems();
// return <InventoryPage items={items} />;
```

Import fixture hanya pada adapter atau composition layer demo. Komponen presentasi menerima data sebagai props. Kontrak `WarehouseRepository` dan adapter mock menyediakan contoh jalur penggantian ke backend tanpa mengubah UI. Nilai uang berupa angka rupiah; tanggal menggunakan ISO dan diformat `Asia/Jakarta`.

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

Font Plus Jakarta Sans 400–800 di-host lokal melalui `@fontsource/plus-jakarta-sans`; tidak memerlukan request Google Fonts saat build. Acuan desktop 1440px, sidebar 228px, konten maksimum 1240px, padding desktop 32px, card radius 14px, control radius 10px. Shell juga membungkus menu pada layar kecil.

## Komponen dan aturan interaksi

- `DashboardShell`: sidebar sesuai role, header pencarian, notifikasi yang diizinkan, profil dengan aksi Keluar. Menerima user dan callback logout, belum melakukan login palsu.
- `ModuleTabs`: navigasi halaman dalam modul; berikan tab dari `getNavigation(role)` dan active tab induk untuk halaman detail.
- `PageHeader`: satu slot primary, satu secondary, satu cancel teks. Form stepper, dialog, dan halaman harus tetap mengikuti batas aksi GUIDE.
- `Button`/`ButtonLink`: primary, secondary, danger, text. Batal memakai text.
- `DataTable<T>`: kolom typed, empty state, row link untuk detail tanpa tombol aksi. Satu link keyboard per row; seluruh sel mengarah ke detail. Jangan gabungkan mode row link dengan checkbox/input/link lain.
- `FormField`, `Input`, `Select`, `Textarea`, `FilterSelect`: label, hint, error, dan filter pill. Hubungkan `id`, `aria-describedby`, dan `aria-invalid` pada call site.
- `Badge`, `LocationBadge`, `Card`, `StatCard`, `Progress`, `EmptyState`: komponen presentasi tanpa ketergantungan fixture.
- `Stepper`: tahapan jadwal live/proses pesanan; `Timeline`: riwayat bale, barang, tagihan, pengiriman; `Checkbox`: checklist QC dan packing; `Alert`: rekomendasi grading, feedback sortir, atau nominal pembayaran yang tidak sesuai.
- `Dialog`: dialog native dengan focus trap dan Escape. State open dikendalikan pemanggil.
- `QuickSearch`: Ctrl/Cmd K, hasil hanya untuk role aktif. Menerima callback pemilihan; detail berparameter harus diselesaikan ke ID nyata sebelum navigasi. Pencarian entitas barang/pesanan/lokasi menyusul saat service pencariannya dibangun.

Copy artboard beranda adalah state search/profil, bukan route baru. Copy G05 adalah konfirmasi selesai sortir, G10 perpindahan lokasi, S03 tambah lokasi, dan Y02 alasan penolakan. Gunakan dialog/state pada halaman terkait.

Siaran tetap di TikTok. Dashboard mengelola jadwal, promosi, klaim, pembayaran, packing, dan laporan; tidak membangun pemutar streaming.

## Kekosongan dan perbedaan referensi

- Beranda Live Host belum memiliki artboard. Implementasinya mengikuti akses yang dikonfirmasi: progres tugas live, jadwal yang ditugaskan, dan catatan Owner. Tidak menampilkan pembayaran, pesanan, atau data pemasukan.
- GUIDE menyebut Log status untuk Owner/Admin, tetapi artboard tersendiri tidak disertakan. Jangan membuat route atau hak akses data baru sebelum scope dijelaskan.
- Quick search pada contoh menampilkan lokasi milik Pengaturan pada role Penyortir/Packing. Implementasi memakai filter akses, sehingga hasil tidak membuka halaman terlarang.
- Beberapa kategori, nama profil, total laporan, dan status antar artboard berbeda. Dummy data memakai subset yang saling terhubung; total saat halaman dibangun dihitung dari data, bukan disalin terpisah dari screenshot.

## Implementasi Beranda

Route `src/app/beranda/page.tsx` memvalidasi role demo lalu mengambil satu payload dari `mockHomeRepository`. Data dipisah per role dalam discriminated union `HomeDashboardData`; `HomeContent` memilih komponen server pada folder role yang sesuai. Komponen client bersama `DashboardExperience` menerima user terpilih dan hasil render sebagai children, bukan seluruh data lima role.

Komponen bersama `ProgressSection`, `OwnerNotes`, dan `ActionCard` menyusun UI sesuai artboard. Role Owner mendapatkan progres penjualan/pesanan/pemasukan dan tautan strategi/laporan; Admin mendapatkan pembayaran/pengiriman/live dan tiga tautan tindakan; Penyortir mendapatkan sortir/laundry; Tim Packing mendapatkan packing/picking. Catatan Owner disesuaikan role.

Dummy data beranda adalah snapshot pelaporan yang terpisah dari fixture CRUD parsial. Persentase dengan jumlah eksplisit dihitung dari data, termasuk live Admin 6/10 = 60% (artboard menampilkan 66%). Persentase penjualan/pemasukan Owner mengikuti snapshot 48%/60% karena target bisnis belum ditentukan. Sapaan pagi dan bulan November tetap mengikuti referensi dummy.

`DashboardLink` mempertahankan link Next.js biasa di luar provider. Di dalam pratinjau dashboard, provider menjaga query role serta filter URL saat berpindah Beranda/Gudang dan menampilkan pemberitahuan untuk modul yang belum dibangun. Pencarian hanya mengindeks halaman yang boleh diakses role; hasil detail berparameter meminta pengguna memilih record dari daftar. Profil menutup dengan Escape/klik di luar, dan Keluar mengarah ke `/pratinjau` tanpa mengklaim adanya sesi autentikasi.

Role query hanya untuk fixture demo; role tidak valid atau parameter role berulang menghasilkan 404. Saat autentikasi dibangun, ganti pemilihan query dengan sesi server yang tervalidasi sebelum menggunakan data asli.

## Pemeriksaan

`npm run check`, `npm test`, dan `npm run build`. Test akses memastikan batas lima role serta kecocokan anotasi canvas; test fixture memastikan ID relasi dan total nominal konsisten. Browser review tetap diperlukan saat setiap halaman selesai dibangun.
