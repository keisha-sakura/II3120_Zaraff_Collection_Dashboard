# Modul Pembayaran

Implementasi mengikuti Y01, Y02, Y03, Y05, Y06 dan variasi dialog penolakan Y02. Seluruh halaman hanya tersedia untuk Owner dan Admin. Penyortir, Live Host, dan Tim Packing mendapat 404 saat membuka URL-nya. Query role tetap untuk demo publik; backend asli harus menggunakan sesi terverifikasi.

| Halaman           | Contoh URL                                              |
| ----------------- | ------------------------------------------------------- |
| Menunggu validasi | `/pembayaran/validasi?role=admin`                       |
| Validasi transfer | `/pembayaran/validasi/payment-sari/transfer?role=admin` |
| Validasi deposit  | `/pembayaran/validasi/payment-fajar/deposit?role=admin` |
| Belum dibayar     | `/pembayaran/tagihan?role=admin`                        |
| Detail tagihan    | `/pembayaran/tagihan/INV-261121-004?role=admin`         |

Route tipis ada di `src/app/pembayaran/`; komposisi per halaman di `src/features/pembayaran/pages/`. `PaymentValidation` dipakai bersama untuk transfer dan deposit, sementara `BillSummary` merangkum snapshot harga/grade/diskon pesanan. Semua warna tetap dari `globals.css`.

## Data dan contoh referensi

`src/mocks/data/payments-demo.ts` menyiapkan attempt pembayaran, tagihan, serta histori. Bukti transfer merupakan kartu contoh berisi nama file dan nominal, bukan bukti bank asli. Nominal contoh Sari Rp 48.500 dibanding tagihan Rp 58.500, mengikuti detail Y02; daftar menampilkan nominal yang sama dengan bukti agar tidak menyesatkan.

Demo baru mengikuti tahap sebelum validasi deposit Fajar: saldo Rp 378.500, pembayaran Rp 63.000 masih pending, pesanan menunggu pembayaran, dan barang masih Dipesan. Menyetujui menghasilkan saldo Rp 315.500. Penyesuaian fixture ini hanya terjadi sebelum workspace baru digunakan.

Workspace lama dari tahap Penjualan dapat sudah menyimpan Fajar sebagai Lunas dengan saldo Rp 315.500 dan debit Rp 63.000. Migrasi menambahkan metadata Pembayaran tanpa mengubah status, saldo, ledger, maupun stok lama. Dalam kasus itu halaman deposit menampilkan hasil disetujui, tanpa tombol persetujuan ulang. Untuk mencoba seluruh alur dari awal, gunakan browser/profile terpisah atau hapus key demo secara sengaja. Jangan menghapus data lama hanya untuk menyamakan snapshot referensi.

## Aksi

- Persetujuan hanya berlaku pada attempt pending untuk pesanan yang masih menunggu pembayaran dan validasi. Nominal harus tepat sesuai tagihan; untuk transfer, nominal bukti juga harus sesuai. Deposit memerlukan saldo cukup. Seluruh barang harus masih Dipesan untuk pesanan tersebut.
- Satu persetujuan memperbarui attempt dan reviewer, pesanan menjadi Lunas, stok menjadi Terjual, waktu terjual, serta histori pergerakan. Lokasi rak tetap, `outboundAt` tidak diisi; keluar gudang merupakan tahap Pengiriman.
- Metode deposit menambah satu debit ledger dan menyimpan saldo sebelum/sesudah. Persetujuan ulang, penolakan setelah persetujuan, dan saldo kurang diblokir. Transfer tidak memotong saldo deposit.
- Penolakan wajib memiliki alasan 3–500 karakter. Attempt ditolak dan tagihan kembali Belum Dibayar. Barang tetap Dipesan; saldo, ledger, dan total tagihan tidak berubah.
- Kirim pengingat hanya tersedia untuk tagihan Belum Dibayar, bukan Lunas atau sedang divalidasi. Aksi mencatat histori demo dengan pelaku dan waktu. Token permintaan menjaga klik ganda agar tidak menambah event berulang; tombol dinonaktifkan setelah berhasil pada kunjungan itu. Membuka ulang halaman memungkinkan permintaan baru yang disengaja.

Pengingat tidak mengirim WhatsApp/email atau memanggil layanan eksternal. Bukti/pengajuan pembayaran baru nantinya datang dari integrasi pelanggan/backend; modul ini mengerjakan validasi admin atas pengajuan yang tersedia, tanpa membolehkan admin mengubah nominal bukti untuk meloloskan pembayaran.

## Integrasi antarmodul

Workspace `zaraff.operations.demo.v1` sekarang memuat `warehouse`, `sales`, dan `payments`. Persetujuan/penolakan ditulis sebagai satu snapshot agar saldo, status pesanan, dan stok tidak terpisah. `ensureInvoices` menambahkan tagihan untuk pesanan baru dari klaim tanpa menimpa histori lama. Adapter Gudang/Penjualan mempertahankan bagian Pembayaran saat menulis perubahan.

`model.ts` berisi kontrak, `operations.ts` transisi murni dan validasi, `persistence.ts` pemeriksaan struktur snapshot, dan `components/payments-provider.tsx` batas data/action bagi UI. Snapshot tanpa metadata Pembayaran diperkaya secara kompatibel. Beranda tetap memakai snapshot pelaporan terpisah.

Ini masih penyimpanan demo di browser, bukan transaksi uang atau database. Saat backend ditambahkan, pindahkan validasi ke server, gunakan transaksi/locking untuk pesanan dan saldo, serta idempotency key pembayaran. Pertahankan harga/diskon yang tersimpan pada pesanan; jangan menghitung ulang tagihan berdasarkan perubahan profil member setelah pesanan dibuat.

## Pemeriksaan

`npm run check`, `npm test`, dan `npm run build`. Tes mencakup migrasi, debit sekali saja, saldo kurang, reservasi berubah, nominal transfer, penolakan, pengingat, invoice pesanan baru, dan konsistensi stok/pesanan. Tanggal fixture/umur tagihan memakai acuan demo November 2026; aksi baru menyimpan waktu saat dilakukan.
