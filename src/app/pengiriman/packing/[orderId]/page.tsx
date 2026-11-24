import type { Metadata } from "next";
import {
  renderShippingRoute,
  type ShippingRoleQuery,
} from "@/features/pengiriman/route";
export const metadata: Metadata = { title: "Detail packing" };
export default async function Page({
  searchParams,
  params,
}: {
  searchParams: ShippingRoleQuery;
  params: Promise<{ orderId: string }>;
}) {
  return renderShippingRoute(
    { page: "D02", entityId: (await params).orderId },
    searchParams,
  );
}
