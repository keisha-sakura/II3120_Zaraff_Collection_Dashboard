# Laporan

Modul mengikuti R01–R07 pada referensi HTML. Owner dan Admin memiliki akses ke semua halaman; Penyortir, Live Host, dan Tim Packing mendapat 404. Query `role` memilih demo publik, belum merupakan autentikasi.

| Halaman                   | Route                                  |
| ------------------------- | -------------------------------------- |
| Ringkasan bisnis          | `/laporan/ringkasan`                   |
| Laporan bulanan           | `/laporan/bulanan`                     |
| Gudang dan umur stok      | `/laporan/umur-stok`                   |
| Barang terjual dan keluar | `/laporan/terjual-keluar`              |
| Strategi bulanan          | `/laporan/strategi`                    |
| Tulis strategi            | `/laporan/strategi/baru`               |
| Kirim strategi            | `/laporan/strategi/[strategyId]/kirim` |

`/laporan` mengarah ke ringkasan. Filter bulan memakai query `month=2026-11`; refresh mempertahankan pilihan. Query bulan/role berulang atau tidak valid ditolak. Laporan bulanan awal memakai Oktober 2026 sesuai referensi; halaman lain memakai November 2026.

## Perhitungan

- Data berasal dari workspace operasional yang sama. Pembayaran disetujui memasukkan barang ke laporan terjual; penyerahan ke kurir menambahkan tanggal keluar tanpa menambah pendapatan lagi.
- Periode mengikuti `soldAt` dalam zona Asia/Jakarta. Pendapatan memakai harga dan total pesanan tersimpan setelah diskon. Diskon dibagi proporsional per barang; sisa pembulatan rupiah dialokasikan ke baris terakhir. Perubahan harga Gudang tidak mengubah pendapatan pesanan sebelumnya.
- Kartu, tabel, dan CSV memakai selector yang sama. CSV mencakup BOM UTF-8, escaping kutip/koma/baris baru, dan perlindungan formula spreadsheet.
- Stok tersedia, pesanan aktif, validasi pembayaran, bale, laundry, dan stok per kategori/grade adalah posisi saat ini. Pada laporan Gudang, filter periode berlaku untuk barang keluar dan retur; label menjelaskan cakupannya.
- Umur stok dihitung sejak `availableAt` untuk barang Tersedia, dengan batas inklusif 30/60/90 hari. Acuan dummy tetap 24 November 2026.
- Stok akhir bulan direkonstruksi dari tanggal tersedia dan terjual, mencakup Tersedia + Dipesan. Data demo belum memiliki ledger histori grade, penghapusbukuan, dan retur inventaris yang lengkap; laporan historis produksi memerlukan snapshot atau event ledger server.

Fixture operasional hanya subset yang saling terhubung. Oktober belum memiliki penjualan pada subset tersebut, sehingga menampilkan nol penjualan. Stok yang tanggal tersedianya sudah tercatat tetap dihitung. Angka dan selisih total contoh HTML tidak disalin sebagai total statis.

## Strategi dan penyimpanan

Fixture strategi terpisah di `src/mocks/data/reports-demo.ts`. Form menawarkan contoh isi Desember dan ringkasan data bulan sebelumnya. Bulan dapat dipilih, isi wajib diisi maksimal 10.000 karakter, dan satu bulan hanya memiliki satu strategi. Simpan membuat draf sebelum pemilihan penerima. **Nanti saja** mempertahankan draf; buka kembali dari daftar.

Penerima mengikuti referensi: Keisha, Jojo, Nadia, dan Rizky. Minimal satu staf wajib dipilih. Simulasi pengiriman menyimpan penerima serta waktu dan menampilkan hasil baca saja untuk mencegah pengiriman ulang. Tidak ada pengiriman pesan eksternal, notifikasi akun staf, atau perubahan Notes Owner pada Beranda dalam tahap ini.

Workspace `zaraff.operations.demo.v1` ditambah bagian `reports`. Data lama memperoleh fixture strategi tanpa mengganti saldo, pesanan, packing, atau resi. Operasi modul lain mempertahankan bagian laporan. Storage event menyinkronkan tab; jika localStorage tidak tersedia, perubahan disimpan dalam memori dengan peringatan.

## Struktur dan integrasi

Route tipis di `src/app/laporan`, komposisi di `src/features/laporan/pages`, agregasi di `selectors.ts`, dan mutasi strategi di `operations.ts`. Komponen memakai token `globals.css`. `BarChart` reusable menyediakan label aksesibel dan menangani nilai nol.

Untuk backend, gunakan ledger server, sesi terverifikasi, serta transaksi strategi/distribusi. Status pengiriman harus mengikuti hasil layanan notifikasi sebenarnya.

Verifikasi: `npm run check`, `npm test`, dan `npm run build`. Test mencakup batas bulan WIB, diskon/pembulatan, umur stok, stok akhir bulan, validasi strategi, batas role, dan escaping CSV.
