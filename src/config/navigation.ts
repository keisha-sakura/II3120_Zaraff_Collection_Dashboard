import {
  canAccessPage,
  getPage,
  getPagesForRole,
  type ModuleId,
  type PageId,
} from "./pages.ts";
import type { Role } from "./roles";

const modules: { id: ModuleId; label: string; tabs: readonly PageId[] }[] = [
  {
    id: "beranda",
    label: "Beranda",
    tabs: ["B01", "B02", "B03", "B04", "B05"],
  },
  { id: "gudang", label: "Gudang", tabs: ["G01", "G07", "G09"] },
  { id: "penjualan", label: "Penjualan", tabs: ["P01", "P07", "P09"] },
  { id: "pembayaran", label: "Pembayaran", tabs: ["Y01", "Y05"] },
  { id: "pengiriman", label: "Pengiriman", tabs: ["D01", "D03", "D06"] },
  {
    id: "laporan",
    label: "Laporan",
    tabs: ["R01", "R02", "R03", "R04", "R05"],
  },
  { id: "pengaturan", label: "Pengaturan", tabs: ["S01", "S02", "S03"] },
];
export function getNavigation(role: Role) {
  return modules.flatMap((module) => {
    const tabs = module.tabs
      .filter((id) => canAccessPage(role, id))
      .map(getPage);
    return tabs.length ? [{ ...module, href: tabs[0].path, tabs }] : [];
  });
}
/** Detail templates remain discoverable, but need actual entity IDs to navigate. */
export function getSearchPages(role: Role, query: string) {
  const term = query.trim().toLocaleLowerCase("id-ID");
  return getPagesForRole(role).filter((page) =>
    page.title.toLocaleLowerCase("id-ID").includes(term),
  );
}
