import { db } from "@backend/lib/db";
import { errors } from "@backend/lib/errors";
import { staffIds } from "@backend/lib/users";
import { notificationService } from "@backend/services/s7-notification/service";
import { strategyRepository } from "./repository";
import { strategySchema } from "./schemas";
import type { StrategyInput } from "./types";
import type { Strategy } from "@prisma/client";
export const strategyService = {
  list: (): Promise<Strategy[]> => strategyRepository.list(),
  async create(input: StrategyInput, userId: string): Promise<Strategy> {
    strategySchema.parse(input);
    return db.$transaction(async (tx) => {
      if (await strategyRepository.find(input.periode, tx))
        throw errors.konflik("Strategi untuk periode ini sudah ada");
      const recipients = [...new Set(input.penerimaUserIds)];
      const found = await staffIds(recipients, tx);
      if (found.length !== recipients.length)
        throw errors.tidakDitemukan("Salah satu staf penerima tidak ditemukan");
      const strategy = await strategyRepository.create(
        { periode: input.periode, isi: input.isi, dibuatOleh: userId },
        tx,
      );
      for (const tujuan of recipients)
        await notificationService.send(
          {
            tipe: "strategi",
            tujuan,
            isi: JSON.stringify({
              idStrategi: strategy.id,
              periode: input.periode,
              isi: input.isi,
            }),
          },
          tx,
        );
      return strategy;
    });
  },
};
