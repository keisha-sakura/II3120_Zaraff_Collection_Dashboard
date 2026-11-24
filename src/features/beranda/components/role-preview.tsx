import Link from "next/link";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/layout/page-header";
import { roleLabels } from "@/config/roles";
import type { User } from "@/types/domain";
export function RolePreview({ users }: { users: readonly User[] }) {
  return (
    <main className="mx-auto max-w-4xl px-6 py-16">
      <div className="brand-gradient mb-8 h-1 rounded-full" />
      <PageHeader
        title="Pratinjau Beranda"
        description="Pilih role untuk melihat contoh Beranda. Pratinjau memakai data dummy dan belum menggunakan login."
      />
      <div className="grid gap-4 sm:grid-cols-2">
        {users.map((user) => (
          <Link
            key={user.id}
            href={`/beranda?role=${user.role}`}
            className="rounded-card block"
          >
            <Card className="hover:border-border-secondary flex items-center gap-4 transition-colors">
              <span className="bg-highlight text-primary grid size-11 place-items-center rounded-full text-lg font-bold">
                {user.name[0]}
              </span>
              <span>
                <span className="block font-bold">{roleLabels[user.role]}</span>
                <span className="text-muted block text-sm">{user.name}</span>
              </span>
            </Card>
          </Link>
        ))}
      </div>
      <Link
        href="/fondasi"
        className="text-primary mt-6 inline-block text-sm font-semibold hover:underline"
      >
        Lihat katalog komponen
      </Link>
    </main>
  );
}
