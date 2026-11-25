# Pengiriman

Tim Packing, Owner dan Admin mengakses `/pengiriman/packing` serta detail checklist. Hanya Owner/Admin mengakses siap dikirim, input resi dan dalam pengiriman. Pembatasan sesi/record juga berlaku di API; Packing tidak menerima nominal keuangan.

Antrean hanya pesanan dengan pembayaran disetujui. Pilih seluruh kode barang, konfirmasi kode cocok, kondisi sesuai grade dan barang dikemas. Checklist tersimpan ke database per perubahan; Tandai dikemas baru aktif bila lengkap. Waktu/petugas berasal dari server.

Owner/Admin mencatat kurir JNE atau J&T Express dan resi unik per kurir, kemudian mengonfirmasi serah terima. Satu transaksi mengubah order menjadi Dikirim, barang Keluar Gudang, melepas rak dan menambah histori. Omzet/penjualan tidak dihitung ulang saat dispatch.

Tombol **Konfirmasi penerimaan** tampil langsung pada setiap baris Dalam pengiriman. Dialog menampilkan pesanan, pembeli, kurir dan resi; petugas mencentang konfirmasi paket sudah diterima, lalu memilih **Ya, selesaikan pesanan**. Order menjadi Selesai, riwayat penerimaan tersimpan dan baris keluar dari daftar pengiriman aktif, dengan tautan ke detail pesanan. Belum ada API kurir atau tracking otomatis. Selesai tidak dapat dikembalikan ke Dikirim melalui command yang sama.

Provider memakai `POST /api/operations/shipping`. Replay request tidak menggandakan histori atau barang keluar. Lihat [backend](backend.md) dan [README](../README.md).
