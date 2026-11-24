"use client";
import Link from "next/link";
import type { ReactNode } from "react";
import { canAccessPage, type ModuleId } from "@/config/pages";
import { roleLabels } from "@/config/roles";
import type { User } from "@/types/domain";
import { Button } from "@/components/ui/button";
import { Sidebar } from "./sidebar";
import { ModuleIcon } from "./module-icon";

/** Session user must come from the server when authentication is added. */
export function DashboardShell({
  user,
  activeModule,
  onSearch,
  onLogout,
  children,
}: {
  user: User;
  activeModule: ModuleId;
  onSearch: () => void;
  onLogout: () => void;
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen lg:flex">
      <Sidebar role={user.role} activeModule={activeModule} />
      <div className="min-w-0 flex-1">
        <div className="brand-gradient h-1" />
        <header className="border-border bg-surface flex flex-wrap items-center gap-4 border-b px-5 py-3 lg:px-8">
          <Button
            variant="secondary"
            className="bg-sidebar text-muted min-w-0 flex-1 justify-between sm:max-w-105"
            onClick={onSearch}
          >
            <span className="truncate">
              Cari menu, kode barang, atau pesanan
            </span>
            <kbd className="border-border-control bg-surface rounded border px-1.5 text-xs">
              Ctrl K
            </kbd>
          </Button>
          <div className="flex-1" />
          {canAccessPage(user.role, "S05") && (
            <Link
              href="/notifikasi"
              aria-label="Notifikasi"
              className="text-muted hover:bg-sidebar rounded-lg p-2"
            >
              <ModuleIcon module="notifikasi" />
            </Link>
          )}
          <details className="relative">
            <summary className="flex cursor-pointer list-none items-center gap-2.5 rounded-lg p-1">
              <span className="bg-highlight text-primary grid size-9 place-items-center rounded-full font-bold">
                {user.name.slice(0, 1)}
              </span>
              <span>
                <span className="block text-sm font-bold">{user.name}</span>
                <span className="text-muted block text-xs">
                  {roleLabels[user.role]}
                </span>
              </span>
            </summary>
            <div className="rounded-card border-border bg-surface absolute right-0 z-20 mt-2 min-w-60 border p-4">
              <p className="font-semibold">{user.name}</p>
              <p className="text-muted mb-3 text-xs">{user.email}</p>
              <Button variant="text" onClick={onLogout}>
                Keluar
              </Button>
            </div>
          </details>
        </header>
        <main className="w-full max-w-(--content-width) p-5 lg:px-8 lg:py-6">
          {children}
        </main>
      </div>
    </div>
  );
}
