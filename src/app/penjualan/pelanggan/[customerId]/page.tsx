import type { Metadata } from "next";
import {
  renderSalesRoute,
  type SalesRoleQuery,
} from "@/features/penjualan/route";
export const metadata: Metadata = { title: "Detail pelanggan" };
export default async function Page({
  searchParams,
  params,
}: {
  searchParams: SalesRoleQuery;
  params: Promise<{ customerId: string }>;
}) {
  return renderSalesRoute(
    { page: "P10", entityId: (await params).customerId },
    searchParams,
  );
}
