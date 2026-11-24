import type { Metadata } from "next";
import {
  renderWarehouseRoute,
  type DemoRoleQuery,
} from "@/features/gudang/route";
export const metadata: Metadata = { title: "Retur ke supplier" };
export default async function Page({
  searchParams,
  params,
}: {
  searchParams: DemoRoleQuery;
  params: Promise<{ baleId: string }>;
}) {
  return renderWarehouseRoute(
    { page: "G05", entityId: (await params).baleId },
    searchParams,
  );
}
