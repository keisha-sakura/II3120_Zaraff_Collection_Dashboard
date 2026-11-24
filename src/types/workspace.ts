import type { WarehouseState } from "@/features/gudang/model";
import type { SalesState } from "@/features/penjualan/model";
import type { PaymentsState } from "@/features/pembayaran/model";
import type { ShippingState } from "@/features/pengiriman/model";
import type { ReportsState } from "@/features/laporan/model";
import type { SettingsState } from "@/features/pengaturan/model";
import type { User } from "./domain";
export type Workspace = {
  version: 1;
  directory?: User[];
  warehouse: WarehouseState;
  sales: SalesState;
  payments: PaymentsState;
  shipping: ShippingState;
  reports: ReportsState;
  settings: SettingsState;
};
