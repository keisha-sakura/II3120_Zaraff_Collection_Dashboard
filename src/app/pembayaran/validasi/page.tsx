import type { Metadata } from "next";
import {
  renderPaymentsRoute,
  type PaymentsRoleQuery,
} from "@/features/pembayaran/route";
export const metadata: Metadata = { title: "Menunggu validasi" };
export default async function Page({
  searchParams,
}: {
  searchParams: PaymentsRoleQuery;
}) {
  return renderPaymentsRoute({ page: "Y01" }, searchParams);
}
