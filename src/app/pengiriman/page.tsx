import { redirect, notFound } from "next/navigation";
import { isRole } from "@/config/roles";
import { canAccessPage } from "@/config/pages";
import type { ShippingRoleQuery } from "@/features/pengiriman/route";
export default async function Page({
  searchParams,
}: {
  searchParams: ShippingRoleQuery;
}) {
  const { role = "owner" } = await searchParams;
  if (!isRole(role) || !canAccessPage(role, "D01")) notFound();
  redirect(`/pengiriman/packing?role=${role}`);
}
