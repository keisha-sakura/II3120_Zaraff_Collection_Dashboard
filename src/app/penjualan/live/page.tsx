import type { Metadata } from "next";
import {
  renderSalesRoute,
  type SalesRoleQuery,
} from "@/features/penjualan/route";
export const metadata: Metadata = { title: "Jadwal Live" };
export default async function Page({
  searchParams,
}: {
  searchParams: SalesRoleQuery;
}) {
  return renderSalesRoute({ page: "P01" }, searchParams);
}
