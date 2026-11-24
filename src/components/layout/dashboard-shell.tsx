"use client";
import type { ReactNode } from "react";
import { canAccessPage, type ModuleId } from "@/config/pages";
import type { User } from "@/types/domain";
import { DashboardLink } from "./dashboard-link";
import { ProfileMenu } from "./profile-menu";
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
          <button
            type="button"
            aria-label="Pencarian cepat"
            className="border-border-control bg-sidebar text-muted rounded-control flex min-w-0 flex-1 items-center gap-2 border px-3 py-2 text-left sm:max-w-105"
            onClick={onSearch}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              aria-hidden="true"
              className="shrink-0"
            >
              <circle cx="11" cy="11" r="6.5" />
              <path d="m20 20-4-4" />
            </svg>
            <span className="flex-1 truncate text-sm">
              Cari menu, kode barang, atau pesanan
            </span>
            <kbd className="border-border-control bg-surface hidden shrink-0 rounded border px-1.5 text-xs whitespace-nowrap sm:inline-flex">
              Ctrl K
            </kbd>
          </button>
          <div className="hidden sm:block sm:flex-1" />
          {canAccessPage(user.role, "S05") && (
            <DashboardLink
              href="/notifikasi"
              aria-label="Notifikasi"
              className="text-muted hover:bg-sidebar rounded-lg p-2"
            >
              <ModuleIcon module="notifikasi" />
            </DashboardLink>
          )}
          <ProfileMenu user={user} onLogout={onLogout} />
        </header>
        <main className="w-full max-w-(--content-width) p-5 lg:px-8 lg:py-6">
          {children}
        </main>
      </div>
    </div>
  );
}
