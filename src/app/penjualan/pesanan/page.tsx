import type { Metadata } from "next";
import {
  renderSalesRoute,
  type SalesRoleQuery,
} from "@/features/penjualan/route";
export const metadata: Metadata = { title: "Pesanan" };
export default async function Page({
  searchParams,
}: {
  searchParams: SalesRoleQuery;
}) {
  return renderSalesRoute({ page: "P07" }, searchParams);
}
