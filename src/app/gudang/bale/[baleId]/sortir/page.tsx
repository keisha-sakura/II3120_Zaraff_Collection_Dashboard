import type { Metadata } from "next";
import {
  renderWarehouseRoute,
  type DemoRoleQuery,
} from "@/features/gudang/route";
export const metadata: Metadata = { title: "Sortir item" };
export default async function Page({
  searchParams,
  params,
}: {
  searchParams: DemoRoleQuery;
  params: Promise<{ baleId: string }>;
}) {
  return renderWarehouseRoute(
    { page: "G04", entityId: (await params).baleId },
    searchParams,
  );
}
