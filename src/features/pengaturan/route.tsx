import { requireRecord } from "@/server/page-access";
import "server-only";
import { DashboardExperience } from "@/components/layout/dashboard-experience";
import { SettingsProvider } from "./components/settings-provider";
import { SettingsScreen } from "./components/settings-screen";
import type { SettingsView } from "./model";
export type SettingsQuery = Promise<{ role?: string | string[] }>;
export async function renderSettingsRoute(
  view: SettingsView,
  query: SettingsQuery,
) {
  await query;
  const user = await requireRecord(
    view.page,
    "entityId" in view && typeof view.entityId === "string"
      ? view.entityId
      : undefined,
  );
  return (
    <DashboardExperience user={user} activeModule="pengaturan">
      <SettingsProvider key={`${user.id}:${view.page}`} user={user}>
        <SettingsScreen view={view} />
      </SettingsProvider>
    </DashboardExperience>
  );
}
