# Fixture seed dan test

`data/` berisi fixture per domain yang dipakai `src/server/seed.ts` untuk mengisi tabel relasional serta unit test operasi. Data awal mencakup beberapa periode dan status; bukan penyimpanan runtime.

Beranda memakai agregat database di `src/server/home.ts`. Provider interaktif memakai `src/lib/workspace-store.tsx` untuk cache API di memori; seluruh mutasi diteruskan ke transaksi server. Repository mock Beranda dan store localStorage lama sudah dihapus. Data localStorage demo lama tidak otomatis diimpor karena tidak mempunyai identitas/otorisasi yang dapat dipercaya.

Lihat [README](../../README.md) untuk akun, setup/seed dan reset eksplisit; [backend](../../docs/backend.md) untuk schema dan aturan bisnis.
