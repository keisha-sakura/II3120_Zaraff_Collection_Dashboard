# Penjualan

Owner/Admin mengakses jadwal/promosi, wizard live, impor/hasil klaim, pesanan/detail dan pelanggan/detail. Live Host hanya membaca jadwal dengan hostId sesuai sesi; API juga membatasi data dan tidak mengirim pesanan, pelanggan atau keuangan. Komposisi halaman di `src/features/penjualan/pages`.

Wizard memilih waktu/host aktif, barang tersedia, konten dan kanal; draft tersimpan per pengguna, bukan bersama semua Admin. Publikasi mencatat status promosi internal, belum mengirim TikTok. Tombol Selesaikan live memungkinkan impor setelah sesi selesai.

Impor mendukung CSV, teks terstruktur dan input manual. Normalisasi handle/kode, validasi waktu sampai milidetik, lalu pilih klaim valid tertua per barang; timestamp sama mengikuti nomor baris asli. Duplikat identik ditandai. Alasan hasil dan sumber batch tersimpan. Seluruh reservasi, order/detail snapshot harga/diskon dan invoice dibuat dalam satu transaksi. Live yang sudah diproses tidak membuat pesanan lagi; barang tidak dapat terjual ke dua order.

Input hanya melalui komentar manual atau CSV, tanpa pratinjau klaim dan tanpa screenshot. Proses klaim memanggil Gemini untuk memeriksa kode barang yang disebut serta maksud komentar; pertanyaan, pengulangan, percakapan dan klaim bersyarat tidak membuat order. Handle dan timestamp dibaca parser dari sumber, bukan hasil AI. Hasil pemeriksaan dan sumber asli disimpan bersama batch yang diproses. CSV klaim eksplisit `handle,kode,waktu` dan form Tambah manual tetap deterministik tanpa Gemini. Contoh format: [komentar dan CSV](claim-comments.md). Lihat [backend](backend.md).

Data pelanggan dan status member tersimpan. Top up deposit mencatat ledger dengan petugas/waktu server; pembayaran deposit memotong tepat sekali saat disetujui. Harga dan diskon pesanan lama tidak mengikuti perubahan aturan baru.

Command menuju `POST /api/operations/sales` dan `deposit`; state dibaca dari API, tidak localStorage. Data contoh dan akun tersedia melalui seed pada [README](../README.md).
