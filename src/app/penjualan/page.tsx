import { redirect, notFound } from "next/navigation";
import { isRole } from "@/config/roles";
import { canAccessPage } from "@/config/pages";
import type { SalesRoleQuery } from "@/features/penjualan/route";
export default async function Page({
  searchParams,
}: {
  searchParams: SalesRoleQuery;
}) {
  const { role = "owner" } = await searchParams;
  if (!isRole(role) || !canAccessPage(role, "P01")) notFound();
  redirect(`/penjualan/live?role=${role}`);
}
