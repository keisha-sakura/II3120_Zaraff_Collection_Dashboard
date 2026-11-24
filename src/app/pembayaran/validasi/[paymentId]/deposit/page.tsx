import type { Metadata } from "next";
import {
  renderPaymentsRoute,
  type PaymentsRoleQuery,
} from "@/features/pembayaran/route";
export const metadata: Metadata = { title: "Validasi deposit" };
export default async function Page({
  searchParams,
  params,
}: {
  searchParams: PaymentsRoleQuery;
  params: Promise<{ paymentId: string }>;
}) {
  return renderPaymentsRoute(
    { page: "Y03", entityId: (await params).paymentId },
    searchParams,
  );
}
