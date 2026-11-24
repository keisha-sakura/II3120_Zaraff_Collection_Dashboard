"use client";
import { useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { DashboardNavigationProvider } from "@/components/layout/dashboard-link";
import { QuickSearch } from "@/components/layout/quick-search";
import { Dialog } from "@/components/ui/dialog";
import { canAccessPath, getPagesForRole } from "@/config/pages";
import type { User } from "@/types/domain";

export function HomeExperience({
  user,
  children,
}: {
  user: User;
  children: ReactNode;
}) {
  const router = useRouter();
  const [searchOpen, setSearchOpen] = useState(false);
  const [notice, setNotice] = useState<{
    title: string;
    description: string;
  } | null>(null);
  function resolveHref(href: string) {
    const [path] = href.split("?");
    return path === "/beranda" ? `/beranda?role=${user.role}` : href;
  }
  function navigate(href: string) {
    const [path] = href.split("?");
    if (!canAccessPath(user.role, path)) {
      setNotice({
        title: "Akses terbatas",
        description: "Halaman ini tidak tersedia untuk peranmu.",
      });
      return;
    }
    if (path === "/beranda") {
      router.push(resolveHref(href));
      return;
    }
    const page = getPagesForRole(user.role).find((page) => page.path === path);
    setNotice({
      title: page?.title ?? "Halaman berikutnya",
      description:
        "Halaman ini belum tersedia dalam pratinjau. Saat ini kamu bisa meninjau Beranda; modul lainnya akan dibangun pada tahap berikutnya.",
    });
  }
  return (
    <DashboardNavigationProvider value={{ resolveHref, navigate }}>
      <DashboardShell
        user={user}
        activeModule="beranda"
        onSearch={() => setSearchOpen(true)}
        onLogout={() => router.replace("/pratinjau")}
      >
        {children}
      </DashboardShell>
      <QuickSearch
        role={user.role}
        open={searchOpen}
        onOpenChange={setSearchOpen}
        onSelect={(page) => {
          setSearchOpen(false);
          navigate(page.path);
        }}
      />
      <Dialog
        open={notice !== null}
        onClose={() => setNotice(null)}
        title={notice?.title ?? "Informasi"}
      >
        <p className="text-muted text-sm leading-6">{notice?.description}</p>
      </Dialog>
    </DashboardNavigationProvider>
  );
}
