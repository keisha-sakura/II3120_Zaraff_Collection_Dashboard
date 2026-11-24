"use client";
import { useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { DashboardShell } from "./dashboard-shell";
import { DashboardNavigationProvider } from "./dashboard-link";
import { Dialog } from "@/components/ui/dialog";
import { canAccessPath, getPagesForRole, type ModuleId } from "@/config/pages";
import type { User } from "@/types/domain";
import { WorkspaceGate, clearWorkspace } from "@/lib/workspace-store";

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
  const [notice, setNotice] = useState<{
    title: string;
    description: string;
  } | null>(null);
  function resolveHref(href: string) {
    const url = new URL(href, "http://preview.local");
    url.searchParams.delete("role");
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
      path.startsWith("/laporan/") ||
      path.startsWith("/pengaturan/")
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
        onLogout={async () => {
          const response = await fetch("/api/auth/logout", {
            method: "POST",
            headers: { "X-Zaraff-Request": "1" },
          });
          if (response.ok) {
            clearWorkspace();
            router.replace("/masuk");
            router.refresh();
          } else
            setNotice({
              title: "Keluar belum berhasil",
              description: "Coba kembali untuk mengakhiri sesi.",
            });
        }}
      >
        <WorkspaceGate>{children}</WorkspaceGate>
      </DashboardShell>
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
