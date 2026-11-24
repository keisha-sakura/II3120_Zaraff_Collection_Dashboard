import type { Metadata } from "next";
import {
  renderSalesRoute,
  type SalesRoleQuery,
} from "@/features/penjualan/route";
export const metadata: Metadata = { title: "Detail pesanan" };
export default async function Page({
  searchParams,
  params,
}: {
  searchParams: SalesRoleQuery;
  params: Promise<{ orderId: string }>;
}) {
  return renderSalesRoute(
    { page: "P08", entityId: (await params).orderId },
    searchParams,
  );
}
