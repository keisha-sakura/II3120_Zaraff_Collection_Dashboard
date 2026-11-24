import { notFound, redirect } from "next/navigation";
import { isRole } from "@/config/roles";
import { canAccessPage } from "@/config/pages";
import type { SettingsQuery } from "@/features/pengaturan/route";
export default async function Page({
  searchParams,
}: {
  searchParams: SettingsQuery;
}) {
  const { role = "owner" } = await searchParams;
  if (!isRole(role) || !canAccessPage(role, "S01")) notFound();
  redirect(`/pengaturan/harga?role=${role}`);
}
