# Pengiriman

Implementasi mengikuti D01–D04 dan D06 pada referensi HTML. D05 tidak disertakan dalam ekspor. Route tipis berada di `src/app/pengiriman/`, komposisi per halaman di `src/features/pengiriman/pages/`, dan fixture metadata packing di `src/mocks/data/shipping-demo.ts`. Warna memakai token `globals.css`; tabel, kartu, checkbox, badge lokasi, field, dan shell memakai komponen bersama.

## Halaman dan role

| ID  | Route                                     | Owner/Admin | Tim Packing |
| --- | ----------------------------------------- | ----------- | ----------- |
| D01 | `/pengiriman/packing`                     | Ya          | Ya          |
| D02 | `/pengiriman/packing/[orderId]`           | Ya          | Ya          |
| D03 | `/pengiriman/siap-dikirim`                | Ya          | Tidak       |
| D04 | `/pengiriman/siap-dikirim/[orderId]/resi` | Ya          | Tidak       |
| D06 | `/pengiriman/dalam-pengiriman`            | Ya          | Tidak       |

Penyortir dan Live Host tidak memiliki akses. Role dipilih melalui query demo, misalnya `?role=packing`. Route menolak role tidak valid, berulang, atau di luar akses dengan 404. Ini belum menggantikan autentikasi server.

## Alur

1. Pembayaran disetujui: pesanan Lunas masuk antrean packing. Barang tetap Terjual dengan lokasi raknya.
2. Packing mencentang setiap barang yang diambil, kecocokan kode fisik, kondisi sesuai grade, dan konfirmasi kemas. Checklist tersimpan setiap perubahan dan bertahan setelah refresh.
3. Tombol **Tandai dikemas** aktif setelah seluruh checklist lengkap. Pesanan menjadi Dikemas; waktu dan nama petugas dicatat. Barang tetap berada pada rak sampai diserahkan ke kurir.
4. Owner/Admin memilih pesanan pada Siap dikirim, mengisi kurir dan nomor resi, lalu mengonfirmasi paket sudah diserahkan. Resi divalidasi 5–64 karakter huruf/angka/tanda hubung, dinormalisasi menjadi kapital, dan tidak boleh sama dengan resi pesanan lain pada kurir yang sama.
5. **Simpan resi** mengubah pesanan menjadi Dikirim, menambahkan timeline penyerahan, mengubah barang menjadi Keluar Gudang, dan melepas lokasi rak dalam satu snapshot. Tanggal Terjual, saldo, invoice, dan riwayat pembayaran dipertahankan. Pesanan tampil pada Dalam pengiriman; klik baris membuka detail pesanan dan timeline.

Operasi mengecek ulang status pembayaran, pesanan, kepemilikan barang, serta lokasi/status stok sebelum mutasi. Checklist dan resi yang sudah selesai tidak dapat diproses ulang. Akses packing dan input resi juga diperiksa dalam operasi demo.

## Penyimpanan dan integrasi

`src/mocks/store/operations-store.ts` menyimpan Gudang, Penjualan, Pembayaran, dan metadata Pengiriman pada `zaraff.operations.demo.v1`. Data lama yang belum memiliki bagian `shipping` memperoleh metadata untuk pesanan yang sudah Dikemas/Dikirim tanpa mengganti saldo, status, lokasi stok, atau resi. Perubahan lintas tab disinkronkan melalui storage event; jika penyimpanan browser tidak tersedia, perubahan bertahan dalam memori sampai reload.

Demo baru menyediakan Dodi untuk packing, Lala untuk input resi, dan Mega sebagai contoh dalam perjalanan. Pesanan Fajar masuk antrean setelah deposit disetujui; pada data lama Fajar dapat sudah Lunas.

Pengiriman masih simulasi lokal. Tidak ada panggilan API kurir, pembelian label, pencetakan label, atau pembaruan pelacakan otomatis. Saat backend tersedia, pindahkan operasi pada `operations.ts` ke service server dengan pemeriksaan sesi dan transaksi stok/pesanan. Gunakan respons API untuk mengisi provider dan simpan actor/waktu dari server.

## Verifikasi

`npm run check`, `npm test`, dan `npm run build`. Test Pengiriman mencakup kelengkapan checklist, batas role, pesanan belum lunas, stok berubah, resi duplikat, penyerahan ke kurir, pelepasan rak, dan rekonstruksi metadata lama.
