import type { Metadata } from "next";
import {
  renderSalesRoute,
  type SalesRoleQuery,
} from "@/features/penjualan/route";
export const metadata: Metadata = { title: "Pilih barang live" };
export default async function Page({
  searchParams,
}: {
  searchParams: SalesRoleQuery;
}) {
  return renderSalesRoute({ page: "P03" }, searchParams);
}
