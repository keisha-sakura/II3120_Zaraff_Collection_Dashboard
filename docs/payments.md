# Pembayaran

Owner/Admin saja: antrean validasi, detail transfer/deposit, penolakan beralasan, invoice belum dibayar dan detail invoice. Semua route/API memakai sesi dan registry; query role tidak memberi akses.

Detail invoice menyediakan pencatatan pengajuan pembayaran. Transfer membutuhkan unggahan PNG/JPEG/WebP maksimal 4 MB yang disimpan di luar public dan hanya dapat dibaca pengguna manajemen. Nominal berasal dari pengajuan, bukan diganti saat validasi. Data seed memiliki bukti nama file contoh; unggahan baru menyediakan tautan file nyata.

Approve memeriksa kecukupan nominal, saldo deposit, status order dan kecocokan stok. Seluruh attempt/order/invoice/barang/ledger diperbarui atomik. Deposit disetujui hanya sekali; gagal validasi tidak mengubah saldo atau stok. Snapshot harga/diskon order menjadi sumber nilai tagihan. Reject memerlukan alasan dan memungkinkan pengajuan baru. Pengingat menyimpan histori internal, belum mengirim pesan eksternal.

Seed Fajar: saldo Rp378.500, pengajuan deposit Rp63.000; setelah approve saldo Rp315.500. Seed Sari kurang bayar sehingga approve ditolak. Semua data tetap tersimpan setelah restart/browser lain. Perubahan dikirim ke `POST /api/operations/payments`, validasi Zod dan transaksi server melindungi request berulang.

Detail teknis [backend](backend.md); migration, seed, backup dan akun [README](../README.md).
