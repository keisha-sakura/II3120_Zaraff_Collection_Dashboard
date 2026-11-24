import { requireRecord } from "@/server/page-access";
import "server-only";
import { DashboardExperience } from "@/components/layout/dashboard-experience";
import { ShippingProvider } from "./components/shipping-provider";
import { ShippingScreen } from "./components/shipping-screen";
import type { ShippingView } from "./model";
export type ShippingRoleQuery = Promise<{ role?: string | string[] }>;
export async function renderShippingRoute(
  view: ShippingView,
  query: ShippingRoleQuery,
) {
  await query;
  const user = await requireRecord(
    view.page,
    "entityId" in view && typeof view.entityId === "string"
      ? view.entityId
      : undefined,
  );
  return (
    <DashboardExperience user={user} activeModule="pengiriman">
      <ShippingProvider
        key={`${user.id}:${view.page}:${view.entityId ?? "list"}`}
        user={user}
      >
        <ShippingScreen view={view} />
      </ShippingProvider>
    </DashboardExperience>
  );
}
