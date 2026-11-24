import type { Metadata } from "next";
import {
  renderWarehouseRoute,
  type DemoRoleQuery,
} from "@/features/gudang/route";
export const metadata: Metadata = { title: "Detail bale" };
export default async function Page({
  searchParams,
  params,
}: {
  searchParams: DemoRoleQuery;
  params: Promise<{ baleId: string }>;
}) {
  return renderWarehouseRoute(
    { page: "G03", entityId: (await params).baleId },
    searchParams,
  );
}
