import type { Metadata } from "next";
import {
  renderSalesRoute,
  type SalesRoleQuery,
} from "@/features/penjualan/route";

export const metadata: Metadata = { title: "Detail live" };
export default async function Page({
  searchParams,
  params,
}: {
  searchParams: SalesRoleQuery;
  params: Promise<{ liveId: string }>;
}) {
  return renderSalesRoute(
    { page: "P11", entityId: (await params).liveId },
    searchParams,
  );
}
