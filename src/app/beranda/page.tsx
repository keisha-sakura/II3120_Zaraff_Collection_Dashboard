import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isRole } from "@/config/roles";
import { PageHeader } from "@/components/layout/page-header";
import { HomeContent } from "@/features/beranda/components/home-content";
import { DashboardExperience } from "@/components/layout/dashboard-experience";
import { mockHomeRepository } from "@/mocks/repositories/home";

export const metadata: Metadata = { title: "Beranda" };

// Role query selects public demo data only; replace with a verified server session.
export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ role?: string | string[] }>;
}) {
  const { role = "owner" } = await searchParams;
  if (!isRole(role)) notFound();
  const { user, data } = await mockHomeRepository.getDashboard(role);
  return (
    <DashboardExperience user={user} activeModule="beranda">
      <PageHeader title={`Selamat pagi, ${user.name}`} />
      <HomeContent data={data} />
    </DashboardExperience>
  );
}
