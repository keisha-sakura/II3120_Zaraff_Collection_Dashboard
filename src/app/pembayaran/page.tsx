import { redirect, notFound } from "next/navigation";
import { isRole } from "@/config/roles";
import { canAccessPage } from "@/config/pages";
import type { PaymentsRoleQuery } from "@/features/pembayaran/route";
export default async function Page({
  searchParams,
}: {
  searchParams: PaymentsRoleQuery;
}) {
  const { role = "owner" } = await searchParams;
  if (!isRole(role) || !canAccessPage(role, "Y01")) notFound();
  redirect(`/pembayaran/validasi?role=${role}`);
}
