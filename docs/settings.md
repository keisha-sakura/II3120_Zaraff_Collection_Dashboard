# Pengaturan

Owner/Admin sesuai registry: aturan harga kategori/grade, diskon member dan daftar/tambah lokasi. Sesi diperiksa server/API; role dari query/body tidak dipercaya.

Aturan harga positif disimpan di price_rules dan dipakai rekomendasi grading berikutnya. Diskon 0–100% disimpan sebagai setting; hanya order baru menggunakan nilai terbaru. Harga/detail dan diskon order lama adalah snapshot tetap. Lokasi mempunyai kode unik, jenis bale/rak, deskripsi dan status aktif; kode ganda atau referensi tidak valid ditolak.

Provider mengirim command tervalidasi ke `POST /api/operations/settings`; perubahan, audit actor dan idempotency key disimpan satu transaksi SQLite. Lokasi dan rekomendasi langsung tersedia pada Gudang melalui cache API bersama. Tidak ada CRUD pengguna, notifikasi, atau pengaturan integrasi baru di luar halaman yang sudah disepakati.

Lihat [backend](backend.md) dan [README](../README.md) untuk migration/seed, backup dan akses akun.
