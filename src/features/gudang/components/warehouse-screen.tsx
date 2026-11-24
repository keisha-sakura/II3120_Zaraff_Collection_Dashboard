"use client";
import { ModuleTabs } from "@/components/layout/module-tabs";
import { getNavigation } from "@/config/navigation";
import type { WarehouseView } from "../model";
import { useWarehouse } from "./warehouse-provider";
import { BaleListPage } from "../pages/bale-daftar/page-content";
import { ReceiveBalePage } from "../pages/bale-terima/page-content";
import { BaleDetailPage } from "../pages/bale-detail/page-content";
import { SortItemPage } from "../pages/sortir-item/page-content";
import { SortReturnPage } from "../pages/sortir-retur/page-content";
import { LaundryPage } from "../pages/laundry/page-content";
import { GradingPage } from "../pages/grading/page-content";
import { InventoryPage } from "../pages/inventaris/page-content";
import { ItemDetailPage } from "../pages/barang-detail/page-content";
export function WarehouseScreen({ view }: { view: WarehouseView }) {
  const { user } = useWarehouse();
  const tabs = getNavigation(user.role)
    .find((module) => module.id === "gudang")!
    .tabs.map((tab) => ({
      ...tab,
      title: tab.id === "G01" ? "Bale & Sortir" : tab.title,
    }));
  const activeId = ["G07", "G08"].includes(view.page)
    ? "G07"
    : ["G09", "G10"].includes(view.page)
      ? "G09"
      : "G01";
  const id = view.entityId ?? "";
  let page;
  switch (view.page) {
    case "G01":
      page = <BaleListPage />;
      break;
    case "G02":
      page = <ReceiveBalePage />;
      break;
    case "G03":
      page = <BaleDetailPage id={id} />;
      break;
    case "G04":
      page = <SortItemPage id={id} />;
      break;
    case "G05":
      page = <SortReturnPage id={id} />;
      break;
    case "G07":
      page = <LaundryPage />;
      break;
    case "G08":
      page = <GradingPage id={id} />;
      break;
    case "G09":
      page = <InventoryPage />;
      break;
    case "G10":
      page = <ItemDetailPage id={id} />;
      break;
  }
  return (
    <>
      <ModuleTabs items={tabs} activeId={activeId} />
      {page}
    </>
  );
}
