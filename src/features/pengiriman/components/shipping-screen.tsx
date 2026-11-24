"use client";
import { ModuleTabs } from "@/components/layout/module-tabs";
import { getNavigation } from "@/config/navigation";
import type { ShippingView } from "../model";
import { useShipping } from "./shipping-provider";
import { PackingQueuePage } from "../pages/packing-antrean/page-content";
import { PackingDetailPage } from "../pages/packing-detail/page-content";
import { ReadyToShipPage } from "../pages/siap-dikirim/page-content";
import { TrackingInputPage } from "../pages/input-resi/page-content";
import { InTransitPage } from "../pages/dalam-pengiriman/page-content";
export function ShippingScreen({ view }: { view: ShippingView }) {
  const { user } = useShipping();
  const tabs = getNavigation(user.role)
    .find((module) => module.id === "pengiriman")!
    .tabs.map((tab) => ({
      ...tab,
      title: tab.id === "D01" ? "Packing" : tab.title,
    }));
  const activeId =
    view.page === "D06"
      ? "D06"
      : view.page === "D03" || view.page === "D04"
        ? "D03"
        : "D01";
  const id = view.entityId ?? "";
  let content;
  switch (view.page) {
    case "D01":
      content = <PackingQueuePage />;
      break;
    case "D02":
      content = <PackingDetailPage id={id} />;
      break;
    case "D03":
      content = <ReadyToShipPage />;
      break;
    case "D04":
      content = <TrackingInputPage id={id} />;
      break;
    case "D06":
      content = <InTransitPage />;
      break;
  }
  return (
    <>
      <ModuleTabs items={tabs} activeId={activeId} />
      {content}
    </>
  );
}
