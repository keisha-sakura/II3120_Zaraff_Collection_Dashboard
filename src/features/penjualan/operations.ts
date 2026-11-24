import type { WarehouseState } from "@/features/gudang/model";
import type {
  SalesState,
  SalesCommand,
  LiveContent,
  CustomerInput,
  ClaimResult,
  SalesCustomer,
  SalesOrder,
} from "./model";
import { liveHosts, promotionChannels } from "./model.ts";
import { normalizeHandle, parseClaims, validHandle } from "./claims.ts";
import { itemStatuses } from "../../config/statuses.ts";

function check(value: unknown, message: string): asserts value {
  if (!value) throw new Error(message);
}
function nextCode(prefix: string, ids: string[], now: string) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Jakarta",
    year: "2-digit",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date(now));
  const part = (name: string) =>
    parts.find((part) => part.type === name)!.value;
  const start = `${prefix}-${part("year")}${part("month")}${part("day")}-`;
  const last = Math.max(
    0,
    ...ids
      .filter((id) => id.startsWith(start))
      .map((id) => Number(id.slice(start.length)))
      .filter(Number.isFinite),
  );
  return `${start}${String(last + 1).padStart(3, "0")}`;
}
function validateContent(
  input: LiveContent,
  now: string,
  hosts: readonly { id: string }[],
) {
  check(
    input.title.trim().length >= 3 && input.title.trim().length <= 150,
    "Judul live harus berisi 3–150 karakter.",
  );
  check(
    input.content.trim().length >= 3 && input.content.length <= 5000,
    "Isi promosi wajib diisi, maksimal 5.000 karakter.",
  );
  check(
    Number.isFinite(Date.parse(input.scheduledAt)) &&
      Date.parse(input.scheduledAt) > Date.parse(now),
    "Jadwal live harus berada di masa depan (WIB).",
  );
  check(
    hosts.some((host) => host.id === input.hostId),
    "Pilih host yang valid.",
  );
  check(
    input.promotionChannels.length > 0 &&
      input.promotionChannels.every((channel) =>
        promotionChannels.some((allowed) => allowed === channel),
      ),
    "Pilih minimal satu kanal publikasi yang valid.",
  );
}
function validateCustomer(input: CustomerInput) {
  check(
    input.name.trim().length >= 2 && input.name.trim().length <= 100,
    "Nama pelanggan harus berisi 2–100 karakter.",
  );
  check(
    validHandle(normalizeHandle(input.handle)),
    "Handle media sosial tidak valid.",
  );
  check(
    /^\+?[0-9\s()-]+$/.test(input.phone) &&
      input.phone.replace(/\D/g, "").length >= 9 &&
      input.phone.replace(/\D/g, "").length <= 15,
    "Isi kontak WhatsApp yang valid (9–15 digit).",
  );
}
export function applySalesCommand(
  current: SalesState,
  source: WarehouseState,
  command: SalesCommand,
  actor: string,
  now: string,
  hosts: readonly { id: string }[] = liveHosts,
): { sales: SalesState; warehouse: WarehouseState; entityId: string } {
  check(Number.isFinite(Date.parse(now)), "Waktu aktivitas tidak valid.");
  const sales = structuredClone(current);
  const warehouse = structuredClone(source);
  if (command.type === "discard-draft") {
    sales.draft = null;
    return { sales, warehouse, entityId: "discarded" };
  }
  if (command.type === "start-draft") {
    const live = command.liveId
      ? sales.lives.find((live) => live.id === command.liveId)
      : null;
    if (command.liveId)
      check(
        live && live.status !== "completed",
        "Live yang sudah selesai tidak dapat diubah.",
      );
    sales.draft = live
      ? {
          title: live.title,
          content: live.content,
          scheduledAt: live.scheduledAt,
          hostId: live.hostId,
          promotionChannels: [...live.promotionChannels],
          itemIds: [...live.itemIds],
          editingId: live.id,
        }
      : {
          title: "",
          content: "",
          scheduledAt: "",
          hostId: hosts[0]?.id ?? "",
          promotionChannels: [],
          itemIds: [],
          editingId: null,
        };
    return { sales, warehouse, entityId: "draft" };
  }
  if (command.type === "save-content") {
    validateContent(command.input, now, hosts);
    sales.draft = {
      ...command.input,
      title: command.input.title.trim(),
      content: command.input.content.trim(),
      promotionChannels: [...new Set(command.input.promotionChannels)],
      editingId: sales.draft?.editingId ?? null,
      itemIds: sales.draft?.itemIds ?? [],
    };
    return { sales, warehouse, entityId: "draft" };
  }
  if (command.type === "select-items" || command.type === "save-live") {
    check(sales.draft, "Isi konten dan jadwal terlebih dahulu.");
    const itemIds =
      command.type === "select-items" ? command.itemIds : sales.draft.itemIds;
    check(
      itemIds.length > 0 && new Set(itemIds).size === itemIds.length,
      "Pilih minimal satu barang yang berbeda.",
    );
    check(
      itemIds.every((id) =>
        warehouse.items.some(
          (item) =>
            item.id === id &&
            item.status === "available" &&
            item.price !== null &&
            item.price > 0 &&
            item.grade !== null,
        ),
      ),
      "Ada barang yang sudah tidak tersedia atau belum memiliki grade/harga. Periksa pilihan kembali.",
    );
    if (command.type === "select-items") {
      sales.draft.itemIds = [...itemIds];
      return { sales, warehouse, entityId: "draft" };
    }
    validateContent(sales.draft, now, hosts);
    const id =
      sales.draft.editingId ??
      nextCode(
        "LIVE",
        sales.lives.map((live) => live.id),
        now,
      );
    const existing = sales.lives.find((live) => live.id === id);
    check(
      !existing || existing.status !== "completed",
      "Live yang sudah selesai tidak dapat diubah.",
    );
    const saved = {
      ...sales.draft,
      id,
      platform: "TikTok Live" as const,
      status: command.publish ? ("published" as const) : ("draft" as const),
      claimsProcessed: false,
      results: [],
    };
    sales.lives = [saved, ...sales.lives.filter((live) => live.id !== id)];
    sales.draft = null;
    return { sales, warehouse, entityId: id };
  }
  if (command.type === "add-customer" || command.type === "update-customer") {
    validateCustomer(command.input);
    const handle = normalizeHandle(command.input.handle);
    const id =
      command.type === "update-customer"
        ? command.customerId
        : nextCode(
            "CUS",
            sales.customers.map((customer) => customer.id),
            now,
          );
    check(
      !sales.customers.some(
        (customer) =>
          customer.id !== id && normalizeHandle(customer.handle) === handle,
      ),
      "Handle ini sudah digunakan pelanggan lain.",
    );
    const input = {
      ...command.input,
      name: command.input.name.trim(),
      phone: command.input.phone.trim(),
      handle,
    };
    if (command.type === "add-customer")
      sales.customers.push({ ...input, id, depositBalance: 0, joinedAt: now });
    else {
      const customer = sales.customers.find((customer) => customer.id === id);
      check(customer, "Pelanggan tidak ditemukan.");
      Object.assign(customer, input);
    }
    return { sales, warehouse, entityId: id };
  }
  const live = sales.lives.find((live) => live.id === command.liveId);
  check(
    command.type !== "complete-live",
    "Penyelesaian live harus melalui service server.",
  );
  check(live, "Live tidak ditemukan.");
  check(
    live.status === "completed",
    "Klaim hanya dapat diproses untuk live yang sudah selesai.",
  );
  check(
    !live.claimsProcessed,
    "Klaim live ini sudah diproses. Pesanan tidak dibuat ulang.",
  );
  check(command.text.length <= 1_000_000, "Ukuran input klaim maksimal 1 MB.");
  const rows = parseClaims(command.text);
  check(
    rows.length > 0 && rows.length <= 1000,
    "Masukkan 1–1.000 baris klaim.",
  );
  const winners = new Map<string, ClaimResult>();
  const seen = new Set<string>();
  const results: ClaimResult[] = [];
  for (const row of [...rows].sort(
    (a, b) =>
      (a.milliseconds ?? Infinity) - (b.milliseconds ?? Infinity) ||
      a.line - b.line,
  )) {
    const result: ClaimResult = {
      ...row,
      id: `${live.id}-claim-${row.line}`,
      outcome: "invalid",
      reason: row.error ?? "",
      orderId: null,
    };
    results.push(result);
    if (row.error) continue;
    const item = warehouse.items.find((item) => item.id === row.itemCode);
    if (!item) {
      result.reason = "Kode produk tidak ditemukan";
      continue;
    }
    if (!live.itemIds.includes(item.id)) {
      result.reason = "Barang tidak termasuk dalam live ini";
      continue;
    }
    if (
      item.status !== "available" ||
      item.price === null ||
      item.price <= 0 ||
      item.grade === null
    ) {
      result.reason = `Barang berstatus ${itemStatuses[item.status].label}`;
      continue;
    }
    const signature = `${row.handle}|${row.itemCode}|${row.time}`;
    if (seen.has(signature)) {
      result.outcome = "rejected";
      result.reason = "Duplikat komentar";
      continue;
    }
    seen.add(signature);
    const winner = winners.get(item.id);
    if (winner) {
      result.outcome = "rejected";
      if (winner.milliseconds === row.milliseconds) {
        winner.reason = `Waktu sama; baris ${winner.line} lebih awal daripada baris ${row.line}`;
        result.reason = `Waktu sama; didahului ${winner.handle} pada baris ${winner.line}`;
      } else result.reason = `Kalah cepat dari ${winner.handle}`;
      continue;
    }
    result.outcome = "won";
    result.reason = "Pembeli tercepat";
    winners.set(item.id, result);
  }
  const grouped = new Map<string, ClaimResult[]>();
  for (const winner of winners.values())
    grouped.set(winner.handle, [...(grouped.get(winner.handle) ?? []), winner]);
  for (const [handle, claims] of grouped) {
    let customer: SalesCustomer | undefined = sales.customers.find(
      (customer) => normalizeHandle(customer.handle) === handle,
    );
    if (!customer) {
      customer = {
        id: nextCode(
          "CUS",
          sales.customers.map((customer) => customer.id),
          now,
        ),
        name: handle.slice(1),
        handle,
        phone: "",
        isMember: false,
        depositBalance: 0,
        joinedAt: now,
      };
      sales.customers.push(customer);
    }
    const lines = claims.map((claim) => {
      const item = warehouse.items.find((item) => item.id === claim.itemCode)!;
      return {
        itemId: item.id,
        category: item.category,
        grade: item.grade!,
        price: item.price!,
      };
    });
    const subtotal = lines.reduce((total, line) => total + line.price, 0);
    const memberDiscount = customer.isMember
      ? Math.round((subtotal * sales.memberDiscountPercent) / 100)
      : 0;
    const order: SalesOrder = {
      id: nextCode(
        "ORD",
        sales.orders.map((order) => order.id),
        now,
      ),
      customerId: customer.id,
      itemIds: lines.map((line) => line.itemId),
      createdAt: now,
      subtotal,
      memberDiscount,
      total: subtotal - memberDiscount,
      status: "awaiting-payment",
      liveId: live.id,
      lines,
      paymentStatus: "unpaid",
      shipment: null,
    };
    sales.orders.unshift(order);
    for (const claim of claims) {
      claim.orderId = order.id;
      const item = warehouse.items.find((item) => item.id === claim.itemCode)!;
      item.status = "reserved";
      item.orderId = order.id;
      warehouse.movements.unshift({
        id: `claim-${order.id}-${item.id}`,
        entityId: item.id,
        occurredAt: now,
        action: "Reservasi dari klaim live",
        from: "Tersedia",
        to: "Dipesan",
        actor,
      });
    }
  }
  live.results = results;
  live.claimsProcessed = true;
  return { sales, warehouse, entityId: live.id };
}
