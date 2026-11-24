# Backend SQLite

## Akses dan alur data

Halaman server memanggil `requireUser`/`requireRecord`, kemudian memeriksa registry `src/config/pages.ts` dan akses record. Host hanya melihat live dengan hostId miliknya; Packing hanya membuka pesanan yang pembayarannya disetujui. API memeriksa sesi dan izin kembali, termasuk saat URL atau payload dibuat manual.

`GET /api/workspace` membaca snapshot konsisten dalam transaksi read dan memproyeksikan data berdasarkan role. Data keuangan tidak dikirim ke Host/Packing. Beranda dihitung oleh `src/server/home.ts` dari tabel yang sama pada setiap request halaman. Reload/navigasi Beranda membaca ulang agregat. Halaman interaktif memakai cache di memori, refresh saat fokus dan setiap 15 detik; tidak ada state operasional di localStorage.

`POST /api/operations/[domain]` menerima command tervalidasi Zod, menjalankan aturan domain dan menyimpan perubahan di dalam `BEGIN IMMEDIATE`. Domain: `warehouse`, `sales`, `payments`, `shipping`, `reports`, `settings`, `deposit`. Actor berasal dari sesi; waktu berasal dari server. Constraint database menjadi pengaman terakhir untuk FK, kode unik, satu barang per order dan satu pembayaran approved per order.

Header mutasi wajib: `Content-Type: application/json`, `X-Zaraff-Request: 1`, `Origin` sesuai `APP_URL`, serta `Idempotency-Key` acak 16–100 karakter. Kunci terikat ke pengguna, domain dan hash payload. Retry dengan payload sama mengembalikan hasil tersimpan; payload berbeda pada kunci sama ditolak. Write lock menyerialisasi request dari koneksi/proses berbeda. UI menonaktifkan form selama request dan mempertahankan kunci saat koneksi gagal.

## Model relasional

Schema Drizzle terdapat di `src/server/schema.ts`; SQL di `drizzle/`. Kelompok tabel:

- Auth: users, sessions, login_limits.
- Gudang: suppliers, bales, items, categories, grades, locations, supplier_returns, movements, inventory_history.
- Penjualan: customers, deposit_ledger, lives, live_items, live_drafts, claim_batches, claims, orders, order_lines.
- Pembayaran: invoices, invoice_events, payment_attempts, uploads.
- Pengiriman: packing, picked_items, shipments, shipment_events.
- Strategi/pengaturan: strategies, strategy_recipients, price_rules, settings.
- Konsistensi: operation_requests, audit_log.

Nominal uang berupa integer rupiah; diskon persentase boleh desimal. Snapshot detail harga dan potongan disimpan pada pesanan. JSON dibatasi pada konfigurasi, array konten, dan payload ekstraksi; relasi operasional mempunyai tabel/FK sendiri. Timestamp aktivitas dinormalisasi ke UTC ISO; klaim juga menyimpan waktu-of-day milidetik beserta sesi live. UI/periode memakai Asia/Jakarta.

## Autentikasi

Password scrypt dengan salt acak; token sesi acak disimpan sebagai SHA-256, cookie HttpOnly/SameSite=Lax, kedaluwarsa delapan jam, Secure untuk origin HTTPS. Logout menghapus sesi server. Login gagal dibatasi lima percobaan per username/IP dalam 15 menit, ditambah batas IP; counter tersimpan di SQLite. Tanpa proxy tepercaya, IP dianggap `direct`, sehingga limit IP dibagi pengguna pada server lokal.

Endpoint: `POST /api/auth/login`, `GET /api/auth/me`, `POST /api/auth/logout`. Tidak ada registrasi, reset password, atau CRUD pengguna karena UI belum menyediakan alurnya. Ganti akun demo sebelum deployment publik. Pratinjau bukan impersonasi; URL role dan browser storage tidak dipakai untuk autentikasi.

## Transaksi dan definisi laporan

