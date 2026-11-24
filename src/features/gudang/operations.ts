import {
  categories,
  conditions,
  type WarehouseCommand,
  type WarehouseState,
} from "./model.ts";

function requireValue(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}
function codeDate(date: string) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    year: "2-digit",
    month: "2-digit",
    day: "2-digit",
    timeZone: "Asia/Jakarta",
  }).formatToParts(new Date(date));
  const part = (type: string) =>
    parts.find((part) => part.type === type)!.value;
  return part("year") + part("month") + part("day");
}
export function nextWarehouseCode(
  prefix: "BL" | "ZR" | "RT",
  ids: readonly string[],
  date: string,
) {
  const day = codeDate(date);
  const key = `${prefix}-${prefix === "ZR" ? day.slice(0, 4) : day}-`;
  const max = Math.max(
    0,
    ...ids
      .filter((id) => id.startsWith(key))
      .map((id) => Number(id.slice(key.length)))
      .filter(Number.isFinite),
  );
  return `${key}${String(max + 1).padStart(prefix === "ZR" ? 4 : 3, "0")}`;
}
export function applyWarehouseCommand(
  current: WarehouseState,
  command: WarehouseCommand,
  actor: string,
  now: string,
): { state: WarehouseState; entityId: string } {
  requireValue(
    Number.isFinite(Date.parse(now)),
    "Tanggal aktivitas tidak valid.",
  );
  const state = structuredClone(current);
  function log(entityId: string, action: string, from: string, to: string) {
    state.movements.unshift({
      id: `movement-${state.movements.length + 1}-${entityId}`,
      entityId,
      occurredAt: now,
      action,
      from,
      to,
      actor,
    });
  }
  function location(id: string, kind: "bale" | "rack") {
    requireValue(
      state.locations.some(
        (location) => location.id === id && location.kind === kind,
      ),
      kind === "rack"
        ? "Pilih lokasi rak yang valid."
        : "Pilih lokasi penyimpanan bale yang valid.",
    );
  }
  if (command.type === "receive") {
    const input = command.input;
    requireValue(
      input.supplier.trim() && input.category.trim(),
      "Supplier dan jenis bale wajib diisi.",
    );
    requireValue(
      Number.isFinite(input.weightKg) &&
        input.weightKg > 0 &&
        Number.isInteger(input.estimatedItems) &&
        input.estimatedItems > 0,
      "Berat dan perkiraan jumlah item harus lebih dari nol.",
    );
    requireValue(
      Number.isFinite(Date.parse(input.receivedAt)) &&
        Date.parse(input.receivedAt) <= Date.parse(now),
      "Tanggal diterima tidak valid atau berada di masa depan.",
    );
    location(input.locationId, "bale");
    const id = nextWarehouseCode(
      "BL",
      state.bales.map((bale) => bale.id),
      input.receivedAt,
    );
    state.bales.unshift({
      ...input,
      supplier: input.supplier.trim(),
      category: input.category.trim(),
      id,
      status: "stored",
      receivedBy: actor,
    });
    log(id, "Bale diterima", "—", "Di Gudang");
    log(id, "Lokasi ditetapkan", "—", input.locationId);
    return { state, entityId: id };
  }
  if (
    command.type === "start-sort" ||
    command.type === "finish-sort" ||
    command.type === "record-item"
  ) {
    const baleId =
      command.type === "record-item" ? command.input.baleId : command.baleId;
    const bale = state.bales.find((bale) => bale.id === baleId);
    requireValue(bale, "Bale tidak ditemukan.");
    if (command.type === "start-sort") {
      requireValue(
        bale.status === "stored",
        "Bale ini sudah dimulai atau selesai disortir.",
      );
      bale.status = "sorting";
      log(bale.id, "Mulai sortir", "Di Gudang", "Sedang Disortir");
      return { state, entityId: bale.id };
    }
    requireValue(
      bale.status === "sorting",
      "Hanya bale yang sedang disortir yang dapat diubah.",
    );
    if (command.type === "finish-sort") {
      requireValue(
        state.items.some((item) => item.baleId === bale.id) ||
          state.returns.some((item) => item.baleId === bale.id),
        "Catat minimal satu item atau retur sebelum menyelesaikan sortir.",
      );
      const previousLocation = bale.locationId;
      bale.status = "sorted";
      bale.locationId = null;
      log(bale.id, "Sortir selesai", "Sedang Disortir", "Selesai Disortir");
      if (previousLocation)
        log(bale.id, "Lokasi bale dilepas", previousLocation, "—");
      return { state, entityId: bale.id };
    }
    const input = command.input;
    requireValue(
      categories.some((category) => category === input.category) &&
        conditions.some((condition) => condition === input.condition),
      "Kategori atau kondisi tidak valid.",
    );
    requireValue(
      input.outcome === "return" || input.outcome === "laundry",
      "Pilih hasil pemeriksaan yang valid.",
    );
    if (input.outcome === "return") {
      requireValue(input.reason.trim(), "Alasan retur wajib diisi.");
      const id = nextWarehouseCode(
        "RT",
        state.returns.map((item) => item.id),
        now,
      );
      state.returns.unshift({
        id,
        baleId,
        category: input.category,
        condition: input.condition,
        reason: input.reason.trim(),
        createdAt: now,
        createdBy: actor,
      });
      log(
        baleId,
        `Retur ${id}: ${input.reason.trim()}`,
        "Hasil sortir",
        "Diretur",
      );
      return { state, entityId: id };
    }
    requireValue(
      !input.condition.startsWith("Tidak Layak"),
      "Barang tidak layak harus dicatat sebagai retur.",
    );
    const id = nextWarehouseCode(
      "ZR",
      state.items.map((item) => item.id),
      now,
    );
    state.items.unshift({
      id,
      baleId,
      category: input.category,
      condition: input.condition,
      grade: null,
      price: null,
      status: "laundry",
      locationId: null,
      availableAt: null,
      soldAt: null,
      outboundAt: null,
      sortedAt: now,
      sortedBy: actor,
      laundryAt: now,
      orderId: null,
    });
    log(id, "Hasil sortir, ke laundry", "—", "Di Laundry");
    return { state, entityId: id };
  }
  const item = state.items.find((item) => item.id === command.itemId);
  requireValue(item, "Barang tidak ditemukan.");
  location(command.locationId, "rack");
  if (command.type === "grade") {
    requireValue(
      item.status === "laundry",
      "Grading hanya tersedia untuk barang di laundry.",
    );
    requireValue(
      command.confirmedClean,
      "Konfirmasi barang sudah kembali dari laundry dan bersih.",
    );
    requireValue(
      ["A", "B", "C"].includes(command.grade) &&
        Number.isInteger(command.price) &&
        command.price > 0,
      "Grade dan harga final harus valid; harga wajib lebih dari nol.",
    );
    item.grade = command.grade;
    item.price = command.price;
    item.status = "available";
    item.locationId = command.locationId;
    item.availableAt = now;
    log(item.id, "Selesai laundry dan grading", "Di Laundry", "Tersedia");
    log(item.id, "Lokasi ditetapkan", "—", command.locationId);
  } else {
    requireValue(
      ["available", "reserved", "sold"].includes(item.status) &&
        item.locationId,
      "Barang ini belum memiliki lokasi rak atau sudah keluar gudang.",
    );
    requireValue(
      command.locationId !== item.locationId,
      "Pilih lokasi tujuan yang berbeda.",
    );
    log(item.id, "Pindah lokasi", item.locationId, command.locationId);
    item.locationId = command.locationId;
  }
  return { state, entityId: item.id };
}
