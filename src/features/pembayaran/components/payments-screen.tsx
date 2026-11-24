"use client";
import { ModuleTabs } from "@/components/layout/module-tabs";
import { getNavigation } from "@/config/navigation";
import type { PaymentsView } from "../model";
import { usePayments } from "./payments-provider";
import { PendingPaymentsPage } from "../pages/menunggu-validasi/page-content";
import { TransferValidationPage } from "../pages/validasi-transfer/page-content";
import { DepositValidationPage } from "../pages/validasi-deposit/page-content";
import { UnpaidInvoicesPage } from "../pages/belum-dibayar/page-content";
import { InvoiceDetailPage } from "../pages/tagihan-detail/page-content";
export function PaymentsScreen({ view }: { view: PaymentsView }) {
  const { user } = usePayments();
  const tabs = getNavigation(user.role).find(
    (module) => module.id === "pembayaran",
  )!.tabs;
  const activeId = view.page === "Y05" || view.page === "Y06" ? "Y05" : "Y01";
  const id = view.entityId ?? "";
  let content;
  switch (view.page) {
    case "Y01":
      content = <PendingPaymentsPage />;
      break;
    case "Y02":
      content = <TransferValidationPage id={id} />;
      break;
    case "Y03":
      content = <DepositValidationPage id={id} />;
      break;
    case "Y05":
      content = <UnpaidInvoicesPage />;
      break;
    case "Y06":
      content = <InvoiceDetailPage id={id} />;
      break;
  }
  return (
    <>
      <ModuleTabs items={tabs} activeId={activeId} />
      {content}
    </>
  );
}
