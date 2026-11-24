import { requireRecord } from "@/server/page-access";
import "server-only";
import { DashboardExperience } from "@/components/layout/dashboard-experience";
import { PaymentsProvider } from "./components/payments-provider";
import { PaymentsScreen } from "./components/payments-screen";
import type { PaymentsView } from "./model";
export type PaymentsRoleQuery = Promise<{ role?: string | string[] }>;
export async function renderPaymentsRoute(
  view: PaymentsView,
  query: PaymentsRoleQuery,
) {
  await query;
  const user = await requireRecord(
    view.page,
    "entityId" in view && typeof view.entityId === "string"
      ? view.entityId
      : undefined,
  );
  return (
    <DashboardExperience user={user} activeModule="pembayaran">
      <PaymentsProvider
        key={`${user.id}:${view.page}:${view.entityId ?? "list"}`}
        user={user}
      >
        <PaymentsScreen view={view} />
      </PaymentsProvider>
    </DashboardExperience>
  );
}
