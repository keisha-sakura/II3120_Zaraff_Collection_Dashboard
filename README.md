# Zaraff Collection Dashboard

Dashboard operasional full-stack Next.js: frontend dan API satu server, SQLite persisten dengan Drizzle ORM. Modul Beranda, Gudang, Penjualan, Pembayaran, Pengiriman, Laporan/Strategi, dan Pengaturan memakai database; login wajib untuk semua dashboard.

## Backend prototype Prisma (fase 1–8)

Backend modular monolith S1–S12 berada di `services/`, dengan route di `src/app/api/`. Prototype memakai Prisma + SQLite, Zod, JWT, dan Vitest. Dashboard lama memakai Drizzle melalui API operasionalnya sendiri; akun dan data kedua backend berbeda.

Prasyarat: Node.js 22.18+ dan npm. Pada Windows, build native `better-sqlite3` untuk dashboard lama memerlukan Visual Studio C++ Build Tools beserta Windows SDK. Salin `.env.example` ke `.env` untuk CLI Prisma dan pastikan `DATABASE_URL="file:./dev.db?connection_limit=1"` serta `JWT_SECRET` terisi.

```bash
npm ci
npm run db:generate
npm run db:push
npm run seed
npm test
npm run dev
```

`npm run seed` **menghapus dan mengisi ulang data prototype pada DATABASE_URL yang dipilih**; gunakan hanya untuk database development. Vitest membuat skema dan seed sekali di `prisma/test.db`, menjalankan file test berurutan, serta tidak mengubah `dev.db`. Suite mencakup 20 klaim paralel, pembayaran/deposit, rollback transaksi, QC/pengiriman sampai selesai, laporan, strategi, arsitektur, dan traceability 40 FR. Jalankan `npm run test:legacy` untuk suite dashboard Drizzle secara terpisah.

Akun seed prototype: `pemilik`, `admin`, `penyortir`, `host`, `pengemas`; password semuanya `password123`. Seed juga menyediakan 3 lokasi, 2 bale, 30 item, 5 pelanggan, aturan harga, dan diskon member 10%.

Login mengembalikan JWT dan mengatur cookie HTTP-only `zaraff_token`. Klien API dapat memakai `Authorization: Bearer <token>`. Respons umumnya `{ "data": ... }`; error selalu `{ "error": { "kode": "...", "pesan": "..." } }` dengan HTTP 400/401/403/404/409. Matriks role tersedia di [ARCHITECTURE.md](ARCHITECTURE.md).

Pembayaran transfer memerlukan `buktiBayar`; nominal ditentukan invoice, dan `jumlah` opsional harus sama dengan tagihan. PaymentContract mencatat `menunggu validasi`; `payConfirmed` baru dicatat setelah admin menyetujui. Saldo deposit, status pembayaran/invoice/order/item, audit, dan callback persetujuan berada dalam satu transaksi.

Antrean packing memuat kode serta lokasi tiap item lunas. QC harus cocok persis tanpa kode hilang/tambahan/duplikat. Pengemas mengonfirmasi `pack`, lalu admin mengonfirmasi `handover`; item baru `keluar gudang` saat handover. Kurir simulasi memperbarui `diserahkan → dalam perjalanan → diterima`, dan order menjadi `selesai`.

Laporan bulanan memakai kalender WIB; penjualan dihitung saat persetujuan pembayaran dan pendapatan memakai total setelah diskon. Jumlah keluar gudang memakai tanggal handover. Stok dan grade menunjukkan kondisi saat ini. Semua notifikasi hanya tersimpan sebagai `terkirim (simulasi)`; tidak ada pengiriman pesan eksternal.

Kontrak frontend dan contoh body fase 6–8 tersedia di [openapi.yaml](openapi.yaml); pemetaan kebutuhan ada di [docs/traceability.md](docs/traceability.md). Tabel endpoint prototype:

