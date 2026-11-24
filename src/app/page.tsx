import Link from "next/link";

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col justify-center gap-8 px-6 py-16">
      <div>
        <p className="mb-4 text-sm font-semibold tracking-widest text-emerald-700 uppercase">
          Zaraff Collection
        </p>
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
          Dashboard siap dikembangkan.
        </h1>
        <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-600">
          Fondasi frontend dan backend dalam satu project Next.js. Mulai bangun
          pengelolaan koleksi, stok, dan penjualan Zaraff di sini.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          ["Frontend", "App Router, React, dan Tailwind CSS."],
          ["Backend", "Route Handler API dalam project yang sama."],
          ["Developer tools", "TypeScript, ESLint, dan Prettier."],
        ].map(([title, description]) => (
          <section
            key={title}
            className="rounded-2xl border border-slate-200 bg-white p-6"
          >
            <h2 className="font-semibold">{title}</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              {description}
            </p>
          </section>
        ))}
      </div>
      <div>
        <Link
          href="/api/health"
          className="inline-flex rounded-lg bg-emerald-700 px-5 py-3 font-semibold text-white transition hover:bg-emerald-800 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-emerald-700"
        >
          Cek status API
        </Link>
      </div>
    </main>
  );
}
