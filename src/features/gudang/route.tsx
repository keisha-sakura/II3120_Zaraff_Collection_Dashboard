import { requireRecord } from "@/server/page-access";
import "server-only";
import { DashboardExperience } from "@/components/layout/dashboard-experience";
import { WarehouseProvider } from "./components/warehouse-provider";
import { WarehouseScreen } from "./components/warehouse-screen";
import type { WarehouseView } from "./model";
export type DemoRoleQuery = Promise<{ role?: string | string[] }>;
/** Session, page permission and record access are checked before rendering. */
export async function renderWarehouseRoute(
  view: WarehouseView,
  query: DemoRoleQuery,
) {
  await query;
  const user = await requireRecord(
    view.page,
    "entityId" in view && typeof view.entityId === "string"
      ? view.entityId
      : undefined,
  );
  return (
    <DashboardExperience user={user} activeModule="gudang">
      <WarehouseProvider
        key={`${user.id}:${view.page}:${view.entityId ?? "list"}`}
        user={user}
      >
        <WarehouseScreen view={view} />
      </WarehouseProvider>
    </DashboardExperience>
  );
}
