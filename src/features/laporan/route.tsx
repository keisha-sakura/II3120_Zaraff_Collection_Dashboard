import { requireRecord } from "@/server/page-access";
import "server-only";
import { notFound } from "next/navigation";
import { DashboardExperience } from "@/components/layout/dashboard-experience";
import { ReportsProvider } from "./components/reports-provider";
import { ReportsScreen } from "./components/reports-screen";
import { validMonth, type ReportsView } from "./model";
import { monthOf } from "./selectors";
export type ReportsQuery = Promise<{
  role?: string | string[];
  month?: string | string[];
}>;
export async function renderReportsRoute(
  view: ReportsView,
  query: ReportsQuery,
) {
  const { month = monthOf(new Date().toISOString()) } = await query;
  if (typeof month !== "string" || !validMonth(month)) notFound();
  const user = await requireRecord(
    view.page,
    "entityId" in view && typeof view.entityId === "string"
      ? view.entityId
      : undefined,
  );
  return (
    <DashboardExperience user={user} activeModule="laporan">
      <ReportsProvider
        key={`${user.id}:${view.page}:${view.entityId ?? "list"}:${month}`}
        user={user}
        month={month}
      >
        <ReportsScreen view={view} />
      </ReportsProvider>
    </DashboardExperience>
  );
}
