"use client";
import { ModuleTabs } from "@/components/layout/module-tabs";
import { getNavigation } from "@/config/navigation";
import type { SettingsView } from "../model";
import { useSettings } from "./settings-provider";
import { PricingPage } from "../pages/aturan-harga/page-content";
import { DiscountPage } from "../pages/diskon-member/page-content";
import { LocationsPage } from "../pages/lokasi/page-content";
export function SettingsScreen({ view }: { view: SettingsView }) {
  const { user } = useSettings();
  const labels = { S01: "Harga", S02: "Diskon", S03: "Lokasi" };
  const tabs = getNavigation(user.role)
    .find((module) => module.id === "pengaturan")!
    .tabs.map((tab) => ({
      ...tab,
      title: labels[tab.id as keyof typeof labels],
    }));
  return (
    <>
      <ModuleTabs items={tabs} activeId={view.page} />
      {view.page === "S01" ? (
        <PricingPage />
      ) : view.page === "S02" ? (
        <DiscountPage />
      ) : (
        <LocationsPage />
      )}
    </>
  );
}
