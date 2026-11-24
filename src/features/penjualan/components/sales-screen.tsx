"use client";
import { ModuleTabs } from "@/components/layout/module-tabs";
import { getNavigation } from "@/config/navigation";
import type { SalesView } from "../model";
import { useSales } from "./sales-provider";
import { LiveSchedulePage } from "../pages/live-jadwal/page-content";
import { LiveContentPage } from "../pages/live-konten/page-content";
import { LiveItemsPage } from "../pages/live-barang/page-content";
import { LivePublishPage } from "../pages/live-publikasi/page-content";
import { ImportClaimsPage } from "../pages/live-impor-klaim/page-content";
import { ClaimResultsPage } from "../pages/live-hasil-klaim/page-content";
import { OrdersPage } from "../pages/pesanan-daftar/page-content";
import { OrderDetailPage } from "../pages/pesanan-detail/page-content";
import { CustomersPage } from "../pages/pelanggan-daftar/page-content";
import { CustomerDetailPage } from "../pages/pelanggan-detail/page-content";
export function SalesScreen({ view }: { view: SalesView }) {
  const { user } = useSales();
  const tabs = getNavigation(user.role)
    .find((module) => module.id === "penjualan")!
    .tabs.map((page) => ({
      ...page,
      title:
        page.id === "P01"
          ? user.role === "live-host"
            ? "Jadwal Live"
            : "Jadwal Live & Promosi"
          : page.id === "P09"
            ? "Pelanggan"
            : page.title,
    }));
  const activeId = ["P07", "P08"].includes(view.page)
    ? "P07"
    : ["P09", "P10"].includes(view.page)
      ? "P09"
      : "P01";
  const id = view.entityId ?? "";
  let content;
  switch (view.page) {
    case "P01":
      content = <LiveSchedulePage />;
      break;
    case "P02":
      content = <LiveContentPage />;
      break;
    case "P03":
      content = <LiveItemsPage />;
      break;
    case "P04":
      content = <LivePublishPage />;
      break;
    case "P05":
      content = <ImportClaimsPage id={id} />;
      break;
    case "P06":
      content = <ClaimResultsPage id={id} />;
      break;
    case "P07":
      content = <OrdersPage />;
      break;
    case "P08":
      content = <OrderDetailPage id={id} />;
      break;
    case "P09":
      content = <CustomersPage />;
      break;
    case "P10":
      content = <CustomerDetailPage id={id} />;
      break;
  }
  return (
    <>
      <ModuleTabs items={tabs} activeId={activeId} />
      {content}
    </>
  );
}