| Service   | Endpoint                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Auth      | `POST /api/auth/login`<br>`GET /api/auth/me`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| S1        | `GET /api/locations`<br>`POST /api/locations`<br>`PATCH /api/locations/:id`<br>`GET /api/bales`<br>`POST /api/bales`<br>`GET /api/bales/:id`<br>`POST /api/bales/:id/start-sorting`<br>`GET /api/items`<br>`POST /api/items`<br>`GET /api/items/:kode`<br>`PATCH /api/items/:id/grade-price`<br>`PATCH /api/items/:id/ready`<br>`GET /api/laundry`<br>`POST /api/stock/move`<br>`GET /api/stock/movements`<br>`POST /api/stock-counts`<br>`POST /api/stock-counts/:id/items`<br>`POST /api/stock-counts/:id/submit`<br>`GET /api/stock-counts/:id/reconcile`<br>`POST /api/stock-counts/:id/approve`<br>`GET /api/warehouse/summary`<br>`GET /api/warehouse/aging`<br>`GET /api/warehouse/shipped-out` |
| S6        | `GET /api/pricing/suggest`<br>`GET /api/pricing/rules`<br>`PUT /api/pricing/rules`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| S3        | `GET /api/customers`<br>`POST /api/customers`<br>`PATCH /api/customers/:id`<br>`GET /api/customers/:id/member-status`<br>`POST /api/customers/:id/deposit`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| S2/S12    | `GET /api/orders`<br>`GET /api/orders/:id`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| S9        | `GET /api/promotions`<br>`POST /api/promotions`<br>`PATCH /api/promotions/:id`<br>`POST /api/promotions/:id/publish`<br>`POST /api/promotions/:id/reminder`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| S7        | `GET /api/notifications`<br>`GET /api/notifications/me`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| S10       | `GET /api/live/sessions`<br>`POST /api/live/sessions`<br>`PATCH /api/live/sessions/:id/close`<br>`POST /api/live/sessions/:id/claims`<br>`GET /api/live/sessions/:id/claims`<br>`POST /api/live/sessions/:id/claims/import`                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| S12       | `POST /api/orders/:id/invoice`<br>`POST /api/invoices/:id/payments`<br>`POST /api/payments/:id/validate`<br>`POST /api/orders/:id/payment-reminder`<br>`GET /api/packing/queue`<br>`POST /api/orders/:id/quality-check`<br>`POST /api/orders/:id/pack`<br>`POST /api/orders/:id/handover`<br>`POST /api/shipments/:orderId/status`<br>`GET /api/shipments/:orderId/tracking`                                                                                                                                                                                                                                                                                                                           |
| S8        | `GET /api/reports/overview`<br>`GET /api/reports/sales`<br>`GET /api/reports/stock`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| S11       | `POST /api/strategies`<br>`GET /api/strategies`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| Audit     | `GET /api/audit`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| Contracts | `POST /api/contracts/live-claim/claim`<br>`POST /api/contracts/payment/pay`<br>`POST /api/contracts/delivery/status-update`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |

Prototype dan dashboard Drizzle memakai nama environment `DATABASE_URL` yang sama dengan format berbeda. Jalankan dalam proses terpisah dengan nilai environment yang sesuai. Saat menjalankan prototype, pastikan server memakai URL Prisma di atas; `.env.local` milik dashboard lama dapat menimpa `.env`.

## Menjalankan dashboard Drizzle lokal

Prasyarat: Node.js 22.18+ dan npm. Di PowerShell gunakan `npm.cmd` jika `npm.ps1` diblokir.

```bash
npm ci
```

Untuk alur dashboard lama, salin `.env.example` ke `.env.local` dan ubah `DATABASE_URL="./data/zaraff.sqlite"`, lalu:

```bash
npm run db:setup
npm run dev
```

Buka http://localhost:3000/masuk. `db:setup` menjalankan migration dan seed. Database default `data/zaraff.sqlite`; semua browser pada server yang sama menggunakan data yang sama. Seed aman diulang dan tidak menimpa transaksi pengguna. Data contoh mencakup September–November 2026; pilih periode tersebut pada laporan bila bulan berjalan berbeda.

## Akun development

| Role        | Username | Password awal    |
| ----------- | -------- | ---------------- |
| Owner       | zahra    | OwnerDemo!2026   |
| Admin       | keisha   | AdminDemo!2026   |
| Penyortir   | jojo     | SortirDemo!2026  |
| Live Host   | nadia    | HostDemo!2026    |
| Tim Packing | rizky    | PackingDemo!2026 |

