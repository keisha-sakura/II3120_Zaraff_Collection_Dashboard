import type { Metadata } from "next";
import { FoundationPreview } from "@/features/foundation/components/foundation-preview";
import { mockWarehouseRepository } from "@/mocks/repositories/warehouse";
export const metadata: Metadata = { title: "Katalog fondasi" };
export default async function FoundationPage() {
  return (
    <FoundationPreview items={await mockWarehouseRepository.listItems()} />
  );
}
