import { errors } from "@backend/lib/errors";
import { inventoryService } from "@backend/services/s1-inventory/service";
import { notificationService } from "@backend/services/s7-notification/service";
import { promotionRepository } from "./repository";

export const promotionService = {
  list: () => promotionRepository.list(),

  async create(input: {
    judul: string;
    isi: string;
    kanal: string;
    jadwalLive: Date;
    itemIds?: string[];
  }) {
    const promotion = await promotionRepository.create({
      judul: input.judul,
      isi: input.isi,
      kanal: input.kanal,
      jadwalLive: input.jadwalLive,
      status: "draf",
    });
    if (input.itemIds?.length) {
      for (const itemId of input.itemIds) {
        // Verify item exists via S1 (read-only cross-service lookup)
        const item = await inventoryService.findItemById(itemId);
        if (!item)
          throw errors.tidakDitemukan(`Item ${itemId} tidak ditemukan`);
        if (item.status !== "tersedia")
          throw errors.konflik(
            `Item ${item.kode} tidak tersedia untuk promosi`,
          );
        await promotionRepository.addItem({
          promotionId: promotion.id,
          itemId,
          kode: item.kode,
        });
      }
    }
    return promotionRepository.findById(promotion.id);
  },

  async update(
    id: string,
    input: Partial<{
      judul: string;
      isi: string;
      kanal: string;
      jadwalLive: Date;
    }>,
  ) {
    const promo = await promotionRepository.findById(id);
    if (!promo) throw errors.tidakDitemukan("Promosi tidak ditemukan");
    return promotionRepository.update(id, input);
  },

  async publish(id: string) {
    const promo = await promotionRepository.findById(id);
    if (!promo) throw errors.tidakDitemukan("Promosi tidak ditemukan");
    // S9 may not call S3 — broadcast target is "semua pelanggan" string literal
    await notificationService.send({
      tipe: "broadcast",
      tujuan: "semua pelanggan",
      isi: `[PROMOSI] ${promo.judul}: ${promo.isi}`,
    });
    return promotionRepository.update(id, { status: "dipublikasikan" });
  },

  async sendReminder(id: string) {
    const promo = await promotionRepository.findById(id);
    if (!promo) throw errors.tidakDitemukan("Promosi tidak ditemukan");
    await notificationService.send({
      tipe: "reminder",
      tujuan: "semua pelanggan",
      isi: `[REMINDER] Live ${promo.judul} dijadwalkan pada ${promo.jadwalLive.toISOString()}`,
    });
    return { pesan: "Reminder berhasil dikirim" };
  },
};
