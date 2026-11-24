# Modul Gudang

Halaman mengikuti artboard G01–G10 yang tersedia (nomor G06 tidak ada di ekspor). Komponen tetap menggunakan warna di `globals.css` dan komponen bersama. Route Next.js tipis berada di `src/app/gudang/`, sementara komposisi setiap halaman ada di `src/features/gudang/pages/`.

| ID  | Halaman                         | URL                                  |
| --- | ------------------------------- | ------------------------------------ |
| G01 | Bale dan Sortir                 | `/gudang/bale`                       |
| G02 | Terima bale                     | `/gudang/bale/baru`                  |
| G03 | Detail bale                     | `/gudang/bale/<baleId>`              |
| G04 | Sortir per item                 | `/gudang/bale/<baleId>/sortir`       |
| G05 | Retur ke supplier               | `/gudang/bale/<baleId>/sortir/retur` |
| G07 | Laundry                         | `/gudang/laundry`                    |
| G08 | Grading                         | `/gudang/laundry/<itemId>/grading`   |
| G09 | Inventaris                      | `/gudang/inventaris`                 |
| G10 | Detail barang dan pindah lokasi | `/gudang/inventaris/<itemId>`        |

Tambahkan `?role=owner`, `?role=admin`, atau `?role=penyortir` untuk preview. Sidebar, tab, tautan baris, dan aksi menjaga role yang aktif. Server memeriksa role demo terhadap registry halaman; Live Host, Tim Packing, dan nilai role tidak valid mendapat 404. Ini tetap pratinjau data publik, bukan autentikasi. Kode record yang tidak ditemukan ditangani di dalam halaman karena record baru dapat dibuat di penyimpanan browser.

## Alur yang dapat dicoba

1. Terima bale: isi supplier, jenis, berat, estimasi item, tanggal, dan area penyimpanan bale. Kode BL dibuat tanpa menimpa record sebelumnya.
2. Buka detail bale dan mulai sortir. Bale yang telah selesai tidak dapat dimulai ulang.
3. Simpan item layak ke Laundry dengan kode ZR, atau isi alasan retur dan simpan dengan kode RT. Kondisi Tidak Layak tidak dapat dikirim sebagai stok layak.
4. Selesai sortir menampilkan dialog jumlah stok/retur. Konfirmasi mengubah status bale dan melepas lokasi bale; tidak menghapus item atau retur. Estimasi jumlah item bukan jumlah aktual wajib.
5. Pilih baris Laundry untuk grading. Grade/harga mendapat rekomendasi dummy per kategori. Grade, harga positif, lokasi rak, dan konfirmasi sudah bersih wajib diisi sebelum status menjadi Tersedia.
6. Cari/filter Inventaris lalu pilih baris untuk melihat detail dan riwayat. Pindah lokasi hanya berlaku untuk barang yang memiliki rak dan belum keluar gudang. Status/harga/pesanan tetap dipertahankan; riwayat mencatat lokasi asal, tujuan, waktu, dan pelaku.

Filter daftar bale (status, supplier, periode) dan inventaris (kode, kategori, grade, status) benar-benar menyaring data; jumlah di layar dihitung dari record aktual, tidak menyalin angka 28 dari artboard yang memakai subset berbeda. Default daftar bale menampilkan semua waktu agar bale lama tetap dapat dilihat. Umur stok/laundry pada fixture memakai referensi 24 November 2026 agar snapshot desain konsisten; aktivitas baru memakai waktu saat aksi dilakukan. Area bale belum memiliki aturan kapasitas karena referensi tidak mendefinisikannya.

## Data dan integrasi backend

- `src/mocks/data/warehouse-demo.ts`: fixture interaktif dan aturan rekomendasi harga. Mengembangkan fixture dasar tanpa mengubah contoh repository katalog fondasi. Ada bale arsip tambahan untuk menjaga relasi barang lama.
- `model.ts`: tipe state, input, command, dan view.
- `operations.ts`: transisi murni, validasi bisnis, pembuatan kode WIB, dan pencatatan riwayat. Tidak mengubah snapshot sebelumnya.
- `store.ts`: adapter ke workspace bersama di `src/mocks/store/operations-store.ts`, dengan sinkronisasi antartab dan fallback ke memori.
- `persistence.ts`: pemeriksaan struktur snapshot sebelum dipakai UI. Snapshot rusak/tidak sesuai versi diganti fixture awal.
- `components/warehouse-provider.tsx`: batas akses state/action untuk UI. Komponen halaman tidak menulis localStorage sendiri.
- `route.tsx`: pemilihan user demo dan pembatasan role di server; kelak gunakan sesi terverifikasi.

Key penyimpanan demo sekarang `zaraff.operations.demo.v1`, dipakai bersama Gudang dan Penjualan agar hasil klaim langsung mereservasi stok yang sama. Key lama `zaraff.warehouse.demo.v1` dibaca sebagai sumber migrasi saat workspace baru belum tersedia. SKU yang belum tersedia ditambahkan untuk menghubungkan pesanan contoh, tanpa menimpa perubahan stok sebelumnya. Data tetap tersedia setelah refresh dan berpindah halaman/role pada browser yang sama. Untuk mengulang demo dari awal, hapus kedua key di DevTools lalu refresh. Data bukan DB seed, tidak dibagikan antarperangkat, dan tidak membuat mutasi API server. Beranda masih memakai snapshot pelaporan terpisah, sehingga progres Beranda tidak otomatis berubah setelah mutasi Gudang.

Saat backend siap, ganti pembacaan/command pada provider dengan service/API; pertahankan bentuk input dan aturan transisinya. Server wajib memverifikasi sesi, hak akses, status record, referensi lokasi, dan keunikan kode secara transaksional. Pembatasan role pada query demo tidak boleh dipakai untuk otorisasi data asli.

## Validasi

`npm test` menguji alur lengkap, transisi yang dilarang, keunikan kode, snapshot yang tidak valid, serta relasi fixture. `npm run check` memeriksa lint, tipe, dan format; `npm run build` membangun seluruh route.
