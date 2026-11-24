"use client";
import { useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { DashboardShell } from "./dashboard-shell";
import { DashboardNavigationProvider } from "./dashboard-link";
import { QuickSearch } from "./quick-search";
import { Dialog } from "@/components/ui/dialog";
import { canAccessPath, getPagesForRole, type ModuleId } from "@/config/pages";
import type { User } from "@/types/domain";

export function DashboardExperience({
  user,
  activeModule,
  children,
}: {
  user: User;
  activeModule: ModuleId;
  children: ReactNode;
}) {
  const router = useRouter();
  const [searchOpen, setSearchOpen] = useState(false);
  const [notice, setNotice] = useState<{
    title: string;
    description: string;
  } | null>(null);
  function resolveHref(href: string) {
    const url = new URL(href, "http://preview.local");
    url.searchParams.set("role", user.role);
    return `${url.pathname}${url.search}${url.hash}`;
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
    if (path.includes("[")) {
      setNotice({
        title: "Pilih data terlebih dahulu",
        description:
          "Buka daftar pada modul terkait, lalu pilih data untuk melihat detailnya.",
      });
      return;
    }
    if (
      path === "/beranda" ||
      path.startsWith("/gudang/") ||
      path.startsWith("/penjualan/") ||
      path.startsWith("/pembayaran/") ||
      path.startsWith("/pengiriman/") ||
      path.startsWith("/laporan/")
    ) {
      router.push(resolveHref(href));
      return;
    }
    const page = getPagesForRole(user.role).find((page) => page.path === path);
    setNotice({
      title: page?.title ?? "Halaman berikutnya",
      description:
        "Halaman ini belum tersedia dalam pratinjau. Modul lainnya akan dibangun pada tahap berikutnya.",
    });
  }
  return (
    <DashboardNavigationProvider value={{ resolveHref, navigate }}>
      <DashboardShell
        user={user}
        activeModule={activeModule}
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
