import type { User } from "@/types/domain";
import type { SalesState, SalesOrder } from "@/features/penjualan/model";
import type { WarehouseState } from "@/features/gudang/model";
import type { ShippingState, ShippingCommand } from "./model";
import { checklistComplete, couriers } from "./model.ts";
import { canAccessPage } from "../../config/pages.ts";
function check(value: unknown, message: string): asserts value {
  if (!value) throw new Error(message);
}
export function shippingStockIssue(
  order: SalesOrder,
  warehouse: WarehouseState,
): string | null {
  if (
    !order.itemIds.length ||
    !order.itemIds.every((id) =>
      warehouse.items.some(
        (item) =>
          item.id === id &&
          item.orderId === order.id &&
          item.status === "sold" &&
          item.locationId !== null &&
          item.outboundAt === null,
      ),
    )
  )
    return "Status atau lokasi barang sudah berubah. Periksa barang pesanan sebelum melanjutkan.";
  return null;
}
export function applyShippingCommand(
  source: ShippingState,
  salesSource: SalesState,
  warehouseSource: WarehouseState,
  command: ShippingCommand,
  actor: Pick<User, "name" | "role">,
  now: string,
) {
  check(Number.isFinite(Date.parse(now)), "Waktu aktivitas tidak valid.");
  const managementOnly =
    command.type === "dispatch" || command.type === "update-tracking";
  check(
    canAccessPage(actor.role, managementOnly ? "D04" : "D02"),
    managementOnly
      ? "Resi dan pelacakan hanya tersedia untuk Owner dan Admin."
      : "Peran ini tidak memiliki akses packing.",
  );
  const shipping = structuredClone(source);
  const sales = structuredClone(salesSource);
  const warehouse = structuredClone(warehouseSource);
  const order = sales.orders.find((order) => order.id === command.orderId);
  check(order, "Pesanan tidak ditemukan.");
  check(
    order.paymentStatus === "approved",
    "Pesanan harus Lunas sebelum diproses untuk pengiriman.",
  );
  if (command.type === "update-tracking") {
    check(
      order.status === "shipped" && order.shipment,
      "Hanya paket dalam pengiriman yang dapat diperbarui.",
    );
    check(
      ["in-transit", "delivered"].includes(command.status),
      "Status pelacakan tidak valid.",
    );
    check(command.description.trim().length >= 3, "Isi keterangan pelacakan.");
    order.shipment.status = command.status;
    order.shipment.events.push({
      title:
        command.status === "delivered"
          ? "Paket Diterima"
          : "Pembaruan Pengiriman",
      description: `${command.description.trim()} · ${actor.name}`,
      dateTime: now,
    });
    if (command.status === "delivered") order.status = "completed";
    return { shipping, sales, warehouse, entityId: order.id };
  }
  check(
    order.status === (command.type === "dispatch" ? "packed" : "paid"),
    command.type === "dispatch"
      ? "Hanya pesanan Dikemas yang dapat diserahkan ke kurir."
      : "Hanya pesanan Lunas yang belum dikemas yang dapat diproses.",
  );
  const stockIssue = shippingStockIssue(order, warehouse);
  check(!stockIssue, stockIssue ?? "Barang belum dapat diproses.");
  const record = shipping.packing.find((record) => record.orderId === order.id);
  if (command.type === "save-checklist") {
    const checklist = command.checklist;
    check(
      Array.isArray(checklist.pickedItemIds) &&
        new Set(checklist.pickedItemIds).size ===
          checklist.pickedItemIds.length &&
        checklist.pickedItemIds.every((id) => order.itemIds.includes(id)) &&
        [
          checklist.codeMatches,
          checklist.conditionMatches,
          checklist.packed,
        ].every((value) => typeof value === "boolean"),
      "Checklist berisi barang atau nilai yang tidak sesuai pesanan.",
    );
    if (record) record.checklist = structuredClone(checklist);
    else
      shipping.packing.push({
        orderId: order.id,
        checklist: structuredClone(checklist),
        packedAt: null,
        packedBy: null,
      });
    return { shipping, sales, warehouse, entityId: order.id };
  }
  check(
    record && checklistComplete(record.checklist, order.itemIds),
    "Lengkapi pengambilan barang, quality check, dan konfirmasi kemas terlebih dahulu.",
  );
  if (command.type === "mark-packed") {
    record.packedAt = now;
    record.packedBy = actor.name;
    order.status = "packed";
    for (const id of order.itemIds)
      warehouse.movements.unshift({
        id: `packed-${order.id}-${id}`,
        entityId: id,
        occurredAt: now,
        action: `Pesanan ${order.id} dikemas`,
        from: "Terjual",
        to: "Terjual",
        actor: actor.name,
      });
    return { shipping, sales, warehouse, entityId: order.id };
  }
  check(record.packedAt, "Riwayat packing belum tersedia.");
  check(!order.shipment, "Resi pesanan ini sudah tersimpan.");
  check(command.handedOver, "Konfirmasi paket sudah diserahkan ke kurir.");
  check(
    couriers.some((courier) => courier === command.courier),
    "Pilih kurir yang valid.",
  );
  const trackingNumber = command.trackingNumber.trim().toUpperCase();
  check(
    /^[A-Z0-9][A-Z0-9-]{4,63}$/.test(trackingNumber),
    "Nomor resi harus berisi 5–64 karakter huruf/angka atau tanda hubung.",
  );
  check(
    !sales.orders.some(
      (other) =>
        other.shipment?.courier === command.courier &&
        other.shipment.trackingNumber.trim().toUpperCase() === trackingNumber,
    ),
    "Nomor resi ini sudah digunakan pada kurir yang sama.",
  );
  order.status = "shipped";
  order.shipment = {
    id: `shipment-${order.id}`,
    orderId: order.id,
    courier: command.courier,
    trackingNumber,
    handedOverAt: now,
    status: "in-transit",
    events: [
      {
        title: "Diserahkan ke Kurir",
        dateTime: now,
        description: `${command.courier} · ${actor.name}`,
      },
    ],
  };
  for (const id of order.itemIds) {
    const item = warehouse.items.find((item) => item.id === id)!;
    const previousLocation = item.locationId!;
    item.status = "outbound";
    item.outboundAt = now;
    item.locationId = null;
    warehouse.movements.unshift(
      {
        id: `outbound-${order.id}-${id}`,
        entityId: id,
        occurredAt: now,
        action: `Diserahkan ke ${command.courier} · ${trackingNumber}`,
        from: "Terjual",
        to: "Keluar Gudang",
        actor: actor.name,
      },
      {
        id: `released-${order.id}-${id}`,
        entityId: id,
        occurredAt: now,
        action: "Lokasi rak dilepas",
        from: previousLocation,
        to: "—",
        actor: actor.name,
      },
    );
  }
  return { shipping, sales, warehouse, entityId: order.id };
}
