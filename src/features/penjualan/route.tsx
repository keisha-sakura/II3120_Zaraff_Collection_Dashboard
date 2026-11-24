import { requireRecord } from "@/server/page-access";
import "server-only";
import { DashboardExperience } from "@/components/layout/dashboard-experience";
import { SalesProvider } from "./components/sales-provider";
import { SalesScreen } from "./components/sales-screen";
import type { SalesView } from "./model";
export type SalesRoleQuery = Promise<{ role?: string | string[] }>;
export async function renderSalesRoute(view: SalesView, query: SalesRoleQuery) {
  await query;
  const user = await requireRecord(
    view.page,
    "entityId" in view && typeof view.entityId === "string"
      ? view.entityId
      : undefined,
  );
  return (
    <DashboardExperience user={user} activeModule="penjualan">
      <SalesProvider
        key={`${user.id}:${view.page}:${view.entityId ?? "list"}`}
        user={user}
      >
        <SalesScreen view={view} />
      </SalesProvider>
    </DashboardExperience>
  );
}