Host pembanding `claudia` / `HostClaudia!2026` memiliki penugasan live terpisah untuk menguji isolasi data. Password ini khusus data contoh lokal. Override melalui `SEED_PASSWORD_*` sebelum seed pertama; menjalankan seed ulang tidak mengubah password akun yang sudah ada.

Owner/Admin mengakses modul manajemen sesuai registry. Penyortir hanya Beranda/Gudang; Live Host hanya Beranda/jadwal miliknya; Tim Packing hanya Beranda/antrean dan detail packing. Query `?role=` tidak mengganti sesi. Pratinjau hanya development, wajib login, dan menampilkan pengguna saat ini. Fondasi dan notifikasi tidak termasuk scope.

## Database dan backup

```bash
npm run db:migrate
npm run db:seed
npm run db:backup
```

Perubahan schema dashboard Drizzle: edit `src/server/schema.ts`, jalankan `npx drizzle-kit generate`, tinjau SQL di `drizzle/`, lalu `npm run db:migrate`. `npm run db:generate` khusus client Prisma. Migration SQL dan metadata harus disertakan ke Git. SQLite, backup, file upload, dan `.env.local` diabaikan Git.

Backup memakai SQLite backup API, aman untuk database WAL yang sedang aktif. File tersimpan di `backups/`. Backup folder `uploads/` secara terpisah karena bukti gambar tidak disimpan di SQLite. Untuk restore, hentikan seluruh proses aplikasi, simpan salinan database lama, lalu ganti file database dengan hasil backup pada volume yang sama. Pastikan tidak memakai file `-wal`/`-shm` dari database sebelumnya. Jika memindahkan folder upload, sesuaikan path metadata upload karena path saat ini absolut.

Reset hanya bila sengaja ingin menghapus seluruh data development:

```bash
npm run db:backup
npm run db:reset -- --confirm-reset
npm run db:seed
```

Reset ditolak dalam `NODE_ENV=production`; seed demo produksi juga ditolak secara default. Tidak ada reset otomatis saat aplikasi berjalan.

## Pemeriksaan dan build

```bash
npm run check
npm test
npm run build
npm start
```

`GET /api/health` memeriksa kesiapan tabel database; status 503 berarti migration/database belum siap. Untuk produksi jalankan migration sebelum start, gunakan disk persisten dan HTTPS, set `APP_URL` ke origin publik dan `SESSION_COOKIE_SECURE=true`. Sesuaikan `APP_URL` jika memakai port berbeda. `TRUST_PROXY=true` hanya jika proxy tepercaya mengganti header IP klien. Akun demo bukan provisioning pengguna produksi.

## Integrasi eksternal

CSV, teks terstruktur, dan input manual klaim bekerja tanpa AI. Ekstraksi screenshot/komentar bebas opsional melalui `GEMINI_API_KEY` dan `GEMINI_MODEL` server-only. Ekstraksi harus ditinjau sebelum diproses; waktu ambigu tidak diikutkan sebagai klaim valid. Pemenang selalu ditentukan server berdasarkan timestamp milidetik, lalu nomor baris untuk waktu yang sama.

Publikasi promosi, pengingat invoice, dan distribusi strategi hanya mencatat aktivitas internal; belum mengirim ke TikTok/WhatsApp/email. Transfer divalidasi petugas berdasarkan unggahan, tanpa payment gateway. Pelacakan kurir diperbarui manual melalui **Perbarui status**; belum ada API kurir. Gemini perlu kredensial/model aktif dan belum diuji dengan akun eksternal.

## Struktur

- `src/app/`: route tipis, pemeriksaan sesi/record, API.
- `src/features/`: halaman, komponen khusus modul, model dan aturan bisnis murni.
- `src/components/`: komponen UI/layout bersama; warna memakai `globals.css`.
- `src/server/`: schema, akses SQLite, auth, validasi, transaksi, seed, upload, Gemini.
- `src/lib/workspace-store.tsx`: cache API di memori, loading/error, antrean mutasi dan refresh lintas browser setiap 15 detik/fokus.
- `src/mocks/data/`: fixture seed/test; bukan penyimpanan runtime.
- `drizzle/`: migration yang ditinjau dan dibagikan bersama source.

Panduan teknis: [backend](docs/backend.md), [arsitektur dan design system](docs/architecture.md), serta dokumentasi alur per modul di `docs/`. Tidak ada commit atau push otomatis.
