import "server-only";
import { notFound } from "next/navigation";
import { isRole } from "@/config/roles";
import { canAccessPage } from "@/config/pages";
import { mockUsers } from "@/mocks/data/users";
import { DashboardExperience } from "@/components/layout/dashboard-experience";
import { WarehouseProvider } from "./components/warehouse-provider";
import { WarehouseScreen } from "./components/warehouse-screen";
import type { WarehouseView } from "./model";
export type DemoRoleQuery = Promise<{ role?: string | string[] }>;
/** Public demo role gate. Replace query selection with verified session access. */
export async function renderWarehouseRoute(
  view: WarehouseView,
  query: DemoRoleQuery,
) {
  const { role = "owner" } = await query;
  if (!isRole(role) || !canAccessPage(role, view.page)) notFound();
  const user = mockUsers.find((user) => user.role === role)!;
  return (
    <DashboardExperience user={user} activeModule="gudang">
      <WarehouseProvider
        key={`${role}:${view.page}:${view.entityId ?? "list"}`}
        user={user}
      >
        <WarehouseScreen view={view} />
      </WarehouseProvider>
    </DashboardExperience>
  );
}
