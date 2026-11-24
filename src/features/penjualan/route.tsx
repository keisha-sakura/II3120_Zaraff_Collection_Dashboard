import "server-only";
import { notFound } from "next/navigation";
import { isRole } from "@/config/roles";
import { canAccessPage } from "@/config/pages";
import { mockUsers } from "@/mocks/data/users";
import { DashboardExperience } from "@/components/layout/dashboard-experience";
import { SalesProvider } from "./components/sales-provider";
import { SalesScreen } from "./components/sales-screen";
import type { SalesView } from "./model";
export type SalesRoleQuery = Promise<{ role?: string | string[] }>;
export async function renderSalesRoute(view: SalesView, query: SalesRoleQuery) {
  const { role = "owner" } = await query;
  if (!isRole(role) || !canAccessPage(role, view.page)) notFound();
  const user = mockUsers.find((user) => user.role === role)!;
  return (
    <DashboardExperience user={user} activeModule="penjualan">
      <SalesProvider
        key={`${role}:${view.page}:${view.entityId ?? "list"}`}
        user={user}
      >
        <SalesScreen view={view} />
      </SalesProvider>
    </DashboardExperience>
  );
}
