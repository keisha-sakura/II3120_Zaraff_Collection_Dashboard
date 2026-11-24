# Dummy data

`data/` berisi fixture demo, dipisah per domain. `repositories/` berisi adapter async yang mengimplementasikan kontrak di `features/<modul>/contracts.ts`. Komponen halaman menerima data via props; jangan import fixture langsung di komponen UI atau API production.

Fixture merupakan subset konsisten dari referensi, bukan seed database. Jangan menganggap angka agregat pada semua HTML sama: beberapa artboard memakai snapshot yang berbeda. ID relasi pada fixture harus mengarah ke record yang tersedia. Nominal IDR berupa angka rupiah dan tanggal berformat ISO dengan offset WIB. Tanggal demo tetap November 2026, bukan tanggal sistem.

Untuk integrasi backend, implementasikan kontrak yang sama menggunakan service di `src/server/` atau HTTP adapter, lalu ganti repository pada composition layer. Repository katalog fondasi hanya membaca dan mengembalikan salinan. Modul interaktif Gudang/Penjualan memakai `store/operations-store.ts` untuk snapshot demo bersama di localStorage; lihat `docs/warehouse.md` dan `docs/sales.md` untuk alur transisi dan penggantian dengan API.
