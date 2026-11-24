import type { Bale, InventoryItem, WarehouseLocation } from "@/types/domain";
export interface WarehouseRepository {
  listBales(): Promise<Bale[]>;
  listItems(): Promise<InventoryItem[]>;
  getItem(id: string): Promise<InventoryItem | null>;
  listLocations(): Promise<WarehouseLocation[]>;
}
