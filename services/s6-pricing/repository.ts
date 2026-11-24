import { db, type DbTransaction } from "@backend/lib/db";
import type { PricingInput } from "./types";

type Writer = typeof db | DbTransaction;
export const pricingRepository = {
  suggest: (kategori: string, kondisi: string) => db.pricingRule.findMany({ where: { kategori, kondisi }, orderBy: { harga: "desc" } }),
  list: (tx?: Writer) => (tx ?? db).pricingRule.findMany({ orderBy: [{ kategori: "asc" }, { kondisi: "asc" }, { grade: "asc" }] }),
  replace: async (rules: PricingInput[], tx?: Writer) => {
    const writer = tx ?? db;
    await writer.pricingRule.deleteMany();
    return writer.pricingRule.createMany({ data: rules });
  },
};
