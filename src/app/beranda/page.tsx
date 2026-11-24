import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";
import { HomeContent } from "@/features/beranda/components/home-content";
import { DashboardExperience } from "@/components/layout/dashboard-experience";
import { requireUser } from "@/server/auth";
import { homeDashboard } from "@/server/home";
export const metadata: Metadata = { title: "Beranda" };
export default async function HomePage() {
  const user = await requireUser();
  const now = new Date();
  const hour = Number(
    new Intl.DateTimeFormat("en-GB", {
      hour: "numeric",
      hourCycle: "h23",
      timeZone: "Asia/Jakarta",
    }).format(now),
  );
  const greeting =
    hour < 11 ? "pagi" : hour < 15 ? "siang" : hour < 18 ? "sore" : "malam";
  return (
    <DashboardExperience user={user} activeModule="beranda">
      <PageHeader title={`Selamat ${greeting}, ${user.name}`} />
      <HomeContent data={homeDashboard(user, now.toISOString())} />
    </DashboardExperience>
  );
}
