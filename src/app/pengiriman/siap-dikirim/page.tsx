import type { Metadata } from "next";
import {
  renderShippingRoute,
  type ShippingRoleQuery,
} from "@/features/pengiriman/route";
export const metadata: Metadata = { title: "Siap dikirim" };
export default async function Page({
  searchParams,
}: {
  searchParams: ShippingRoleQuery;
}) {
  return renderShippingRoute({ page: "D03" }, searchParams);
}
