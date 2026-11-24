"use client";
import { ModuleTabs } from "@/components/layout/module-tabs";
import { getNavigation } from "@/config/navigation";
import type { ReportsView } from "../model";
import { useReports } from "./reports-provider";
import { BusinessSummaryPage } from "../pages/ringkasan-bisnis/page-content";
import { MonthlyReportPage } from "../pages/laporan-bulanan/page-content";
import { StockAgePage } from "../pages/gudang-umur-stok/page-content";
import { SoldOutboundPage } from "../pages/terjual-keluar/page-content";
import { StrategiesPage } from "../pages/strategi-daftar/page-content";
import { WriteStrategyPage } from "../pages/strategi-tulis/page-content";
import { SendStrategyPage } from "../pages/strategi-kirim/page-content";
export function ReportsScreen({ view }: { view: ReportsView }) {
  const { user } = useReports();
  const tabs = getNavigation(user.role).find(
    (module) => module.id === "laporan",
  )!.tabs;
  const activeId =
    view.page === "R06" || view.page === "R07" ? "R05" : view.page;
  let content;
  switch (view.page) {
    case "R01":
      content = <BusinessSummaryPage />;
      break;
    case "R02":
      content = <MonthlyReportPage />;
      break;
    case "R03":
      content = <StockAgePage />;
      break;
    case "R04":
      content = <SoldOutboundPage />;
      break;
    case "R05":
      content = <StrategiesPage />;
      break;
    case "R06":
      content = <WriteStrategyPage />;
      break;
    case "R07":
      content = <SendStrategyPage id={view.entityId ?? ""} />;
      break;
  }
  return (
    <>
      <ModuleTabs items={tabs} activeId={activeId} />
      {content}
    </>
  );
}
