import "server-only";
import { notFound } from "next/navigation";
import { isRole } from "@/config/roles";
import { canAccessPage } from "@/config/pages";
import { mockUsers } from "@/mocks/data/users";
import { DashboardExperience } from "@/components/layout/dashboard-experience";
import { ReportsProvider } from "./components/reports-provider";
import { ReportsScreen } from "./components/reports-screen";
import { validMonth, type ReportsView } from "./model";
export type ReportsQuery = Promise<{
  role?: string | string[];
  month?: string | string[];
}>;
export async function renderReportsRoute(
  view: ReportsView,
  query: ReportsQuery,
) {
  const {
    role = "owner",
    month = view.page === "R02" ? "2026-10" : "2026-11",
  } = await query;
  if (
    !isRole(role) ||
    !canAccessPage(role, view.page) ||
    typeof month !== "string" ||
    !validMonth(month)
  )
    notFound();
  const user = mockUsers.find((user) => user.role === role)!;
  return (
    <DashboardExperience user={user} activeModule="laporan">
      <ReportsProvider
        key={`${role}:${view.page}:${view.entityId ?? "list"}:${month}`}
        user={user}
        month={month}
      >
        <ReportsScreen view={view} />
      </ReportsProvider>
    </DashboardExperience>
  );
}
