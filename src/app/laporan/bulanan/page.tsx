import type { Metadata } from "next";
import {
  renderReportsRoute,
  type ReportsQuery,
} from "@/features/laporan/route";
export const metadata: Metadata = { title: "Laporan bulanan" };
export default async function Page({
  searchParams,
}: {
  searchParams: ReportsQuery;
}) {
  return renderReportsRoute({ page: "R02" }, searchParams);
}
