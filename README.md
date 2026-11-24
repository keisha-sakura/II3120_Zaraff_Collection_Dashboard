# Zaraff Collection Dashboard

Dashboard operasional full-stack Next.js: frontend dan API satu server, SQLite persisten dengan Drizzle ORM. Modul Beranda, Gudang, Penjualan, Pembayaran, Pengiriman, Laporan/Strategi, dan Pengaturan memakai database; login wajib untuk semua dashboard.

## Menjalankan lokal

Prasyarat: Node.js 22.18+ dan npm. Di PowerShell gunakan `npm.cmd` jika `npm.ps1` diblokir.

```bash
npm ci
```

Salin `.env.example` ke `.env.local`, lalu:

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

Perubahan schema: edit `src/server/schema.ts`, jalankan `npm run db:generate`, tinjau SQL di `drizzle/`, lalu `npm run db:migrate`. Migration SQL dan metadata harus disertakan ke Git. SQLite, backup, file upload, dan `.env.local` diabaikan Git.

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
