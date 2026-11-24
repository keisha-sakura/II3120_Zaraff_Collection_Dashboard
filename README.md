# Zaraff Collection Dashboard

Starter full-stack Next.js untuk frontend dan backend Zaraff Collection dalam satu repository dan satu server.

## Prasyarat

- Node.js 22 LTS dan npm.
- Git.

## Menjalankan lokal

```bash
npm ci
```

Salin `.env.example` ke `.env.local` (opsional; nilai default sudah tersedia):

```powershell
Copy-Item .env.example .env.local
```

Untuk macOS/Linux: `cp .env.example .env.local`.

```bash
npm run dev
```

Buka http://localhost:3000 untuk frontend dan http://localhost:3000/api/health untuk cek backend. FE dan BE berjalan di port yang sama; tidak perlu Express atau server backend terpisah.

Jika PowerShell memblokir `npm.ps1`, gunakan `npm.cmd` sebagai pengganti `npm`, misalnya `npm.cmd run dev`. Tidak perlu mengubah execution policy.

## Struktur

```text
src/
  app/
    api/health/route.ts  # Contoh endpoint backend GET /api/health
    globals.css         # Tailwind dan style global
    layout.tsx          # Root layout dan metadata
    page.tsx            # Halaman awal frontend
  server/
    config.ts           # Konfigurasi khusus server
```

- Tambahkan halaman di `src/app/<nama>/page.tsx`.
- Tambahkan endpoint di `src/app/api/<nama>/route.ts`, dengan fungsi HTTP seperti `GET` atau `POST`.
- Simpan akses database, service, dan rahasia di `src/server/`. Gunakan `import "server-only"` agar modul tersebut tidak terimpor ke Client Component.
- Buat `src/components/` untuk komponen bersama dan `src/lib/` untuk utilitas saat dibutuhkan.
- Alias `@/*` mengarah ke `src/*`.
- Komponen App Router adalah Server Component secara default. Tambahkan `"use client"` jika komponen memerlukan state, event handler, atau browser API.
- Client Component dapat memanggil endpoint dengan URL relatif, misalnya `fetch("/api/health")`. Server Component dapat langsung memanggil service di `src/server/`.

## Environment

Daftarkan variabel baru tanpa nilai rahasia di `.env.example`. Simpan nilai lokal di `.env.local`, yang diabaikan Git. Variabel dengan awalan `NEXT_PUBLIC_` terlihat oleh browser; jangan gunakan awalan tersebut untuk secret atau URL database. Restart dev server setelah mengubah environment.

## Perintah

| Perintah           | Fungsi                                     |
| ------------------ | ------------------------------------------ |
| `npm run dev`      | Development server dan hot reload          |
| `npm run check`    | ESLint, TypeScript, dan pemeriksaan format |
| `npm run lint:fix` | Perbaikan otomatis ESLint                  |
| `npm run format`   | Format source dengan Prettier              |
| `npm run build`    | Build production                           |
| `npm start`        | Menjalankan hasil build production         |

GitHub Actions menjalankan pemeriksaan dan build pada push serta pull request. Commit `package-lock.json` supaya instalasi konsisten; gunakan `npm ci` pada clone baru dan CI.

## Status starter

Halaman awal dan health endpoint sudah tersedia. Database, autentikasi, dan fitur bisnis belum dikonfigurasi. Endpoint health hanya memeriksa apakah aplikasi merespons, belum memeriksa koneksi database. Tentukan database dan kebutuhan akses sebelum mengembangkan CRUD.

## Commit dan push pertama

Repository Git sudah tersedia. Setelah memeriksa perubahan, jalankan sendiri:

```bash
git add .
git commit -m "chore: initialize full-stack Next.js project"
git remote -v
git push -u origin main
```

Jika remote `origin` belum tersedia, tambahkan dengan `git remote add origin <URL_REPOSITORY>` sebelum push. Setup ini tidak membuat commit atau melakukan push.

Dokumentasi: [Next.js App Router](https://nextjs.org/docs/app), [Route Handlers](https://nextjs.org/docs/app/api-reference/file-conventions/route).
