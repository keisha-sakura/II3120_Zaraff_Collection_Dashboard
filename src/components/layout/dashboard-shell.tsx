"use client";
import type { ReactNode } from "react";
import type { ModuleId } from "@/config/pages";
import type { User } from "@/types/domain";
import { ProfileMenu } from "./profile-menu";
import { Sidebar } from "./sidebar";
import { GlobalSearch } from "./global-search";

/** Session user must come from the server when authentication is added. */
export function DashboardShell({
  user,
  activeModule,
  onLogout,
  children,
}: {
  user: User;
  activeModule: ModuleId;
  onLogout: () => void;
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen lg:flex">
      <Sidebar role={user.role} activeModule={activeModule} />
      <div className="min-w-0 flex-1">
        <div className="brand-gradient h-1" />
        <header className="border-border bg-surface flex flex-wrap items-start gap-4 border-b px-5 py-3 lg:px-8">
          <GlobalSearch key={user.role} role={user.role} />
          <div className="hidden sm:block sm:flex-1" />
          <ProfileMenu user={user} onLogout={onLogout} />
        </header>
        <main className="w-full max-w-(--content-width) p-5 lg:px-8 lg:py-6">
          {children}
        </main>
      </div>
    </div>
  );
}
