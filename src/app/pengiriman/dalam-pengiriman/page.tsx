import type { Metadata } from "next";
import {
  renderShippingRoute,
  type ShippingRoleQuery,
} from "@/features/pengiriman/route";
export const metadata: Metadata = { title: "Dalam pengiriman" };
export default async function Page({
  searchParams,
}: {
  searchParams: ShippingRoleQuery;
}) {
  return renderShippingRoute({ page: "D06" }, searchParams);
}
