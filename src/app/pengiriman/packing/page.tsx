import type { Metadata } from "next";
import {
  renderShippingRoute,
  type ShippingRoleQuery,
} from "@/features/pengiriman/route";
export const metadata: Metadata = { title: "Antrean Packing" };
export default async function Page({
  searchParams,
}: {
  searchParams: ShippingRoleQuery;
}) {
  return renderShippingRoute({ page: "D01" }, searchParams);
}
