import type { Metadata } from "next";
import {
  renderPaymentsRoute,
  type PaymentsRoleQuery,
} from "@/features/pembayaran/route";
export const metadata: Metadata = { title: "Belum dibayar" };
export default async function Page({
  searchParams,
}: {
  searchParams: PaymentsRoleQuery;
}) {
  return renderPaymentsRoute({ page: "Y05" }, searchParams);
}
