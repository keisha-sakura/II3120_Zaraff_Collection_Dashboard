import type { Metadata } from "next";
import {
  renderPaymentsRoute,
  type PaymentsRoleQuery,
} from "@/features/pembayaran/route";
export const metadata: Metadata = { title: "Detail tagihan" };
export default async function Page({
  searchParams,
  params,
}: {
  searchParams: PaymentsRoleQuery;
  params: Promise<{ invoiceId: string }>;
}) {
  return renderPaymentsRoute(
    { page: "Y06", entityId: (await params).invoiceId },
    searchParams,
  );
}
