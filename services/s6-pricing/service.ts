import { db, type DbTransaction } from "@backend/lib/db";
import { pricingRepository } from "./repository";
import type { PricingInput } from "./types";

export const pricingService = {
  suggest: (kategori: string, kondisi: string) => pricingRepository.suggest(kategori, kondisi),
  rules: () => pricingRepository.list(),
  async replaceRules(rules: PricingInput[], tx?: DbTransaction) {
    if (tx) { await pricingRepository.replace(rules, tx); return pricingRepository.list(tx); }
    return db.$transaction(async (transaction) => { await pricingRepository.replace(rules, transaction); return pricingRepository.list(transaction); });
  },
};
