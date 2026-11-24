# Laporan dan strategi

Owner/Admin: ringkasan bisnis, laporan bulanan/CSV, umur stok, terjual/keluar, daftar/tulis/kirim strategi. Seluruh angka berasal dari database yang sama dengan modul operasional, bukan snapshot artboard.

Penjualan periode memakai soldAt saat pembayaran disetujui dan net harga setelah snapshot diskon; pengiriman periode memakai outboundAt. Counter “N barang · M sudah keluar gudang” menghitung barang terjual hasil filter dan berapa di antaranya sudah keluar. Dispatch tidak menambah omzet. Batas bulan Asia/Jakarta, termasuk transaksi UTC yang sudah masuk tanggal berikutnya di WIB.

Stok akhir bulan memakai histori status/grade/harga terakhir sebelum awal bulan berikutnya WIB. Posisi Tersedia/Dipesan dihitung sebagai stok akhir; Terjual/Keluar tidak termasuk. Perubahan harga, diskon atau status masa kini tidak menimpa histori bulan lama. Umur stok adalah posisi Tersedia saat ini, bukan snapshot bulan yang dipilih. CSV dan tabel memakai selector/filter sama dan ekspor menetralkan formula spreadsheet.

Strategi draf tersimpan per bulan. Kirim strategi menyimpan penerima terpilih dan waktu server; catatan muncul pada Beranda penerima. Distribusi merupakan catatan internal, belum pengiriman WhatsApp/email/notifikasi. Tidak ada route notifikasi.

Command strategi menuju `POST /api/operations/reports`; laporan membaca snapshot API berbatas role. Dokumentasi metrik/transaksi [backend](backend.md); seed beberapa bulan dan akun [README](../README.md).
