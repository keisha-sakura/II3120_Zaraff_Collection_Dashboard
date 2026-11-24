import type { Metadata } from "next";
import {
  renderWarehouseRoute,
  type DemoRoleQuery,
} from "@/features/gudang/route";
export const metadata: Metadata = { title: "Bale dan Sortir" };
export default async function Page({
  searchParams,
}: {
  searchParams: DemoRoleQuery;
}) {
  return renderWarehouseRoute({ page: "G01" }, searchParams);
}
