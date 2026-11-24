# Gudang

Owner, Admin dan Penyortir mendapat akses Gudang dari sesi server. Halaman: daftar/terima/detail bale, sortir, retur sortir, laundry/grading, inventaris/detail barang. Route berada di `src/app/gudang`; komposisi `src/features/gudang/pages`.

Alur: terima bale pada lokasi bale aktif -> mulai sortir -> catat item layak atau retur beserta alasan -> selesai sortir dan lepas lokasi bale -> laundry/grading -> barang Tersedia pada rak aktif. Grading mewajibkan kategori/grade, harga positif, rak aktif dan konfirmasi bersih. Harga rekomendasi dibaca dari aturan Pengaturan. Pindah lokasi mempertahankan transaksi/harga dan mencatat petugas, waktu, asal/tujuan; barang keluar tidak boleh dipindah kembali.

Filter kode, kategori, grade/status, supplier/periode memakai data database; umur barang memakai waktu kini. Riwayat pergerakan dan inventory_history tersimpan di SQLite. Klaim mereservasi barang yang sama; persetujuan pembayaran menandai Terjual dan dispatch menandai Keluar Gudang sekaligus melepas rak.

Provider mengirim command ke `POST /api/operations/warehouse`; validasi dan transaksi ada di `src/server/operations.ts`. Tidak ada localStorage, fallback fixture runtime, atau reset otomatis. Lihat [backend](backend.md) dan [README](../README.md) untuk seed dan perintah.
