import { FoundationPreview } from "@/features/foundation/components/foundation-preview";
import { mockWarehouseRepository } from "@/mocks/repositories/warehouse";

export default async function HomePage() {
  const items = await mockWarehouseRepository.listItems();
  return <FoundationPreview items={items} />;
}
