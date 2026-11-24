import "server-only";
import { notFound } from "next/navigation";
import { isRole } from "@/config/roles";
import { canAccessPage } from "@/config/pages";
import { mockUsers } from "@/mocks/data/users";
import { DashboardExperience } from "@/components/layout/dashboard-experience";
import { SettingsProvider } from "./components/settings-provider";
import { SettingsScreen } from "./components/settings-screen";
import type { SettingsView } from "./model";
export type SettingsQuery = Promise<{ role?: string | string[] }>;
export async function renderSettingsRoute(
  view: SettingsView,
  query: SettingsQuery,
) {
  const { role = "owner" } = await query;
  if (!isRole(role) || !canAccessPage(role, view.page)) notFound();
  const user = mockUsers.find((user) => user.role === role)!;
  return (
    <DashboardExperience user={user} activeModule="pengaturan">
      <SettingsProvider key={`${role}:${view.page}`} user={user}>
        <SettingsScreen view={view} />
      </SettingsProvider>
    </DashboardExperience>
  );
}
