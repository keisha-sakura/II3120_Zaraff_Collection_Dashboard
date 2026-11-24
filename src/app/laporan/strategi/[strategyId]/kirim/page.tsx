import type { Metadata } from "next";
import {
  renderReportsRoute,
  type ReportsQuery,
} from "@/features/laporan/route";
export const metadata: Metadata = { title: "Kirim strategi" };
export default async function Page({
  searchParams,
  params,
}: {
  searchParams: ReportsQuery;
  params: Promise<{ strategyId: string }>;
}) {
  return renderReportsRoute(
    { page: "R07", entityId: (await params).strategyId },
    searchParams,
  );
}
