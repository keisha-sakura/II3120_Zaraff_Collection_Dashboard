import type { User } from "@/types/domain";
import type { SalesState } from "@/features/penjualan/model";
import type { WarehouseState } from "@/features/gudang/model";
import type { SettingsState, SettingsCommand } from "./model";
import { isSettingsState } from "./persistence.ts";
import { canAccessPage } from "../../config/pages.ts";
export function applySettingsCommand(
  source: SettingsState,
  salesSource: SalesState,
  warehouseSource: WarehouseState,
  command: SettingsCommand,
  actor: Pick<User, "role">,
) {
  const page =
    command.type === "save-prices"
      ? "S01"
      : command.type === "save-discount"
        ? "S02"
        : "S03";
  if (!canAccessPage(actor.role, page))
    throw new Error("Pengaturan hanya tersedia untuk Owner dan Admin.");
  const settings = structuredClone(source);
  const sales = structuredClone(salesSource);
  const warehouse = structuredClone(warehouseSource);
  if (command.type === "save-prices") {
    if (!isSettingsState({ version: 1, priceRules: command.priceRules }))
      throw new Error(
        "Harga rekomendasi harus berupa rupiah bulat antara 1 dan 1.000.000.000 untuk setiap kategori dan grade.",
      );
    settings.priceRules = structuredClone(command.priceRules);
    return { settings, sales, warehouse, entityId: "prices" };
  }
  if (command.type === "save-discount") {
    const percent = command.percent;
    if (
      !Number.isFinite(percent) ||
      percent < 0 ||
      percent > 100 ||
      Math.abs(percent * 100 - Math.round(percent * 100)) > 1e-8
    )
      throw new Error(
        "Diskon harus antara 0 dan 100%, maksimal dua angka desimal.",
      );
    sales.memberDiscountPercent = percent;
    return { settings, sales, warehouse, entityId: "discount" };
  }
  const code = command.code.trim().toUpperCase();
  const description = command.description.trim();
  if (!/^[A-Z0-9]+(?:-[A-Z0-9]+)+$/.test(code) || code.length > 32)
    throw new Error(
      "Kode lokasi harus berisi huruf dan angka yang dipisah tanda hubung, maksimal 32 karakter.",
    );
  if (!description || description.length > 160)
    throw new Error("Keterangan wajib diisi, maksimal 160 karakter.");
  if (
    warehouse.locations.some(
      (location) =>
        location.id.toUpperCase() === code ||
        location.code.toUpperCase() === code,
    )
  )
    throw new Error("Kode lokasi sudah digunakan.");
  if (!code.startsWith("BL-") && !/^R[0-9]+-S[0-9]+$/.test(code))
    throw new Error(
      "Gunakan awalan BL- untuk lokasi bale atau format R01-S01 untuk rak.",
    );
  warehouse.locations.push({
    id: code,
    code,
    description,
    kind: code.startsWith("BL-") ? "bale" : "rack",
  });
  return { settings, sales, warehouse, entityId: code };
}
