import type { Metadata } from "next";
import {
  renderWarehouseRoute,
  type DemoRoleQuery,
} from "@/features/gudang/route";
export const metadata: Metadata = { title: "Grading barang" };
export default async function Page({
  searchParams,
  params,
}: {
  searchParams: DemoRoleQuery;
  params: Promise<{ itemId: string }>;
}) {
  return renderWarehouseRoute(
    { page: "G08", entityId: (await params).itemId },
    searchParams,
  );
}
