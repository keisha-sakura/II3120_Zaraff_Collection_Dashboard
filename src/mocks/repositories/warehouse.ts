import type { WarehouseRepository } from "@/features/gudang/contracts";
import { mockBales, mockItems, mockLocations } from "../data/warehouse";
/** Read-only demo adapter. No fake persistence or import from production APIs. */
export const mockWarehouseRepository: WarehouseRepository = {
  async listBales() {
    return structuredClone([...mockBales]);
  },
  async listItems() {
    return structuredClone([...mockItems]);
  },
  async getItem(id) {
    return structuredClone(mockItems.find((item) => item.id === id) ?? null);
  },
  async listLocations() {
    return structuredClone([...mockLocations]);
  },
};
