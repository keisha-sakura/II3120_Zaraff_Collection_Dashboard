import type { Metadata } from "next";
import {
  renderShippingRoute,
  type ShippingRoleQuery,
} from "@/features/pengiriman/route";
export const metadata: Metadata = { title: "Input resi" };
export default async function Page({
  searchParams,
  params,
}: {
  searchParams: ShippingRoleQuery;
  params: Promise<{ orderId: string }>;
}) {
  return renderShippingRoute(
    { page: "D04", entityId: (await params).orderId },
    searchParams,
  );
}
