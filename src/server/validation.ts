import { z } from "zod";
import { categories, conditions } from "../features/gudang/model.ts";
const id = z.string().trim().min(1).max(120);
const money = z.number().int().min(1).max(1_000_000_000);
const date = z
  .string()
  .refine((value) => Number.isFinite(Date.parse(value)), "Tanggal tidak valid");
const grade = z.enum(["A", "B", "C"]);
const customer = z
  .object({
    name: z.string().trim().min(1).max(120),
    handle: z.string().trim().min(2).max(32),
    phone: z.string().trim().max(40),
    isMember: z.boolean(),
  })
  .strict();
export const warehouseCommand = z.discriminatedUnion("type", [
  z
    .object({
      type: z.literal("receive"),
      input: z
        .object({
          supplier: z.string().trim().min(1).max(120),
          category: z.string().trim().min(1).max(120),
          weightKg: z.number().positive().max(10000),
          estimatedItems: z.number().int().positive().max(100000),
          receivedAt: date,
          locationId: id,
        })
        .strict(),
    })
    .strict(),
  z.object({ type: z.literal("start-sort"), baleId: id }).strict(),
  z.object({ type: z.literal("finish-sort"), baleId: id }).strict(),
  z
    .object({
      type: z.literal("record-item"),
      input: z
        .object({
          baleId: id,
          category: z.enum(categories),
          condition: z.enum(conditions),
          outcome: z.enum(["laundry", "return"]),
          reason: z.string().max(500),
        })
        .strict(),
    })
    .strict(),
  z
    .object({
      type: z.literal("grade"),
      itemId: id,
      grade,
      price: money,
      locationId: id,
      confirmedClean: z.boolean(),
    })
    .strict(),
  z.object({ type: z.literal("move"), itemId: id, locationId: id }).strict(),
]);
export const salesCommand = z.discriminatedUnion("type", [
  z.object({ type: z.literal("discard-draft") }).strict(),
  z.object({ type: z.literal("start-draft"), liveId: id.optional() }).strict(),
  z
    .object({
      type: z.literal("save-content"),
      input: z
        .object({
          title: z.string().trim().min(1).max(200),
          content: z.string().max(10000),
          scheduledAt: date,
          hostId: id,
          promotionChannels: z
            .array(z.enum(["Instagram", "TikTok", "Shopee"]))
            .max(3),
        })
        .strict(),
    })
    .strict(),
  z
    .object({
      type: z.literal("select-items"),
      itemIds: z.array(id).min(1).max(500),
    })
    .strict(),
  z.object({ type: z.literal("save-live"), publish: z.boolean() }).strict(),
  z
    .object({
      type: z.literal("process-claims"),
      liveId: id,
      text: z.string().min(1).max(1_000_000),
    })
    .strict(),
  z.object({ type: z.literal("add-customer"), input: customer }).strict(),
  z
    .object({
      type: z.literal("update-customer"),
      customerId: id,
      input: customer,
    })
    .strict(),
  z.object({ type: z.literal("complete-live"), liveId: id }).strict(),
]);
export const paymentCommand = z.discriminatedUnion("type", [
  z.object({ type: z.literal("approve"), paymentId: id }).strict(),
  z
    .object({
      type: z.literal("reject"),
      paymentId: id,
      reason: z.string().trim().min(3).max(500),
    })
    .strict(),
  z
    .object({
      type: z.literal("remind"),
      invoiceId: id,
      requestId: z.string().min(6).max(100),
    })
    .strict(),
  z
    .object({
      type: z.literal("submit"),
      orderId: id,
      method: z.enum(["transfer", "deposit"]),
      amount: z.number().int().min(0).max(1_000_000_000),
      proofId: id.optional(),
    })
    .strict(),
]);
export const shippingCommand = z.discriminatedUnion("type", [
  z
    .object({
      type: z.literal("update-tracking"),
      orderId: id,
      status: z.enum(["in-transit", "delivered"]),
      description: z.string().trim().min(3).max(500),
    })
    .strict(),
  z
    .object({
      type: z.literal("save-checklist"),
      orderId: id,
      checklist: z
        .object({
          pickedItemIds: z.array(id).max(500),
          codeMatches: z.boolean(),
          conditionMatches: z.boolean(),
          packed: z.boolean(),
        })
        .strict(),
    })
    .strict(),
  z.object({ type: z.literal("mark-packed"), orderId: id }).strict(),
  z
    .object({
      type: z.literal("dispatch"),
      orderId: id,
      courier: z.enum(["JNE", "J&T Express"]),
      trackingNumber: z.string().trim().min(5).max(64),
      handedOver: z.boolean(),
    })
    .strict(),
]);
export const reportsCommand = z.discriminatedUnion("type", [
  z
    .object({
      type: z.literal("save-strategy"),
      month: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/),
      content: z.string().trim().min(1).max(10000),
    })
    .strict(),
  z
    .object({
      type: z.literal("send-strategy"),
      strategyId: id,
      recipientIds: z.array(id).min(1).max(100),
    })
    .strict(),
]);
export const settingsCommand = z.discriminatedUnion("type", [
  z
    .object({
      type: z.literal("save-prices"),
      priceRules: z.object(
        Object.fromEntries(
          categories.map((category) => [
            category,
            z.object({ A: money, B: money, C: money }).strict(),
          ]),
        ),
      ),
    })
    .strict(),
  z
    .object({
      type: z.literal("save-discount"),
      percent: z.number().min(0).max(100),
    })
    .strict(),
  z
    .object({
      type: z.literal("add-location"),
      code: z.string().trim().min(1).max(32),
      description: z.string().trim().min(1).max(160),
    })
    .strict(),
]);
export const depositCommand = z
  .object({
    type: z.literal("top-up"),
    customerId: id,
    amount: money,
    description: z.string().trim().min(3).max(200),
  })
  .strict();