- Klaim valid tertua menang; waktu sama mengikuti nomor baris asli. Duplikat identik ditandai; handle/kode dinormalisasi. Hanya satu proses klaim per live, stok tersedia harus cocok dengan daftar live. Raw source, hasil/keputusan, alasan dan batch disimpan.
- Pembayaran mengubah attempt, invoice/pesanan, stok, debit saldo dan ledger secara atomik. Kurang bayar, saldo kurang, atau stok berubah ditolak tanpa perubahan parsial. Top up adalah pencatatan petugas, bukan konfirmasi bank otomatis.
- Packing membutuhkan semua barang dipilih, kode cocok, kondisi cocok, dan konfirmasi kemas. Dispatch membutuhkan status Dikemas dan resi unik per kurir; stok keluar, lokasi rak dilepas, dan histori ditulis bersama.
- Pembaruan tracking manual hanya Owner/Admin, dari pesanan Dikirim. Status Diterima menyelesaikan pesanan tanpa menjual ulang atau menambah omzet.
- Penjualan dihitung pada soldAt (pembayaran approved), bukan createdAt atau dispatchedAt. Pengiriman periode dihitung dari outboundAt. Counter keluar pada tabel penjualan menunjukkan berapa barang hasil filter yang sudah keluar, meski tanggal keluarnya bulan lain.
- Pendapatan adalah harga snapshot dikurangi alokasi diskon pesanan, tanpa menghitung ulang dari aturan harga/member terbaru. Stok akhir bulan mengambil histori terakhir sebelum pukul 00:00 WIB bulan berikutnya; stok dipesan masih termasuk stok gudang, Terjual/Keluar tidak termasuk stok akhir tersedia/dipesan. Umur stok menggunakan posisi terkini dan waktu server. CSV mengikuti dataset/filter yang sama dengan tabel.
- Target progres Owner disimpan di settings (`monthly-sale-target`, `monthly-revenue-target`); seed memberi target contoh. Semua jumlah aktual dihitung dari data.

## Unggahan dan AI

`POST /api/uploads` hanya Owner/Admin, PNG/JPEG/WebP maksimal 4 MB, magic signature dicek, nama penyimpanan UUID. Ukuran request dibatasi saat stream dibaca. `GET /api/uploads/[id]` juga memerlukan sesi manajemen; file tidak diletakkan di public/. File dan metadata perlu backup bersama.

`POST /api/claims/extract` menerima liveId dan teks atau uploadId, timeout 25 detik, maksimum sepuluh request per pengguna/menit. Hasil Gemini divalidasi schema dan disimpan sebagai batch needs-review. Konten input diperlakukan sebagai data, bukan instruksi. Tidak ada mutasi stok/order pada tahap ekstraksi. Waktu kosong/ambigu menghasilkan klaim tidak valid untuk ditinjau. Kegagalan atau kredensial kosong menampilkan error tanpa menonaktifkan impor CSV/manual. API key tidak memakai NEXT_PUBLIC_. Pilih model yang tersedia pada akun, isi GEMINI_MODEL sesuai dokumentasi provider.

## Operasional dan batas deployment

Jalankan migration eksplisit sebelum start; aplikasi tidak seed/reset otomatis. SQLite WAL dan busy_timeout 5 detik dipakai pada disk lokal persisten. Satu deployment/server dengan file bersama cocok untuk aplikasi ini; platform ephemeral/serverless multi-instance tanpa volume SQLite bersama tidak cocok. Backup memakai SQLite backup API, bukan copy file database aktif. Lihat README untuk seed/reset/restore.

Publikasi, pengingat dan distribusi strategi adalah catatan/simulasi internal. Belum ada integrasi TikTok, gateway pembayaran, WhatsApp/email, atau webhook kurir. Tidak ada pengiriman pesan eksternal dari implementasi ini. Modul Pengaturan hanya mengubah aturan harga, diskon dan lokasi sesuai halaman yang ada.

Test `tests/backend.test.mjs` menjalankan migration/seed ke database terisolasi, memeriksa FK/ledger, auth/ACL, rollback, replay/concurrency koneksi SQLite, histori dan agregat. Test domain lain mencakup klaim, periode WIB, CSV dan aturan tiap modul. Kredensial Gemini tidak diperlukan untuk test deterministik.
