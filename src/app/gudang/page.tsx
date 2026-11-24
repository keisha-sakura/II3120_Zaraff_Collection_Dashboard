import { redirect, notFound } from "next/navigation";
import { isRole } from "@/config/roles";
import { canAccessPage } from "@/config/pages";
import type { DemoRoleQuery } from "@/features/gudang/route";
export default async function Page({
  searchParams,
}: {
  searchParams: DemoRoleQuery;
}) {
  const { role = "owner" } = await searchParams;
  if (!isRole(role) || !canAccessPage(role, "G01")) notFound();
  redirect(`/gudang/bale?role=${role}`);
}
