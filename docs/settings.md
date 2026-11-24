# Pengaturan

S01–S03 mengikuti referensi HTML. Owner dan Admin mengakses Harga (`/pengaturan/harga`), Diskon (`/pengaturan/diskon`), dan Lokasi (`/pengaturan/lokasi`). `/pengaturan` mengarah ke Harga. Role lain, role tidak valid, dan query role berulang menghasilkan 404. Role query tetap pemilih demo publik, belum autentikasi.

## Harga dan diskon

Harga rekomendasi disimpan untuk tujuh kategori dan grade A/B/C. Filter kategori mempertahankan draf perubahan pada kategori lain; **Simpan perubahan** menyimpan seluruh kategori. Nilai berupa rupiah bulat 1–1.000.000.000. Perubahan belum tersimpan akan hilang saat meninggalkan halaman.

Grading Gudang memakai rekomendasi tersimpan saat membuka form atau mengganti grade. Petugas tetap dapat mengisi harga final. Perubahan aturan tidak mengganti harga barang yang sudah tersimpan atau snapshot harga pesanan.

Diskon member memiliki satu sumber di `sales.memberDiscountPercent`: 0–100%, maksimal dua desimal. **Batal** mengembalikan input ke nilai tersimpan. Pesanan baru dari klaim memakai diskon saat dibuat, dengan pembulatan rupiah. Total, diskon, saldo, dan invoice pesanan sebelumnya tidak diubah.

## Lokasi

Daftar menghitung isi langsung dari lokasi bale dan barang saat ini. Bale selesai sortir dan barang keluar/retur/hapus buku tidak dihitung sebagai penghuni lokasi. **Tambah lokasi** membuka dialog native dengan fokus keyboard dan Escape. Kode dinormalisasi kapital, unik tanpa membedakan kapital, maksimal 32 karakter; keterangan wajib, maksimal 160 karakter.

Referensi hanya menyediakan kode dan keterangan. Jenis diturunkan dari konvensi: awalan `BL-` untuk bale dan pola `R<angka>-S<angka>` untuk rak. Ini mempertahankan pemisahan pilihan lokasi pada terima bale, grading, dan pindah rak. Petunjuk form menjelaskan konvensi. Lokasi baru langsung muncul pada pilihan Gudang. Tidak ada edit/hapus lokasi dalam referensi ini.

## Penyimpanan dan struktur

Key `zaraff.operations.demo.v1` ditambah `settings.priceRules`; fixture awal terpisah di `src/mocks/data/settings-demo.ts`. Data lama memperoleh aturan harga awal tanpa mengganti diskon tersimpan, lokasi, pesanan, saldo, packing, atau strategi. Lokasi tetap berada di `warehouse.locations`; tidak ada daftar duplikat. Operasi modul lain mempertahankan pengaturan. Storage event menyinkronkan tab dan peringatan ditampilkan jika penyimpanan browser tidak tersedia.

Komposisi per halaman ada di `src/features/pengaturan/pages`, komponen provider/screen pada `components`, dan route tipis pada `src/app/pengaturan`. Semua warna memakai token global; tabel, field, dialog, dan tombol menggunakan komponen reusable.

Backend berikutnya perlu memvalidasi sesi Owner/Admin, membuat constraint unik kode lokasi, dan menerapkan transaksi perubahan pengaturan. Harga final serta diskon pesanan harus tetap menjadi snapshot saat transaksi dibuat.

Verifikasi: `npm run check`, `npm test`, `npm run build`, serta browser desktop/mobile. Test mencakup validasi harga/diskon, role, lokasi duplikat/jenis lokasi, dan konsistensi transaksi lama/baru.
