# Modul Penjualan

Implementasi mengikuti P01–P10 di referensi: Jadwal Live & Promosi, konten/jadwal, pemilihan barang, tinjauan/publikasi, impor klaim, hasil klaim, daftar/detail pesanan, serta daftar/detail pelanggan. Route tipis ada di `src/app/penjualan/`, komposisi per halaman di `src/features/penjualan/pages/`, dan dummy terpisah di `src/mocks/data/sales-demo.ts`.

Owner dan Admin mengakses seluruh halaman. Live Host hanya membaca `/penjualan/live?role=live-host`, dengan sesi yang `hostId`-nya sesuai user demo. Role itu tidak mendapat aksi jadwalkan, edit, publikasi, impor/hasil klaim, pesanan, atau pelanggan. Penyortir dan Tim Packing tidak dapat membuka modul ini. Route memeriksa role demo di server; ini belum autentikasi data asli.

## Jadwal dan promosi

Klik Jadwalkan live untuk memulai wizard:

1. Judul, isi promosi, tanggal/jam WIB di masa depan, host, dan minimal satu kanal wajib diisi.
2. Pilih barang berstatus Tersedia dengan grade/harga valid. Filter kategori tidak menghapus pilihan di kategori lain. Pilihan diperiksa kembali saat disimpan agar stok yang sudah Dipesan tidak ikut dijadwalkan.
3. Tinjau metadata, isi, dan rentang harga, lalu Simpan draf atau Publikasikan. Publikasi hanya mengubah status demo; tidak mengirim ke Instagram, TikTok, atau Shopee. Menjadwalkan live tidak mereservasi stok.

Konten yang dilanjutkan ke langkah berikutnya bertahan di draft tersimpan. Baris live akan datang membuka wizard untuk mengedit sesi yang sama; sesi selesai membuka impor atau hasil klaim. Sesi demo selesai sudah disediakan. Status selesai kelak datang dari backend; aplikasi ini tidak mengoperasikan siaran TikTok atau menganggap suatu live selesai hanya karena jam mulainya telah berlalu.

## Klaim dan pesanan

Gunakan Live Senin Sore (`live-261123`) untuk mencoba impor. Input dapat berupa teks, CSV UTF-8, atau dialog Tambah manual. Kolomnya `handle,kode,waktu`; header opsional `handle,kode,waktu`. CSV mendukung quoted fields dan BOM, maksimal 1 MB dan 1.000 klaim. Waktu berupa HH:MM:SS atau HH:MM:SS.mmm; pecahan hingga tiga digit dinormalisasi tanpa membuang milidetik. Semua komentar diasumsikan berada pada hari live yang sama.

Pratinjau memisahkan kesalahan format per baris. Proses klaim:

- Mengurutkan komentar menurut waktu, lalu nomor baris untuk waktu yang persis sama.
- Memeriksa kode, keanggotaan barang pada sesi live, ketersediaan, grade, dan harga.
- Menentukan satu pemenang tercepat per barang. Komentar identik ditolak sebagai duplikat; klaim lain yang kalah diberi alasan.
- Membuat satu pesanan per pembeli per sesi, menggabungkan seluruh barang yang dimenangkan. Diskon member 10% berasal dari fixture dan dihitung dari subtotal dalam rupiah bulat.
- Handle baru membuat profil pelanggan awal dengan saldo nol dan kontak belum lengkap. Lengkapi data melalui halaman pelanggan.
- Menandai stok sebagai Dipesan, menyimpan orderId, dan menambah riwayat reservasi di Gudang. Klaim tidak menandai barang Terjual atau memotong saldo deposit.
- Menandai sesi telah diproses agar proses ulang tidak membuat pesanan ganda. Hasil menyimpan komentar, alasan, dan tautan pesanan.

Jumlah kartu ringkasan dan tabel dihitung dari hasil aktual. Angka contoh di HTML yang tidak konsisten tidak dipaksakan ke fixture. Snapshot pesanan menyimpan harga dan diskon saat dibuat; perubahan member berikutnya tidak mengubah tagihan lama.

## Pelanggan

Daftar mendukung pencarian nama/handle dan filter member. Tambah pelanggan menggunakan dialog; detail menggunakan form bersama untuk nama, handle unik, kontak WhatsApp, dan status member. Saldo serta riwayat deposit ditampilkan sebagai data baca. Mengedit profil tidak mengubah saldo, riwayat deposit, atau total pesanan sebelumnya.

## Penyimpanan dan penggantian backend

`model.ts` mendefinisikan state/command. `claims.ts` hanya memparse data masukan; tidak menjalankan kode dari file. `operations.ts` mengimplementasikan transisi murni dan validasi. Provider merupakan batas bagi komponen UI untuk membaca data dan menjalankan command.

`src/mocks/store/operations-store.ts` menyimpan Gudang dan Penjualan pada satu key `zaraff.operations.demo.v1`. Pembuatan pesanan, hasil klaim, dan reservasi stok ditulis sebagai satu snapshot localStorage. Jika storage gagal, seluruh perubahan tetap bersama dalam memori tab. Tab lain membaca perubahan dari storage event. Data Gudang lama dimigrasikan dari `zaraff.warehouse.demo.v1` jika workspace baru belum tersedia; fixture Penjualan menambahkan SKU yang belum ada tanpa menimpa edit Gudang. Untuk reset demo, hapus key baru dan key lama, lalu refresh.

Ini data demo publik di browser, belum database atau transaksi lintas pengguna/perangkat. Saat backend ditambahkan, pindahkan validasi ke server dengan sesi terverifikasi, constraint kode unik, serta transaksi/locking untuk penentuan pemenang dan reservasi. Ganti adapter provider/store dengan API tanpa menaruh fixture di komponen halaman. Beranda masih menggunakan snapshot pelaporan terpisah.

## Pemeriksaan

`npm run check`, `npm test`, dan `npm run build`. Tes memeriksa parser, urutan milidetik, duplikat, pemrosesan ulang, reservasi stok, penggabungan pesanan, diskon, draft wizard, stok yang berubah, edit pelanggan, serta pelestarian data Gudang.
