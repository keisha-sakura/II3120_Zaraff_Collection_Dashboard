import type { Metadata } from "next";
import {
  renderWarehouseRoute,
  type DemoRoleQuery,
} from "@/features/gudang/route";
export const metadata: Metadata = { title: "Terima bale" };
export default async function Page({
  searchParams,
}: {
  searchParams: DemoRoleQuery;
}) {
  return renderWarehouseRoute({ page: "G02" }, searchParams);
}
