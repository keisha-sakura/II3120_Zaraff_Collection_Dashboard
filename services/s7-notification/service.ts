import { type DbTransaction } from "@backend/lib/db";
import { notificationRepository } from "./repository";
import type { NotifTipe } from "./types";

export const notificationService = {
  listForIdentity: (user: { id: string; username: string }) =>
    notificationRepository.listForRecipients([user.id, user.username]),
  async send(
    data: { tipe: NotifTipe; tujuan: string; isi: string },
    tx?: DbTransaction,
  ) {
    return notificationRepository.create(
      {
        tipe: data.tipe,
        tujuan: data.tujuan,
        isi: data.isi,
        statusKirim: "terkirim (simulasi)",
      },
      tx,
    );
  },

  listAll: () => notificationRepository.list(),

  listForUser: (tujuan: string) => notificationRepository.listForUser(tujuan),
};
