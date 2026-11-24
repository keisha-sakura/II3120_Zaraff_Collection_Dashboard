import { z } from "zod";

export const suggestSchema = z.object({ kategori: z.string().min(1), kondisi: z.string().min(1) });
export const pricingRuleSchema = z.object({ kategori: z.string().trim().min(1), kondisi: z.string().trim().min(1), grade: z.enum(["A", "B", "C"]), harga: z.number().int().positive() }).strict();
export const pricingRulesSchema = z.object({ rules: z.array(pricingRuleSchema).min(1) }).strict();
