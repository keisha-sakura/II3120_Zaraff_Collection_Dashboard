# Dummy data

`data/` berisi fixture demo per domain. File `*-demo.ts` menginisialisasi data operasional; fixture dasar Gudang dan snapshot Beranda tetap terpisah. `repositories/home.ts` menyediakan payload Beranda melalui kontrak server. Repository katalog Fondasi dan fixture transaksi lama sudah dihapus.

Fixture merupakan subset konsisten dari referensi, bukan seed database. Total laporan interaktif dihitung dari data operasional. Nominal IDR berupa angka rupiah dan tanggal berformat ISO. Acuan dummy tetap November 2026.

Provider modul interaktif langsung memakai `store/operations-store.ts` untuk snapshot bersama di localStorage. Operasi dan validasi domain terpisah dari UI agar nanti dapat dipindahkan ke service/API server. Lihat panduan Gudang, Penjualan, Pembayaran, Pengiriman, Laporan, dan Pengaturan pada folder `docs/`.
