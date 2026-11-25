import { db, type DbTransaction } from "@backend/lib/db";
import { pricingRepository } from "./repository";
import type { PricingInput } from "./types";
import { errors } from "@backend/lib/errors";

export const pricingService = {
  async memberDiscount(tx?: DbTransaction): Promise<number> {
    const rule = await pricingRepository.memberDiscount(tx);
    if (!rule || rule.persen < 0 || rule.persen > 100)
      throw errors.konflik(
        "Aturan diskon member harus tersedia dengan persen 0 sampai 100",
      );
    return rule.persen;
  },
  suggest: (kategori: string, kondisi: string) =>
    pricingRepository.suggest(kategori, kondisi),
  rules: () => pricingRepository.list(),
  async replaceRules(rules: PricingInput[], tx?: DbTransaction) {
    if (tx) {
      await pricingRepository.replace(rules, tx);
      return pricingRepository.list(tx);
    }
    return db.$transaction(async (transaction) => {
      await pricingRepository.replace(rules, transaction);
      return pricingRepository.list(transaction);
    });
  },
};
