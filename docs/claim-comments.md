# Contoh input komentar klaim

Contoh ini memakai kode barang seed **Live Senin Sore**. Untuk live lain, ganti kode pada komentar/CSV dengan kode barang yang terdaftar pada live tersebut; barang tersedia di inventaris belum tentu termasuk dalam live yang sedang dibuka. Daftar kode live ditampilkan pada petunjuk kolom komentar.

Tempel komentar berikut pada kolom **Komentar live**, atau unggah [contoh CSV](claim-comments-example.csv), lalu klik **Proses klaim**. Tidak ada tahap pratinjau atau unggah screenshot.

```text
[19:24:02.100] @mega.preloved
ZR-2609-0008 ukurannya apa, kak?

[19:24:03.480] @dodi_ootd
Aku ambil ZR-2609-0008 ya, kak!

[19:24:03.120] @rina.thrift
Claim ZR-2609-0008!

[19:24:05.000] @dodi_ootd
Aku tadi sudah claim ZR-2609-0008.

[19:25:10.002] @fajarkoleksi
Claim ZR-2609-0009, fix ambil.

[19:25:10.001] @lalaa.style
Aku mau ZR-2609-0009 kalau pembeli pertama batal.

[WAKTU TIDAK TERLIHAT] @sarivintage
Claim ZR-2609-0009.

[19:25:11.000] @thrift.corner
Ongkir ke Bandung berapa?
```

Dengan barang seed yang masih tersedia, pemenang adalah @rina.thrift untuk ZR-2609-0008 dan @fajarkoleksi untuk ZR-2609-0009. Pertanyaan, konfirmasi ulang, klaim bersyarat, dan komentar tanpa timestamp valid tidak menjadi pemenang. Urutan sumber sengaja tidak kronologis; server memakai waktu hingga milidetik, lalu nomor baris sumber jika waktunya sama.

CSV komentar menggunakan header `handle,komentar,waktu`. Kutip komentar yang memuat koma atau baris baru. Input manual satu klaim melalui tombol Tambah manual dan CSV klaim eksplisit `handle,kode,waktu` juga tetap didukung tanpa AI. Komentar bebas memerlukan konfigurasi Gemini; bila pemeriksaan gagal, tidak ada pesanan yang dibuat.
