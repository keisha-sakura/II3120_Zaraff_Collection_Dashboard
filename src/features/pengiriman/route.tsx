import "server-only";
import { notFound } from "next/navigation";
import { isRole } from "@/config/roles";
import { canAccessPage } from "@/config/pages";
import { mockUsers } from "@/mocks/data/users";
import { DashboardExperience } from "@/components/layout/dashboard-experience";
import { ShippingProvider } from "./components/shipping-provider";
import { ShippingScreen } from "./components/shipping-screen";
import type { ShippingView } from "./model";
export type ShippingRoleQuery = Promise<{ role?: string | string[] }>;
export async function renderShippingRoute(
  view: ShippingView,
  query: ShippingRoleQuery,
) {
  const { role = "owner" } = await query;
  if (!isRole(role) || !canAccessPage(role, view.page)) notFound();
  const user = mockUsers.find((user) => user.role === role)!;
  return (
    <DashboardExperience user={user} activeModule="pengiriman">
      <ShippingProvider
        key={`${role}:${view.page}:${view.entityId ?? "list"}`}
        user={user}
      >
        <ShippingScreen view={view} />
      </ShippingProvider>
    </DashboardExperience>
  );
}
