# Peta halaman dan folder

Route dan akses ada di `src/config/pages.ts`. Tabel ini menghubungkan layar asli dengan folder implementasi; variasi artboard merupakan state pada halaman yang sama.

| ID             | Modul      | Referensi utama                                                              | Folder halaman                                  | Variasi |
| -------------- | ---------- | ---------------------------------------------------------------------------- | ----------------------------------------------- | ------- |
| B01            | beranda    | [B01-Beranda-owner.dc.html](reference/B01-Beranda-owner.dc.html)             | src/features/beranda/pages/owner                | 3       |
| B02            | beranda    | [B02-Beranda-penyortir.dc.html](reference/B02-Beranda-penyortir.dc.html)     | src/features/beranda/pages/penyortir            | 3       |
| B03            | beranda    | [B03-Beranda-admin.dc.html](reference/B03-Beranda-admin.dc.html)             | src/features/beranda/pages/admin                | 3       |
| B04            | beranda    | [B04-Beranda-packing.dc.html](reference/B04-Beranda-packing.dc.html)         | src/features/beranda/pages/packing              | 3       |
| D01            | pengiriman | [D01-Packing-antrean.dc.html](reference/D01-Packing-antrean.dc.html)         | src/features/pengiriman/pages/packing-antrean   | 1       |
| D02            | pengiriman | [D02-Packing-detail.dc.html](reference/D02-Packing-detail.dc.html)           | src/features/pengiriman/pages/packing-detail    | 1       |
| D03            | pengiriman | [D03-Siap-dikirim.dc.html](reference/D03-Siap-dikirim.dc.html)               | src/features/pengiriman/pages/siap-dikirim      | 1       |
| D04            | pengiriman | [D04-Input-resi.dc.html](reference/D04-Input-resi.dc.html)                   | src/features/pengiriman/pages/input-resi        | 1       |
| D06            | pengiriman | [D06-Dalam-pengiriman.dc.html](reference/D06-Dalam-pengiriman.dc.html)       | src/features/pengiriman/pages/dalam-pengiriman  | 1       |
| G01            | gudang     | [G01-Bale-daftar.dc.html](reference/G01-Bale-daftar.dc.html)                 | src/features/gudang/pages/bale-daftar           | 1       |
| G02            | gudang     | [G02-Bale-terima.dc.html](reference/G02-Bale-terima.dc.html)                 | src/features/gudang/pages/bale-terima           | 1       |
| G03            | gudang     | [G03-Bale-detail.dc.html](reference/G03-Bale-detail.dc.html)                 | src/features/gudang/pages/bale-detail           | 1       |
| G04            | gudang     | [G04-Sortir-item.dc.html](reference/G04-Sortir-item.dc.html)                 | src/features/gudang/pages/sortir-item           | 1       |
| G05            | gudang     | [G05-Sortir-retur.dc.html](reference/G05-Sortir-retur.dc.html)               | src/features/gudang/pages/sortir-retur          | 2       |
| G07            | gudang     | [G07-Laundry.dc.html](reference/G07-Laundry.dc.html)                         | src/features/gudang/pages/laundry               | 1       |
| G08            | gudang     | [G08-Grading.dc.html](reference/G08-Grading.dc.html)                         | src/features/gudang/pages/grading               | 1       |
| G09            | gudang     | [G09-Inventaris.dc.html](reference/G09-Inventaris.dc.html)                   | src/features/gudang/pages/inventaris            | 1       |
| G10            | gudang     | [G10-Barang-detail.dc.html](reference/G10-Barang-detail.dc.html)             | src/features/gudang/pages/barang-detail         | 2       |
| M01            | auth       | [M01-Masuk.dc.html](reference/M01-Masuk.dc.html)                             | src/features/auth/pages/masuk                   | 1       |
| P01            | penjualan  | [P01-Live-jadwal.dc.html](reference/P01-Live-jadwal.dc.html)                 | src/features/penjualan/pages/live-jadwal        | 1       |
| P02            | penjualan  | [P02-Live-konten.dc.html](reference/P02-Live-konten.dc.html)                 | src/features/penjualan/pages/live-konten        | 1       |
| P03            | penjualan  | [P03-Live-barang.dc.html](reference/P03-Live-barang.dc.html)                 | src/features/penjualan/pages/live-barang        | 1       |
| P04            | penjualan  | [P04-Live-publikasi.dc.html](reference/P04-Live-publikasi.dc.html)           | src/features/penjualan/pages/live-publikasi     | 1       |
| P05            | penjualan  | [P05-Live-impor-klaim.dc.html](reference/P05-Live-impor-klaim.dc.html)       | src/features/penjualan/pages/live-impor-klaim   | 1       |
| P06            | penjualan  | [P06-Live-hasil-klaim.dc.html](reference/P06-Live-hasil-klaim.dc.html)       | src/features/penjualan/pages/live-hasil-klaim   | 1       |
| P07            | penjualan  | [P07-Pesanan-daftar.dc.html](reference/P07-Pesanan-daftar.dc.html)           | src/features/penjualan/pages/pesanan-daftar     | 1       |
| P08            | penjualan  | [P08-Pesanan-detail.dc.html](reference/P08-Pesanan-detail.dc.html)           | src/features/penjualan/pages/pesanan-detail     | 1       |
| P09            | penjualan  | [P09-Pelanggan-daftar.dc.html](reference/P09-Pelanggan-daftar.dc.html)       | src/features/penjualan/pages/pelanggan-daftar   | 1       |
| P10            | penjualan  | [P10-Pelanggan-detail.dc.html](reference/P10-Pelanggan-detail.dc.html)       | src/features/penjualan/pages/pelanggan-detail   | 1       |
| R01            | laporan    | [R01-Ringkasan-bisnis.dc.html](reference/R01-Ringkasan-bisnis.dc.html)       | src/features/laporan/pages/ringkasan-bisnis     | 1       |
| R02            | laporan    | [R02-Laporan-bulanan.dc.html](reference/R02-Laporan-bulanan.dc.html)         | src/features/laporan/pages/laporan-bulanan      | 1       |
| R03            | laporan    | [R03-Gudang-umur-stok.dc.html](reference/R03-Gudang-umur-stok.dc.html)       | src/features/laporan/pages/gudang-umur-stok     | 1       |
| R04            | laporan    | [R04-Terjual-keluar.dc.html](reference/R04-Terjual-keluar.dc.html)           | src/features/laporan/pages/terjual-keluar       | 1       |
| R05            | laporan    | [R05-Strategi-daftar.dc.html](reference/R05-Strategi-daftar.dc.html)         | src/features/laporan/pages/strategi-daftar      | 1       |
| R06            | laporan    | [R06-Strategi-tulis.dc.html](reference/R06-Strategi-tulis.dc.html)           | src/features/laporan/pages/strategi-tulis       | 1       |
| R07            | laporan    | [R07-Strategi-kirim.dc.html](reference/R07-Strategi-kirim.dc.html)           | src/features/laporan/pages/strategi-kirim       | 1       |
| S01            | pengaturan | [S01-Aturan-harga.dc.html](reference/S01-Aturan-harga.dc.html)               | src/features/pengaturan/pages/aturan-harga      | 1       |
| S02            | pengaturan | [S02-Diskon-member.dc.html](reference/S02-Diskon-member.dc.html)             | src/features/pengaturan/pages/diskon-member     | 1       |
| S03            | pengaturan | [S03-Lokasi.dc.html](reference/S03-Lokasi.dc.html)                           | src/features/pengaturan/pages/lokasi            | 2       |
| S05            | notifikasi | [S05-Log-notifikasi-mmuc.dc.html](reference/S05-Log-notifikasi-mmuc.dc.html) | src/features/notifikasi/pages/log               | 1       |
| Y01            | pembayaran | [Y01-Menunggu-validasi.dc.html](reference/Y01-Menunggu-validasi.dc.html)     | src/features/pembayaran/pages/menunggu-validasi | 1       |
| Y02            | pembayaran | [Y02-Validasi-transfer.dc.html](reference/Y02-Validasi-transfer.dc.html)     | src/features/pembayaran/pages/validasi-transfer | 2       |
| Y03            | pembayaran | [Y03-Validasi-deposit.dc.html](reference/Y03-Validasi-deposit.dc.html)       | src/features/pembayaran/pages/validasi-deposit  | 1       |
| Y05            | pembayaran | [Y05-Belum-dibayar.dc.html](reference/Y05-Belum-dibayar.dc.html)             | src/features/pembayaran/pages/belum-dibayar     | 1       |
| Y06            | pembayaran | [Y06-Tagihan-detail.dc.html](reference/Y06-Tagihan-detail.dc.html)           | src/features/pembayaran/pages/tagihan-detail    | 1       |
| B05 (internal) | beranda    | Belum tersedia                                                               | src/features/beranda/pages/live-host            | 0       |
