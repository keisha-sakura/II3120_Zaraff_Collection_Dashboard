import { notFound, redirect } from "next/navigation";
import { isRole } from "@/config/roles";
import { canAccessPage } from "@/config/pages";
import { validMonth } from "@/features/laporan/model";
import type { ReportsQuery } from "@/features/laporan/route";
export default async function Page({
  searchParams,
}: {
  searchParams: ReportsQuery;
}) {
  const { role = "owner", month = "2026-11" } = await searchParams;
  if (
    !isRole(role) ||
    !canAccessPage(role, "R01") ||
    typeof month !== "string" ||
    !validMonth(month)
  )
    notFound();
  redirect(`/laporan/ringkasan?role=${role}&month=${month}`);
}
